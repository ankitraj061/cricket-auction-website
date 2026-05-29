import { Request, Response } from 'express';
import { PrismaClient, Role, UserRole, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const ensureAdmin = (req: Request, res: Response): boolean => {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return false;
  }
  return true;
};

const DEFAULT_AUCTION_SETTINGS = {
  id: 1,
  seasonName: 'Season 1',
  initialPurse: 100000,
  minPlayersPerTeam: 0,
  maxPlayersPerTeam: 11,
  playerOrderByBasePrice: 'DESC',
  playerOrderByRole: 'NO_ORDER',
  allowedBasePrices: [2000, 3000, 5000],
  isExchangeAllowed: false,
};

let auctionSettingsSchemaEnsured = false;

const ensureAuctionSettingsSchema = async () => {
  if (auctionSettingsSchemaEnsured) return;

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "AuctionSettings"
    ADD COLUMN IF NOT EXISTS "playerOrderByBasePrice" TEXT NOT NULL DEFAULT 'DESC',
    ADD COLUMN IF NOT EXISTS "playerOrderByRole" TEXT NOT NULL DEFAULT 'NO_ORDER',
    ADD COLUMN IF NOT EXISTS "allowedBasePrices" INTEGER[] NOT NULL DEFAULT ARRAY[2000,3000,5000]::INTEGER[],
    ADD COLUMN IF NOT EXISTS "isExchangeAllowed" BOOLEAN NOT NULL DEFAULT false
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "AuctionSettings" (
      "id",
      "seasonName",
      "initialPurse",
      "minPlayersPerTeam",
      "maxPlayersPerTeam",
      "createdAt",
      "updatedAt"
    )
    VALUES (1, 'Season 1', 100000, 0, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("id") DO NOTHING
  `);

  auctionSettingsSchemaEnsured = true;
};

const BASE_PRICE_ORDERS = ['ASC', 'DESC', 'NONE'] as const;
type BasePriceOrder = (typeof BASE_PRICE_ORDERS)[number];

const ROLE_ORDERS = ['NO_ORDER', 'BATSMAN_FIRST', 'BOWLER_FIRST', 'ALLROUNDER_FIRST'] as const;
type RoleOrder = (typeof ROLE_ORDERS)[number];

const getRolePriorityWeight = (role: Role, roleOrder: RoleOrder): number => {
  if (roleOrder === 'NO_ORDER') return 0;

  if (roleOrder === 'BATSMAN_FIRST') {
    if (role === Role.BATSMAN) return 0;
    if (role === Role.BOWLER) return 1;
    if (role === Role.ALLROUNDER) return 2;
    return 3;
  }

  if (roleOrder === 'BOWLER_FIRST') {
    if (role === Role.BOWLER) return 0;
    if (role === Role.BATSMAN) return 1;
    if (role === Role.ALLROUNDER) return 2;
    return 3;
  }

  if (role === Role.ALLROUNDER) return 0;
  if (role === Role.BATSMAN) return 1;
  if (role === Role.BOWLER) return 2;
  return 3;
};

const sortPlayersForAuction = (
  players: Awaited<ReturnType<typeof prisma.player.findMany>>,
  basePriceOrder: BasePriceOrder,
  roleOrder: RoleOrder
) => {
  return [...players].sort((a, b) => {
    // Manual auction order takes priority; null/undefined falls to the end
    const aOrder = a.auctionOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.auctionOrder ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;

    // Fall back to settings-based ordering for players without a manual order
    if (roleOrder !== 'NO_ORDER') {
      const roleDelta = getRolePriorityWeight(a.role, roleOrder) - getRolePriorityWeight(b.role, roleOrder);
      if (roleDelta !== 0) return roleDelta;
    }

    if (basePriceOrder !== 'NONE') {
      const priceDelta = basePriceOrder === 'ASC' ? a.basePrice - b.basePrice : b.basePrice - a.basePrice;
      if (priceDelta !== 0) return priceDelta;
    }

    return a.id - b.id;
  });
};

const getNextPlayerBySettings = async () => {
  const settings = await getAuctionSettings();
  const basePriceOrder = BASE_PRICE_ORDERS.includes(settings.playerOrderByBasePrice as BasePriceOrder)
    ? (settings.playerOrderByBasePrice as BasePriceOrder)
    : 'DESC';
  const roleOrder = ROLE_ORDERS.includes(settings.playerOrderByRole as RoleOrder)
    ? (settings.playerOrderByRole as RoleOrder)
    : 'NO_ORDER';

  const candidates = await prisma.player.findMany({
    where: {
      isSold: false,
      isUnsold: false,
    },
  });

  const ordered = sortPlayersForAuction(candidates, basePriceOrder, roleOrder);
  return ordered[0] || null;
};

const normalizeAllowedBasePrices = (input: unknown): number[] => {
  if (!Array.isArray(input)) return [];
  const cleaned = input
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
  return [...new Set(cleaned)].sort((a, b) => a - b);
};

const isRetryableTransactionError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes('transaction not found') ||
    normalized.includes('transaction already closed') ||
    normalized.includes('expired transaction')
  );
};

const runTransactionWithRetry = async <T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  retries = 1
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await prisma.$transaction((tx) => callback(tx), {
        maxWait: 10000,
        timeout: 15000,
      });
    } catch (error) {
      lastError = error;
      if (!isRetryableTransactionError(error) || attempt === retries) {
        throw error;
      }
    }
  }

  throw lastError;
};

const getAuctionSettings = async (tx: PrismaClient | Prisma.TransactionClient = prisma) => {
  // Fallback for environments where DB migrations are blocked/unavailable.
  if (tx === prisma) {
    await ensureAuctionSettingsSchema();
  }
  return tx.auctionSettings.upsert({
    where: { id: 1 },
    update: {},
    create: DEFAULT_AUCTION_SETTINGS,
  });
};

export const getAllPlayers = async (req: Request, res: Response): Promise<void> => {
  try {
    const [players, teams] = await Promise.all([
      prisma.player.findMany({
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { basePrice: 'desc' }, // 5k first
          { role: 'asc' }, // BOWLER, BATSMAN, ALLROUNDER based on enum order
          { name: 'asc' },
        ],
      }),
      prisma.team.findMany({
        select: {
          id: true,
          name: true,
          captainName: true,
          captainImage: true,
          currentPurse: true,
          _count: {
            select: {
              players: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    const teamsResponse = teams.map((team) => ({
      id: team.id,
      name: team.name,
      captainName: team.captainName,
      captainImage: team.captainImage,
      currentPurse: team.currentPurse,
      remainingPurse: team.currentPurse,
      totalPlayers: team._count.players,
    }));

    res.json({ players, teams: teamsResponse });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        captainName: true,
        captainImage: true,
        currentPurse: true,
        _count: {
          select: {
            players: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const response = teams.map((team) => ({
      id: team.id,
      name: team.name,
      captainName: team.captainName,
      captainImage: team.captainImage,
      currentPurse: team.currentPurse,
      remainingPurse: team.currentPurse,
      totalPlayers: team._count.players,
    }));

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeamById = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        captainName: true,
        captainImage: true,
        currentPurse: true,
        players: {
          select: {
            id: true,
            name: true,
            role: true,
            basePrice: true,
            mobile: true,
            description: true,
            stats: true,
            playerImageUrl: true,
            isSold: true,
            teamId: true,
            soldPrice: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ isSold: 'desc' }, { soldPrice: 'desc' }, { basePrice: 'desc' }, { name: 'asc' }],
        },
      },
    });
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    res.json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getNextPlayerForAuction = async (req: Request, res: Response): Promise<void> => {
  try {
    let player = await getNextPlayerBySettings();

    // Step 2: If no fresh players, start second round with previously unsold players
    if (!player) {
      // Check if there are any unsold players
      const unsoldCount = await prisma.player.count({
        where: {
          isSold: false,
          isUnsold: true
        }
      });

      if (unsoldCount > 0) {
        // Reset ALL unsold players for second round of bidding
        await prisma.player.updateMany({
          where: {
            isSold: false,
            isUnsold: true
          },
          data: {
            isUnsold: false,
            basePrice: 2000  // Reset to base price for second round
          }
        });

        player = await getNextPlayerBySettings();
      }
    }

    if (!player) {
      res.status(404).json({ error: 'No players remaining for auction' });
      return;
    }

    res.json(player);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const markPlayerUnsold = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;
  try {
    const playerId = parseInt(req.params.id, 10);
    const player = await prisma.player.findUnique({ where: { id: playerId } });

    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    // If player was sold, refund the team
    let refundedTeamId: number | null = null;
    let refundedAmount = 0;
    if (player.teamId && player.soldPrice) {
      const team = await prisma.team.findUnique({ where: { id: player.teamId } });
      if (team) {
        await prisma.team.update({
          where: { id: team.id },
          data: {
            currentPurse: team.currentPurse + player.soldPrice,
          },
        });
        refundedTeamId = team.id;
        refundedAmount = player.soldPrice;
      }
    }

    // Mark as unsold
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        isSold: false,
        isUnsold: true,
        soldPrice: null,
        teamId: null,
        // Don't reset basePrice here - keep it for sorting
      },
    });

    res.json({
      message: 'Player marked unsold and purse updated',
      player: updatedPlayer,
      refundedTeamId,
      refundedAmount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markAllPlayersUnsold = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;

  try {
    const refundedTeamsRows = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(DISTINCT "teamId")::int AS count
      FROM "Player"
      WHERE "isSold" = true
        AND "soldPrice" IS NOT NULL
        AND "teamId" IS NOT NULL
    `;
    const refundedTeams = Number(refundedTeamsRows[0]?.count || 0);

    const [, playerUpdateResult] = await prisma.$transaction([
      prisma.$executeRaw`
        UPDATE "Team" AS t
        SET "currentPurse" = t."currentPurse" + refund.total_refund
        FROM (
          SELECT "teamId" AS team_id, SUM("soldPrice")::int AS total_refund
          FROM "Player"
          WHERE "isSold" = true
            AND "soldPrice" IS NOT NULL
            AND "teamId" IS NOT NULL
          GROUP BY "teamId"
        ) AS refund
        WHERE t."id" = refund.team_id
      `,
      prisma.player.updateMany({
        data: {
          isSold: false,
          isUnsold: true,
          soldPrice: null,
          teamId: null,
        },
      }),
    ]);

    const result = {
      affectedPlayers: playerUpdateResult.count,
      refundedTeams,
    };

    res.json({
      message: 'All players marked as unsold',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};



export const getAuctionSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const auctionSettings = await getAuctionSettings();
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        currentPurse: true,
        players: { select: { id: true } },
      },
    });

    const summary = teams.map(team => ({
      teamId: team.id,
      name: team.name,
      totalPlayers: team.players.length,
      remainingPurse: team.currentPurse,
      minPlayersPerTeam: auctionSettings.minPlayersPerTeam,
      maxPlayersPerTeam: auctionSettings.maxPlayersPerTeam,
    }));

    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// export const markPlayerUnsold = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const playerId = parseInt(req.params.id, 10);
