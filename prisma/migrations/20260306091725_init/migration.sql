-- CreateTable
CREATE TABLE "Level" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rank" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '--',
    "creator" TEXT NOT NULL DEFAULT '--',
    "verifier" TEXT NOT NULL DEFAULT '--',
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Level_rank_key" ON "Level"("rank");
