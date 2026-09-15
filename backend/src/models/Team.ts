import { Schema, model } from 'mongoose';

export interface ITeam {
  _id: number;
  name: string;
  captainName: string;
  captainImage?: string | null;
  currentPurse: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mongo has no FK cascade: any code path that bulk-deletes teams must first
// (or transactionally) null out Player.teamId for affected players.
const teamSchema = new Schema<ITeam>(
  {
    _id: { type: Number },
    name: { type: String, required: true },
    captainName: { type: String, required: true },
    captainImage: { type: String, default: null },
    currentPurse: { type: Number, default: 100000 },
  },
  { timestamps: true, _id: false }
);

teamSchema.index({ name: 1 });

export const Team = model<ITeam>('Team', teamSchema);
