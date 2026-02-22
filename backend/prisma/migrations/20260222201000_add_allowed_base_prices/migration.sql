ALTER TABLE "AuctionSettings"
ADD COLUMN "allowedBasePrices" INTEGER[] NOT NULL DEFAULT ARRAY[2000, 3000, 5000]::INTEGER[];

UPDATE "AuctionSettings"
SET "allowedBasePrices" = ARRAY[2000, 3000, 5000]::INTEGER[]
WHERE array_length("allowedBasePrices", 1) IS NULL;
