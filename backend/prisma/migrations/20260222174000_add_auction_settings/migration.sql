CREATE TABLE "AuctionSettings" (
    "id" INTEGER NOT NULL,
    "seasonName" TEXT NOT NULL DEFAULT 'Season 1',
    "initialPurse" INTEGER NOT NULL DEFAULT 100000,
    "minPlayersPerTeam" INTEGER NOT NULL DEFAULT 0,
    "maxPlayersPerTeam" INTEGER NOT NULL DEFAULT 11,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AuctionSettings" ("id", "seasonName", "initialPurse", "minPlayersPerTeam", "maxPlayersPerTeam", "createdAt", "updatedAt")
VALUES (1, 'Season 1', 100000, 0, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
