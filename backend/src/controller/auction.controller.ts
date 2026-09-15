import { Request, Response } from 'express';
import mongoose, { ClientSession } from 'mongoose';
import { Team, Player, AuctionSettings, Role, UserRole, IPlayer } from '../models/index.js';
import { getNextSequence } from '../models/Counter.js';
import { toApiPlayer, toApiTeam, toApiSettings } from '../utils/serialize.js';

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
  _id: 1,
  seasonName: 'Season 1',
  initialPurse: 100000,
  minPlayersPerTeam: 0,
  maxPlayersPerTeam: 11,
  playerOrderByBasePrice: 'DESC',
  playerOrderByRole: 'NO_ORDER',
  allowedBasePrices: [2000, 3000, 5000],
  isExchangeAllowed: false,
};

const BASE_PRICE_ORDERS = ['ASC', 'DESC', 'NONE'] as const;
type BasePriceOrder = (typeof BASE_PRICE_ORDERS)[number];

const ROLE_ORDERS = ['NO_ORDER', 'BATSMAN_FIRST', 'BOWLER_FIRST', 'ALLROUNDER_FIRST'] as const;
type RoleOrder = (typeof ROLE_ORDERS)[number];

const ROLE_SORT_RANK: Record<Role, number> = { BATSMAN: 0, BOWLER: 1, ALLROUNDER: 2 };

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
  players: IPlayer[],
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

    return a._id - b._id;
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

  const candidates = await Player.find({ isSold: false, isUnsold: false }).lean();

  const ordered = sortPlayersForAuction(candidates as unknown as IPlayer[], basePriceOrder, roleOrder);
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
  if (error && typeof error === 'object' && 'hasErrorLabel' in error) {
    const err = error as { hasErrorLabel: (label: string) => boolean };
    if (err.hasErrorLabel('TransientTransactionError') || err.hasErrorLabel('UnknownTransactionCommitResult')) {
      return true;
    }
  }
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes('transaction not found') ||
    normalized.includes('transaction already closed') ||
    normalized.includes('expired transaction')
  );
};

const runTransactionWithRetry = async <T>(
  callback: (session: ClientSession) => Promise<T>,
  retries = 1
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        result = await callback(session);
      });
      return result;
    } catch (error) {
      lastError = error;
      if (!isRetryableTransactionError(error) || attempt === retries) {
        throw error;
      }
    } finally {
      await session.endSession();
    }
  }

  throw lastError;
};

const getAuctionSettings = async (session?: ClientSession) => {
  const settings = await AuctionSettings.findOneAndUpdate(
    { _id: 1 },
    { $setOnInsert: DEFAULT_AUCTION_SETTINGS },
    { upsert: true, new: true, session }
  ).lean();
  return settings!;
};

const getTeamsWithPlayerCount = async () => {
  const teams = await Team.aggregate([
    { $sort: { name: 1 } },
    {
      $lookup: {
        from: 'players',
        localField: '_id',
        foreignField: 'teamId',
        as: 'players',
      },
    },
    {
      $project: {
        name: 1,
        captainName: 1,
        captainImage: 1,
        currentPurse: 1,
        totalPlayers: { $size: '$players' },
      },
    },
  ]);
  return teams;
};

