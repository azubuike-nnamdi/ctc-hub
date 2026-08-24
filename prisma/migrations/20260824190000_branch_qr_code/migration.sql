-- CreateTable
CREATE TABLE "BranchQrCode" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "imagePng" BYTEA NOT NULL,
    "watermarkPng" BYTEA NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchQrCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BranchQrCode_branchId_key" ON "BranchQrCode"("branchId");

-- CreateIndex
CREATE INDEX "BranchQrCode_createdById_idx" ON "BranchQrCode"("createdById");

-- AddForeignKey
ALTER TABLE "BranchQrCode" ADD CONSTRAINT "BranchQrCode_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchQrCode" ADD CONSTRAINT "BranchQrCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
