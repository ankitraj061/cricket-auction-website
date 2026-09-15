import 'dotenv/config';
import mongoose from 'mongoose';
import { Player } from '../src/models/Player.js';

// One-off cleanup: unset explicit `mobile: null` values so the sparse unique
// index on `mobile` doesn't reject them as duplicates.
async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const result = await Player.updateMany({ mobile: null }, { $unset: { mobile: '' } });

  console.log(`✅ Cleaned up ${result.modifiedCount} players with mobile: null`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
