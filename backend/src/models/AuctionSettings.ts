import { Schema, model } from 'mongoose';

export interface IAuctionSettings {
  _id: number;
  seasonName: string;
  initialPurse: number;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  playerOrderByBasePrice: string;
  playerOrderByRole: string;
  allowedBasePrices: number[];
  isExchangeAllowed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const auctionSettingsSchema = new Schema<IAuctionSettings>(
  {
    _id: { type: Number },
    seasonName: { type: String, default: 'Season 1' },
    initialPurse: { type: Number, default: 100000 },
    minPlayersPerTeam: { type: Number, default: 0 },
    maxPlayersPerTeam: { type: Number, default: 11 },
    playerOrderByBasePrice: { type: String, default: 'DESC' },
    playerOrderByRole: { type: String, default: 'NO_ORDER' },
    allowedBasePrices: { type: [Number], default: [2000, 3000, 5000] },
    isExchangeAllowed: { type: Boolean, default: false },
  },
  { timestamps: true, _id: false }
);

export const AuctionSettings = model<IAuctionSettings>('AuctionSettings', auctionSettingsSchema);
