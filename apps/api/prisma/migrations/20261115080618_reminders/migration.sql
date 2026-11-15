-- AlterTable
ALTER TABLE "events" ADD COLUMN     "remindAt" TIMESTAMPTZ(3),
ADD COLUMN     "reminderMinutes" INTEGER,
ADD COLUMN     "reminderSentAt" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "prayerReminders" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "events_remindAt_idx" ON "events"("remindAt");

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
