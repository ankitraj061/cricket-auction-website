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
