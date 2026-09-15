export type Player = {
  id: number;
  name: string;
  role: string;
  basePrice: number;
  mobile?: string;
  description?: string;
  stats?: string;
  playerImageUrl?: string;
  isSold: boolean;
  auctionOrder?: number | null;
  teamId?: number | null;
  team?: {
    id: number;
    name: string;
  } | null;
  soldPrice?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export interface Team {
  id?: number;
  teamId?: number;
  name: string;
  captainName: string;
  captainImage?: string | null;
  totalPlayers: number;
  remainingPurse: number;
  currentPurse: number;
    players?: Player[];
}

/** Player shape returned by the auction endpoints (`/api/auction/next-player`, `/search`, `/players`). */
export interface AuctionPlayer {
  id: number;
  name: string;
  mobile: string | null;
  role: string;
  basePrice: number;
  soldPrice: number | null;
  description: string | null;
  stats: string | null;
  playerImageUrl: string | null;
  teamId: number | null;
  isSold: boolean;
  isUnsold: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Team shape returned by `/api/auction/summary`. */
export interface TeamSummary {
  teamId: number;
  name: string;
  totalPlayers: number;
  remainingPurse: number;
}

export interface AuctionSettings {
  id: number;
  seasonName: string;
  initialPurse: number;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  playerOrderByBasePrice: 'ASC' | 'DESC' | 'NONE';
  playerOrderByRole: 'NO_ORDER' | 'BATSMAN_FIRST' | 'BOWLER_FIRST' | 'ALLROUNDER_FIRST';
  allowedBasePrices: number[];
  isExchangeAllowed: boolean;
  createdAt?: string;
  updatedAt?: string;
}
