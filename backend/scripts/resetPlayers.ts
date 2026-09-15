import 'dotenv/config';
import mongoose from 'mongoose';
import { Player } from '../src/models/Player.js';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const result = await Player.updateMany(
    {},
    { $set: { isSold: false, isUnsold: false, soldPrice: null, teamId: null } }
  );

  console.log(`✅ Reset ${result.modifiedCount} players to fresh state`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
