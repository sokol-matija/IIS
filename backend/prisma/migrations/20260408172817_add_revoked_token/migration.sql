-- CreateTable
CREATE TABLE "RevokedToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jti" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RevokedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RevokedToken_jti_key" ON "RevokedToken"("jti");

-- CreateIndex
CREATE INDEX "RevokedToken_userId_idx" ON "RevokedToken"("userId");
