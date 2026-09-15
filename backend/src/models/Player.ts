import { Schema, model } from 'mongoose';

export const Role = {
  BATSMAN: 'BATSMAN',
  BOWLER: 'BOWLER',
  ALLROUNDER: 'ALLROUNDER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export interface IPlayer {
  _id: number;
  name: string;
  mobile?: string | null;
  role: Role;
  basePrice: number;
  soldPrice?: number | null;
  description?: string | null;
  stats?: string | null;
  playerImageUrl?: string | null;
  teamId?: number | null;
  isSold: boolean;
  isUnsold: boolean;
  auctionOrder?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const playerSchema = new Schema<IPlayer>(
  {
    _id: { type: Number },
    name: { type: String, required: true },
    mobile: { type: String },
    role: { type: String, enum: Object.values(Role), required: true },
    basePrice: { type: Number, required: true },
    soldPrice: { type: Number, default: null },
    description: { type: String, default: null },
    stats: { type: String, default: null },
    playerImageUrl: { type: String, default: null },
    teamId: { type: Number, ref: 'Team', default: null },
    isSold: { type: Boolean, default: false },
    isUnsold: { type: Boolean, default: false },
    auctionOrder: { type: Number, default: null },
  },
  { timestamps: true, _id: false }
);

playerSchema.index({ mobile: 1 }, { unique: true, sparse: true });
playerSchema.index({ isSold: 1, isUnsold: 1 });
playerSchema.index({ teamId: 1 });
playerSchema.index({ basePrice: -1, role: 1, name: 1 });

export const Player = model<IPlayer>('Player', playerSchema);
