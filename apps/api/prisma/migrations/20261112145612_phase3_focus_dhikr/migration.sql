-- CreateEnum
CREATE TYPE "FocusStatus" AS ENUM ('completed', 'cancelled');

-- CreateEnum
CREATE TYPE "DhikrGroup" AS ENUM ('pagi', 'petang', 'tidur');

-- CreateTable
CREATE TABLE "focus_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "label" TEXT,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "endedAt" TIMESTAMPTZ(3) NOT NULL,
    "date" DATE NOT NULL,
    "plannedSeconds" INTEGER NOT NULL,
    "focusedSeconds" INTEGER NOT NULL,
    "status" "FocusStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhikr_items" (
    "id" TEXT NOT NULL,
    "group" "DhikrGroup" NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "arabic" TEXT NOT NULL,
    "latin" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "note" TEXT,
    "repeat" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "dhikr_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhikr_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dhikrId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "dhikr_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "focus_sessions_userId_date_idx" ON "focus_sessions"("userId", "date");

-- CreateIndex
CREATE INDEX "dhikr_items_group_position_idx" ON "dhikr_items"("group", "position");

-- CreateIndex
CREATE INDEX "dhikr_logs_userId_date_idx" ON "dhikr_logs"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "dhikr_logs_userId_dhikrId_date_key" ON "dhikr_logs"("userId", "dhikrId", "date");

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhikr_logs" ADD CONSTRAINT "dhikr_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhikr_logs" ADD CONSTRAINT "dhikr_logs_dhikrId_fkey" FOREIGN KEY ("dhikrId") REFERENCES "dhikr_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