//     const player = await prisma.player.findUnique({ where: { id: playerId } });

//     if (!player) {
//       res.status(404).json({ error: 'Player not found' });
//       return;
//     }

   

//     await prisma.player.update({
//       where: { id: playerId },
//       data: {
//         isSold: false,
//         basePrice: 2000,  // Reset to 2000 as your rule
//         soldPrice: null,
//       },
//     });

//     if (player.teamId) {
//       const team = await prisma.team.findUnique({ where: { id: player.teamId } });
//       if (team) {
//         await prisma.team.update({
//           where: { id: team.id },
//           data: {
//             currentPurse: team.currentPurse + (player.soldPrice ?? 0),
//           },
//         });
//       }
//     }

//     res.json({ message: 'Player marked unsold and purse updated' });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };


export const searchPlayersForAuction = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchTerm = (req.query.q as string) || '';
    const players = await prisma.player.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      orderBy: { basePrice: 'desc' },
    });
    res.json(players);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

interface SellPlayerRequest {
  playerId: number;
  teamId: number;
  soldPrice: number;
}

interface ExchangePlayersRequest {
  incomingPlayerId: number;
  requestedTeamId: number;
  outgoingPlayerId?: number | null;
  cashToOtherTeam?: number;
}

export const sellPlayer = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;
  try {
    const { playerId, teamId, soldPrice }: SellPlayerRequest = req.body;

    if (!playerId || !teamId || !soldPrice || soldPrice <= 0) {
      res.status(400).json({ error: 'playerId, teamId and valid soldPrice are required' });
      return;
    }

    const auctionSettings = await getAuctionSettings();
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const targetTeam = await prisma.team.findUnique({ where: { id: teamId } });
    if (!targetTeam) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    if (player.teamId !== teamId) {
      const targetTeamPlayersCount = await prisma.player.count({
        where: { teamId, isSold: true },
      });
      if (targetTeamPlayersCount >= auctionSettings.maxPlayersPerTeam) {
        res
          .status(400)
          .json({ error: `Team already has maximum allowed players (${auctionSettings.maxPlayersPerTeam})` });
        return;
      }
    }

    let targetTeamPurse = targetTeam.currentPurse;
    let previousTeamRefundUpdate: { teamId: number; updatedPurse: number } | null = null;

    if (player.isSold && player.teamId && player.soldPrice) {
      if (player.teamId === teamId) {
        const priceDelta = soldPrice - player.soldPrice;
        if (priceDelta > targetTeamPurse) {
          res.status(400).json({ error: 'Not enough purse in the team' });
          return;
        }
        targetTeamPurse -= priceDelta;
      } else {
        const oldTeam = await prisma.team.findUnique({ where: { id: player.teamId } });
        if (!oldTeam) {
          res.status(404).json({ error: 'Previous team not found' });
          return;
        }
        if (soldPrice > targetTeamPurse) {
          res.status(400).json({ error: 'Not enough purse in the team' });
          return;
        }
        targetTeamPurse -= soldPrice;
        previousTeamRefundUpdate = {
          teamId: oldTeam.id,
          updatedPurse: oldTeam.currentPurse + player.soldPrice,
        };
      }
    } else {
      if (soldPrice > targetTeamPurse) {
        res.status(400).json({ error: 'Not enough purse in the team' });
        return;
      }
      targetTeamPurse -= soldPrice;
    }

    await runTransactionWithRetry(async (tx) => {
      if (previousTeamRefundUpdate) {
        await tx.team.update({
          where: { id: previousTeamRefundUpdate.teamId },
          data: { currentPurse: previousTeamRefundUpdate.updatedPurse },
        });
      }

      await tx.team.update({
        where: { id: teamId },
        data: { currentPurse: targetTeamPurse },
      });

      await tx.player.update({
        where: { id: playerId },
        data: {
          isSold: true,
          isUnsold: false,
          soldPrice,
          teamId,
        },
      });
    });

    const result = {
      message: player.isSold ? 'Player sale updated successfully' : 'Player sold successfully',
      remainingPurse: targetTeamPurse,
    };

    res.json(result);
  } catch (error: any) {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};

