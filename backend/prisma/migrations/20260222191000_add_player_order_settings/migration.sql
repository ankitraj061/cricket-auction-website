ALTER TABLE "AuctionSettings"
ADD COLUMN "playerOrderByBasePrice" TEXT NOT NULL DEFAULT 'DESC',
ADD COLUMN "playerOrderByRole" TEXT NOT NULL DEFAULT 'NO_ORDER';

UPDATE "AuctionSettings"
SET "playerOrderByBasePrice" = 'DESC',
    "playerOrderByRole" = 'NO_ORDER'
WHERE "playerOrderByBasePrice" IS NULL OR "playerOrderByRole" IS NULL;
