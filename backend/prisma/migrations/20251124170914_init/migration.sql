-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BATSMAN', 'BOWLER', 'ALLROUNDER');

-- CreateEnum
CREATE TYPE "basePrice" AS ENUM ('TWO_THOUSAND', 'THREE_THOUSAND', 'FIVE_THOUSAND');

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "captainName" TEXT NOT NULL,
    "captainImage" TEXT,
    "currentPurse" INTEGER NOT NULL DEFAULT 100000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "role" "Role" NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "soldPrice" INTEGER,
    "description" TEXT,
    "stats" TEXT,
    "playerImageUrl" TEXT,
    "teamId" INTEGER,
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_mobile_key" ON "Player"("mobile");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