export const exchangePlayersHandler = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;
  try {
    const {
      incomingPlayerId,
      requestedTeamId,
      outgoingPlayerId,
      cashToOtherTeam = 0,
    }: ExchangePlayersRequest = req.body;

    if (!incomingPlayerId || !requestedTeamId) {
      res.status(400).json({ error: 'incomingPlayerId and requestedTeamId are required' });
      return;
    }
    if (!Number.isInteger(cashToOtherTeam) || cashToOtherTeam < 0) {
      res.status(400).json({ error: 'cashToOtherTeam must be a non-negative integer' });
      return;
    }

    const settings = await getAuctionSettings();
    if (!settings.isExchangeAllowed) {
      res.status(400).json({ error: 'Player exchange is disabled in auction settings' });
      return;
    }

    const incomingPlayer = await prisma.player.findUnique({ where: { id: incomingPlayerId } });
    if (!incomingPlayer || !incomingPlayer.isSold || !incomingPlayer.teamId) {
      res.status(400).json({ error: 'Incoming player must be a sold player assigned to a team' });
      return;
    }

    if (incomingPlayer.teamId === requestedTeamId) {
      res.status(400).json({ error: 'Player already belongs to the requested team' });
      return;
    }

    const [requestedTeam, currentOwnerTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: requestedTeamId } }),
      prisma.team.findUnique({ where: { id: incomingPlayer.teamId } }),
    ]);

    if (!requestedTeam || !currentOwnerTeam) {
      res.status(404).json({ error: 'One or more teams not found' });
      return;
    }

    const normalizedOutgoingId = outgoingPlayerId ?? null;
    let outgoingPlayer: Awaited<ReturnType<typeof prisma.player.findUnique>> | null = null;
    if (normalizedOutgoingId) {
      if (normalizedOutgoingId === incomingPlayerId) {
        res.status(400).json({ error: 'incoming and outgoing players cannot be the same' });
        return;
      }
      outgoingPlayer = await prisma.player.findUnique({ where: { id: normalizedOutgoingId } });
      if (!outgoingPlayer || !outgoingPlayer.isSold || outgoingPlayer.teamId !== requestedTeamId) {
        res.status(400).json({ error: 'Outgoing player must be a sold player from requested team' });
        return;
      }
    }

    if (!normalizedOutgoingId) {
      const requestedTeamPlayersCount = await prisma.player.count({
        where: { teamId: requestedTeamId, isSold: true },
      });
      if (requestedTeamPlayersCount >= settings.maxPlayersPerTeam) {
        res.status(400).json({ error: `Requested team already has maximum allowed players (${settings.maxPlayersPerTeam})` });
        return;
      }
    }

    if (requestedTeam.currentPurse < cashToOtherTeam) {
      res.status(400).json({ error: 'Requested team does not have enough purse for cash adjustment' });
      return;
    }

    await runTransactionWithRetry(async (tx) => {
      if (cashToOtherTeam > 0) {
        await tx.team.update({
          where: { id: requestedTeamId },
          data: { currentPurse: requestedTeam.currentPurse - cashToOtherTeam },
        });
        await tx.team.update({
          where: { id: currentOwnerTeam.id },
          data: { currentPurse: currentOwnerTeam.currentPurse + cashToOtherTeam },
        });
      }

      await tx.player.update({
        where: { id: incomingPlayerId },
        data: { teamId: requestedTeamId, isSold: true, isUnsold: false },
      });

      if (outgoingPlayer) {
        await tx.player.update({
          where: { id: outgoingPlayer.id },
          data: { teamId: currentOwnerTeam.id, isSold: true, isUnsold: false },
        });
      }
    });

    res.json({
      message: 'Player exchange completed successfully',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addPlayerHandler = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;
  try {
    const {
      name,
      role,
      basePrice,
      mobile,
      description,
      stats,
      playerImageUrl,
    }: {
      name: string;
      role: Role;
      basePrice: number;
      mobile: string;
      description: string;
      stats: string;
      playerImageUrl: string;
    } = req.body;

    if (!name || !role || !basePrice) {
      res.status(400).json({ error: 'Name, role and basePrice are required' });
      return;
    }
    const auctionSettings = await getAuctionSettings();
    if (!auctionSettings.allowedBasePrices.includes(basePrice)) {
      res.status(400).json({ error: `basePrice must be one of: ${auctionSettings.allowedBasePrices.join(', ')}` });
      return;
    }

    const createdPlayer = await addPlayer(name, role, basePrice, mobile, description, stats, playerImageUrl);

    res.status(201).json({ message: 'Player added successfully', player: createdPlayer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePlayerHandler = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;

  try {
    const playerId = parseInt(req.params.id, 10);
    if (Number.isNaN(playerId)) {
      res.status(400).json({ error: 'Invalid player id' });
      return;
    }

    const {
      name,
      role,
      basePrice,
      mobile,
      description,
      stats,
      playerImageUrl,
    }: {
      name?: string;
      role?: Role;
      basePrice?: number;
      mobile?: string;
      description?: string;
      stats?: string;
      playerImageUrl?: string;
    } = req.body;

    const data: Prisma.PlayerUpdateInput = {};

    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (basePrice !== undefined && basePrice <= 0) {
      res.status(400).json({ error: 'basePrice must be greater than 0' });
      return;
    }
    if (mobile !== undefined) data.mobile = mobile || null;
    if (description !== undefined) data.description = description || null;
    if (stats !== undefined) data.stats = stats || null;
    if (playerImageUrl !== undefined) data.playerImageUrl = playerImageUrl || null;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No fields provided for update' });
      return;
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    if (basePrice !== undefined) {
      const auctionSettings = await getAuctionSettings();
      const isChangedBasePrice = basePrice !== player.basePrice;
      if (isChangedBasePrice && !auctionSettings.allowedBasePrices.includes(basePrice)) {
        res.status(400).json({ error: `basePrice must be one of: ${auctionSettings.allowedBasePrices.join(', ')}` });
        return;
      }
      data.basePrice = basePrice;
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data,
    });

    res.json({ message: 'Player updated successfully', player: updatedPlayer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePlayerHandler = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;

  try {
    const playerId = parseInt(req.params.id, 10);
    if (Number.isNaN(playerId)) {
      res.status(400).json({ error: 'Invalid player id' });
      return;
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    let refundedTeamId: number | null = null;
    let refundedAmount = 0;
    const ops: Prisma.PrismaPromise<unknown>[] = [];
    if (player.teamId && player.soldPrice) {
      const team = await prisma.team.findUnique({ where: { id: player.teamId } });
      if (team) {
        refundedTeamId = team.id;
        refundedAmount = player.soldPrice;
        ops.push(
          prisma.team.update({
            where: { id: team.id },
            data: { currentPurse: team.currentPurse + player.soldPrice },
          })
        );
      }
    }
    ops.push(prisma.player.delete({ where: { id: playerId } }));
    await prisma.$transaction(ops);

    res.json({
      message: 'Player deleted successfully',
      deletedPlayerId: playerId,
      refundedTeamId,
      refundedAmount,
    });
  } catch (error: any) {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};

export const addPlayer = async (
  name: string,
  role: Role,
  basePrice: number,
  mobile: string,
  description: string,
  stats: string,
  playerImageUrl: string
) => {
  return prisma.player.create({
    data: {
      name,
      role,
      basePrice,
      mobile,
      description,
      stats,
      playerImageUrl,
      isSold: false,
    },
  });
};


export const createTeam = async (req: Request, res: Response): Promise<void> => {
    if (!ensureAdmin(req, res)) return;
    const {name , captainName, captainImage} = req.body;
    if(!name || !captainName ){
      res.status(400).json({error: 'Name and captainName are required'})
      return
    }
    try {
        const auctionSettings = await getAuctionSettings();
        const team = await prisma.team.create({
          data: {
            name,
            captainName,
            captainImage,
            currentPurse: auctionSettings.initialPurse,
          }
        });
        res.status(201).json({message: 'Team created successfully', team });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }

  };

export const updateTeamHandler = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;

  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      res.status(400).json({ error: 'Invalid team id' });
      return;
    }

    const { name, captainName, captainImage }: { name?: string; captainName?: string; captainImage?: string } =
      req.body;

    if (name !== undefined && !name.trim()) {
      res.status(400).json({ error: 'name cannot be empty' });
      return;
    }
    if (captainName !== undefined && !captainName.trim()) {
      res.status(400).json({ error: 'captainName cannot be empty' });
      return;
    }

    const data: Prisma.TeamUpdateInput = {};
    if (name !== undefined) data.name = name.trim();
    if (captainName !== undefined) data.captainName = captainName.trim();
    if (captainImage !== undefined) data.captainImage = captainImage || null;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No fields provided for update' });
      return;
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data,
    });

    res.json({ message: 'Team updated successfully', team: updatedTeam });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTeamHandler = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;

  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      res.status(400).json({ error: 'Invalid team id' });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    if (team._count.players > 0) {
      res.status(400).json({ error: 'Cannot delete a team that already has players' });
      return;
    }

    await prisma.team.delete({ where: { id: teamId } });
    res.json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuctionSettingsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getAuctionSettings();
    const normalizedSettings = {
      id: settings.id,
      seasonName: settings.seasonName,
      initialPurse: settings.initialPurse,
      minPlayersPerTeam: settings.minPlayersPerTeam,
      maxPlayersPerTeam: settings.maxPlayersPerTeam,
      playerOrderByBasePrice: settings.playerOrderByBasePrice ?? 'DESC',
      playerOrderByRole: settings.playerOrderByRole ?? 'NO_ORDER',
      allowedBasePrices:
        Array.isArray(settings.allowedBasePrices) && settings.allowedBasePrices.length > 0
          ? settings.allowedBasePrices
          : [2000, 3000, 5000],
      isExchangeAllowed: Boolean(settings.isExchangeAllowed),
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
    res.json(normalizedSettings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAuctionSettingsHandler = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;
  try {
    const {
      seasonName,
      initialPurse,
      minPlayersPerTeam,
      maxPlayersPerTeam,
      playerOrderByBasePrice,
      playerOrderByRole,
      allowedBasePrices,
      isExchangeAllowed,
      applyToExistingTeams,
    }: {
      seasonName: string;
      initialPurse: number;
      minPlayersPerTeam: number;
      maxPlayersPerTeam: number;
      playerOrderByBasePrice: BasePriceOrder;
      playerOrderByRole: RoleOrder;
      allowedBasePrices: number[];
      isExchangeAllowed: boolean;
      applyToExistingTeams?: boolean;
    } = req.body;

    if (!seasonName || !seasonName.trim()) {
      res.status(400).json({ error: 'seasonName is required' });
      return;
    }
    if (!Number.isInteger(initialPurse) || initialPurse <= 0) {
      res.status(400).json({ error: 'initialPurse must be a positive integer' });
      return;
    }
    if (!Number.isInteger(minPlayersPerTeam) || minPlayersPerTeam < 0) {
      res.status(400).json({ error: 'minPlayersPerTeam must be a non-negative integer' });
      return;
    }
    if (!Number.isInteger(maxPlayersPerTeam) || maxPlayersPerTeam <= 0) {
      res.status(400).json({ error: 'maxPlayersPerTeam must be a positive integer' });
      return;
    }
    if (minPlayersPerTeam > maxPlayersPerTeam) {
      res.status(400).json({ error: 'minPlayersPerTeam cannot be greater than maxPlayersPerTeam' });
      return;
    }
    if (!BASE_PRICE_ORDERS.includes(playerOrderByBasePrice)) {
      res.status(400).json({ error: 'playerOrderByBasePrice must be one of ASC, DESC, NONE' });
      return;
    }
    if (!ROLE_ORDERS.includes(playerOrderByRole)) {
      res.status(400).json({ error: 'playerOrderByRole must be one of NO_ORDER, BATSMAN_FIRST, BOWLER_FIRST, ALLROUNDER_FIRST' });
      return;
    }
    if (typeof isExchangeAllowed !== 'boolean') {
      res.status(400).json({ error: 'isExchangeAllowed must be boolean' });
      return;
    }
    const normalizedBasePrices = normalizeAllowedBasePrices(allowedBasePrices);
    if (normalizedBasePrices.length === 0) {
      res.status(400).json({ error: 'allowedBasePrices must contain at least one positive integer' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const settings = await tx.auctionSettings.upsert({
        where: { id: 1 },
        update: {
          seasonName: seasonName.trim(),
          initialPurse,
          minPlayersPerTeam,
          maxPlayersPerTeam,
          playerOrderByBasePrice,
          playerOrderByRole,
          allowedBasePrices: normalizedBasePrices,
          isExchangeAllowed,
        },
        create: {
          id: 1,
          seasonName: seasonName.trim(),
          initialPurse,
          minPlayersPerTeam,
          maxPlayersPerTeam,
          playerOrderByBasePrice,
          playerOrderByRole,
          allowedBasePrices: normalizedBasePrices,
          isExchangeAllowed,
        },
      });

      let updatedTeams = 0;
      if (applyToExistingTeams) {
        const updateResult = await tx.team.updateMany({
          data: {
            currentPurse: initialPurse,
          },
        });
        updatedTeams = updateResult.count;
      }

      return { settings, updatedTeams };
    });

    res.json({
      message: 'Auction settings updated successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const reorderPlayersHandler = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;

  try {
    const orders: { id: number; auctionOrder: number }[] = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      res.status(400).json({ error: 'Expected a non-empty array of { id, auctionOrder }' });
      return;
    }

    for (const item of orders) {
      if (typeof item.id !== 'number' || typeof item.auctionOrder !== 'number') {
        res.status(400).json({ error: 'Each item must have numeric id and auctionOrder' });
        return;
      }
    }

    await prisma.$transaction(
      orders.map(({ id, auctionOrder }) =>
        prisma.player.update({
          where: { id },
          data: { auctionOrder },
        })
      )
    );

    res.json({ message: 'Auction order saved successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
