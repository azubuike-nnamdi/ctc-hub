-- CreateTable
CREATE TABLE "CookieConsentLog" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "CookieConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CookieConsentLog_userId_idx" ON "CookieConsentLog"("userId");

-- CreateIndex
CREATE INDEX "CookieConsentLog_acceptedAt_idx" ON "CookieConsentLog"("acceptedAt");

-- AddForeignKey
ALTER TABLE "CookieConsentLog" ADD CONSTRAINT "CookieConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