export const getAllPlayers = async (req: Request, res: Response): Promise<void> => {
  try {
    const [players, teams] = await Promise.all([
      Player.find({}).populate({ path: 'teamId', select: '_id name' }).lean(),
      getTeamsWithPlayerCount(),
    ]);

    const orderedPlayers = [...players].sort((a: any, b: any) => {
      if (b.basePrice !== a.basePrice) return b.basePrice - a.basePrice;
      const roleDelta = ROLE_SORT_RANK[a.role as Role] - ROLE_SORT_RANK[b.role as Role];
      if (roleDelta !== 0) return roleDelta;
      return a.name.localeCompare(b.name);
    });

    const teamsResponse = teams.map((team: any) => ({
      id: team._id,
      name: team.name,
      captainName: team.captainName,
      captainImage: team.captainImage,
      currentPurse: team.currentPurse,
      remainingPurse: team.currentPurse,
      totalPlayers: team.totalPlayers,
    }));

    res.json({ players: orderedPlayers.map(toApiPlayer), teams: teamsResponse });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await getTeamsWithPlayerCount();

    const response = teams.map((team: any) => ({
      id: team._id,
      name: team.name,
      captainName: team.captainName,
      captainImage: team.captainImage,
      currentPurse: team.currentPurse,
      remainingPurse: team.currentPurse,
      totalPlayers: team.totalPlayers,
    }));

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeamById = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const team = await Team.findById(teamId).lean();
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const players = await Player.find({ teamId })
      .select('name role basePrice mobile description stats playerImageUrl isSold teamId soldPrice createdAt updatedAt')
      .sort({ isSold: -1, soldPrice: -1, basePrice: -1, name: 1 })
      .lean();

    res.json({ ...toApiTeam(team), players: players.map(toApiPlayer) });
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
      const unsoldCount = await Player.countDocuments({ isSold: false, isUnsold: true });

      if (unsoldCount > 0) {
        // Reset ALL unsold players for second round of bidding
        await Player.updateMany(
          { isSold: false, isUnsold: true },
          { $set: { isUnsold: false, basePrice: 2000 } } // Reset to base price for second round
        );

        player = await getNextPlayerBySettings();
      }
    }

    if (!player) {
      res.status(404).json({ error: 'No players remaining for auction' });
      return;
    }

    res.json(toApiPlayer(player));
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const markPlayerUnsold = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;
  try {
    const playerId = parseInt(req.params.id, 10);
    const player = await Player.findById(playerId).lean();

    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    // If player was sold, refund the team
    let refundedTeamId: number | null = null;
    let refundedAmount = 0;
    if (player.teamId && player.soldPrice) {
      const team = await Team.findByIdAndUpdate(
        player.teamId,
        { $inc: { currentPurse: player.soldPrice } },
        { new: true }
      ).lean();
      if (team) {
        refundedTeamId = team._id;
        refundedAmount = player.soldPrice;
      }
    }

    // Mark as unsold
    const updatedPlayer = await Player.findByIdAndUpdate(
      playerId,
      {
        $set: {
          isSold: false,
          isUnsold: true,
          soldPrice: null,
          teamId: null,
          // Don't reset basePrice here - keep it for sorting
        },
      },
      { new: true }
    ).lean();

    res.json({
      message: 'Player marked unsold and purse updated',
      player: toApiPlayer(updatedPlayer),
      refundedTeamId,
      refundedAmount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markAllPlayersUnsold = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;

  const session = await mongoose.startSession();
  try {
    let affectedPlayers = 0;
    let refundedTeams = 0;

    await session.withTransaction(async () => {
      const refunds = await Player.aggregate([
        { $match: { isSold: true, soldPrice: { $ne: null }, teamId: { $ne: null } } },
        { $group: { _id: '$teamId', totalRefund: { $sum: '$soldPrice' } } },
      ]).session(session);

      refundedTeams = refunds.length;

      if (refunds.length > 0) {
        await Team.bulkWrite(
          refunds.map((r: any) => ({
            updateOne: {
              filter: { _id: r._id },
              update: { $inc: { currentPurse: r.totalRefund } },
            },
          })),
          { session }
        );
      }

      const updateResult = await Player.updateMany(
        {},
        { $set: { isSold: false, isUnsold: true, soldPrice: null, teamId: null } },
        { session }
      );
      affectedPlayers = updateResult.modifiedCount;
    });

    res.json({
      message: 'All players marked as unsold',
      affectedPlayers,
      refundedTeams,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.endSession();
  }
};

export const getAuctionSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const auctionSettings = await getAuctionSettings();
    const teams = await getTeamsWithPlayerCount();

    const summary = teams.map((team: any) => ({
      teamId: team._id,
      name: team.name,
      totalPlayers: team.totalPlayers,
      remainingPurse: team.currentPurse,
      minPlayersPerTeam: auctionSettings.minPlayersPerTeam,
      maxPlayersPerTeam: auctionSettings.maxPlayersPerTeam,
    }));

    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const searchPlayersForAuction = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchTerm = (req.query.q as string) || '';
    const players = await Player.find({
      name: { $regex: escapeRegex(searchTerm), $options: 'i' },
    })
      .sort({ basePrice: -1 })
      .lean();
    res.json(players.map(toApiPlayer));
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
    const player = await Player.findById(playerId).lean();
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const targetTeam = await Team.findById(teamId).lean();
    if (!targetTeam) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    if (player.teamId !== teamId) {
      const targetTeamPlayersCount = await Player.countDocuments({ teamId, isSold: true });
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
        const oldTeam = await Team.findById(player.teamId).lean();
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
          teamId: oldTeam._id,
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

    await runTransactionWithRetry(async (session) => {
      if (previousTeamRefundUpdate) {
        await Team.findByIdAndUpdate(
          previousTeamRefundUpdate.teamId,
          { $set: { currentPurse: previousTeamRefundUpdate.updatedPurse } },
          { session }
        );
      }

      await Team.findByIdAndUpdate(teamId, { $set: { currentPurse: targetTeamPurse } }, { session });

      await Player.findByIdAndUpdate(
        playerId,
        { $set: { isSold: true, isUnsold: false, soldPrice, teamId } },
        { session }
      );
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

    const incomingPlayer = await Player.findById(incomingPlayerId).lean();
    if (!incomingPlayer || !incomingPlayer.isSold || !incomingPlayer.teamId) {
      res.status(400).json({ error: 'Incoming player must be a sold player assigned to a team' });
      return;
    }

    if (incomingPlayer.teamId === requestedTeamId) {
      res.status(400).json({ error: 'Player already belongs to the requested team' });
      return;
    }

    const [requestedTeam, currentOwnerTeam] = await Promise.all([
      Team.findById(requestedTeamId).lean(),
      Team.findById(incomingPlayer.teamId).lean(),
    ]);

    if (!requestedTeam || !currentOwnerTeam) {
      res.status(404).json({ error: 'One or more teams not found' });
      return;
    }

    const normalizedOutgoingId = outgoingPlayerId ?? null;
    let outgoingPlayer: (typeof incomingPlayer) | null = null;
    if (normalizedOutgoingId) {
      if (normalizedOutgoingId === incomingPlayerId) {
        res.status(400).json({ error: 'incoming and outgoing players cannot be the same' });
        return;
      }
      outgoingPlayer = await Player.findById(normalizedOutgoingId).lean();
      if (!outgoingPlayer || !outgoingPlayer.isSold || outgoingPlayer.teamId !== requestedTeamId) {
        res.status(400).json({ error: 'Outgoing player must be a sold player from requested team' });
        return;
      }
    }

    if (!normalizedOutgoingId) {
      const requestedTeamPlayersCount = await Player.countDocuments({ teamId: requestedTeamId, isSold: true });
      if (requestedTeamPlayersCount >= settings.maxPlayersPerTeam) {
        res.status(400).json({ error: `Requested team already has maximum allowed players (${settings.maxPlayersPerTeam})` });
        return;
      }
    }

    if (requestedTeam.currentPurse < cashToOtherTeam) {
      res.status(400).json({ error: 'Requested team does not have enough purse for cash adjustment' });
      return;
    }

    await runTransactionWithRetry(async (session) => {
      if (cashToOtherTeam > 0) {
        await Team.findByIdAndUpdate(
          requestedTeamId,
          { $inc: { currentPurse: -cashToOtherTeam } },
          { session }
        );
        await Team.findByIdAndUpdate(
          currentOwnerTeam._id,
          { $inc: { currentPurse: cashToOtherTeam } },
          { session }
        );
      }

      await Player.findByIdAndUpdate(
        incomingPlayerId,
        { $set: { teamId: requestedTeamId, isSold: true, isUnsold: false } },
        { session }
      );

      if (outgoingPlayer) {
        await Player.findByIdAndUpdate(
          outgoingPlayer._id,
          { $set: { teamId: currentOwnerTeam._id, isSold: true, isUnsold: false } },
          { session }
        );
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

    res.status(201).json({ message: 'Player added successfully', player: toApiPlayer(createdPlayer.toObject()) });
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.mobile) {
      res.status(409).json({ error: 'A player with this mobile number already exists' });
      return;
    }
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

    const data: Record<string, unknown> = {};

    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (basePrice !== undefined && basePrice <= 0) {
      res.status(400).json({ error: 'basePrice must be greater than 0' });
      return;
    }
    const unset: Record<string, unknown> = {};
    if (mobile !== undefined) {
      if (mobile) {
        data.mobile = mobile;
      } else {
        unset.mobile = '';
      }
    }
    if (description !== undefined) data.description = description || null;
    if (stats !== undefined) data.stats = stats || null;
    if (playerImageUrl !== undefined) data.playerImageUrl = playerImageUrl || null;

    if (Object.keys(data).length === 0 && Object.keys(unset).length === 0 && basePrice === undefined) {
      res.status(400).json({ error: 'No fields provided for update' });
      return;
    }

    const player = await Player.findById(playerId).lean();
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

    const update: Record<string, unknown> = {};
    if (Object.keys(data).length > 0) update.$set = data;
    if (Object.keys(unset).length > 0) update.$unset = unset;

    const updatedPlayer = await Player.findByIdAndUpdate(playerId, update, { new: true }).lean();

    res.json({ message: 'Player updated successfully', player: toApiPlayer(updatedPlayer) });
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.mobile) {
      res.status(409).json({ error: 'A player with this mobile number already exists' });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};

export const deletePlayerHandler = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;

  const session = await mongoose.startSession();
  try {
    const playerId = parseInt(req.params.id, 10);
    if (Number.isNaN(playerId)) {
      res.status(400).json({ error: 'Invalid player id' });
      return;
    }

    const player = await Player.findById(playerId).lean();
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    let refundedTeamId: number | null = null;
    let refundedAmount = 0;

    await session.withTransaction(async () => {
      if (player.teamId && player.soldPrice) {
        const team = await Team.findByIdAndUpdate(
          player.teamId,
          { $inc: { currentPurse: player.soldPrice } },
          { session }
        );
        if (team) {
          refundedTeamId = team._id;
          refundedAmount = player.soldPrice as number;
        }
      }
      await Player.findByIdAndDelete(playerId, { session });
    });

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
  } finally {
    await session.endSession();
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
  const id = await getNextSequence('Player');
  return Player.create({
    _id: id,
    name,
    role,
    basePrice,
    mobile: mobile || undefined,
    description: description || null,
    stats: stats || null,
    playerImageUrl: playerImageUrl || null,
    isSold: false,
  });
};

export const createTeam = async (req: Request, res: Response): Promise<void> => {
  if (!ensureAdmin(req, res)) return;
  const { name, captainName, captainImage } = req.body;
  if (!name || !captainName) {
    res.status(400).json({ error: 'Name and captainName are required' });
    return;
  }
  try {
    const auctionSettings = await getAuctionSettings();
    const id = await getNextSequence('Team');
    const team = await Team.create({
      _id: id,
      name,
      captainName,
      captainImage,
      currentPurse: auctionSettings.initialPurse,
    });
    res.status(201).json({ message: 'Team created successfully', team: toApiTeam(team.toObject()) });
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

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (captainName !== undefined) data.captainName = captainName.trim();
    if (captainImage !== undefined) data.captainImage = captainImage || null;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No fields provided for update' });
      return;
    }

    const team = await Team.findById(teamId).lean();
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const updatedTeam = await Team.findByIdAndUpdate(teamId, { $set: data }, { new: true }).lean();

    res.json({ message: 'Team updated successfully', team: toApiTeam(updatedTeam) });
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

    const team = await Team.findById(teamId).select('_id name').lean();

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const playerCount = await Player.countDocuments({ teamId });

    if (playerCount > 0) {
      res.status(400).json({ error: 'Cannot delete a team that already has players' });
      return;
    }

    await Team.findByIdAndDelete(teamId);
    res.json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuctionSettingsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getAuctionSettings();
    const normalizedSettings = {
      id: settings._id,
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
  const session = await mongoose.startSession();
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

    let settings: any;
    let updatedTeams = 0;

    await session.withTransaction(async () => {
      settings = await AuctionSettings.findOneAndUpdate(
        { _id: 1 },
        {
          $set: {
            seasonName: seasonName.trim(),
            initialPurse,
            minPlayersPerTeam,
            maxPlayersPerTeam,
            playerOrderByBasePrice,
            playerOrderByRole,
            allowedBasePrices: normalizedBasePrices,
            isExchangeAllowed,
          },
        },
        { upsert: true, new: true, session }
      ).lean();

      if (applyToExistingTeams) {
        const updateResult = await Team.updateMany(
          {},
          { $set: { currentPurse: initialPurse } },
          { session }
        );
        updatedTeams = updateResult.modifiedCount;
      }
    });

    res.json({
      message: 'Auction settings updated successfully',
      settings: toApiSettings(settings),
      updatedTeams,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.endSession();
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

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Player.bulkWrite(
          orders.map(({ id, auctionOrder }) => ({
            updateOne: { filter: { _id: id }, update: { $set: { auctionOrder } } },
          })),
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    res.json({ message: 'Auction order saved successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
