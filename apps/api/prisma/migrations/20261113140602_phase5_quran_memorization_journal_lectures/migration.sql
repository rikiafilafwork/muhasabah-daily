-- CreateEnum
CREATE TYPE "StageKind" AS ENUM ('listen', 'recite', 'connect');

-- CreateEnum
CREATE TYPE "PolishStatus" AS ENUM ('none', 'pending', 'done', 'failed');

-- CreateTable
CREATE TABLE "surahs" (
    "id" INTEGER NOT NULL,
    "nameArabic" TEXT NOT NULL,
    "nameLatin" TEXT NOT NULL,
    "nameMeaning" TEXT NOT NULL,
    "revelationType" TEXT NOT NULL,
    "ayahCount" INTEGER NOT NULL,

    CONSTRAINT "surahs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ayahs" (
    "id" INTEGER NOT NULL,
    "surahId" INTEGER NOT NULL,
    "numberInSurah" INTEGER NOT NULL,
    "juz" INTEGER NOT NULL,
    "page" INTEGER NOT NULL,
    "arabic" TEXT NOT NULL,
    "latin" TEXT NOT NULL,
    "translationId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,

    CONSTRAINT "ayahs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memorization_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "surahId" INTEGER NOT NULL,
    "fromAyah" INTEGER NOT NULL,
    "toAyah" INTEGER NOT NULL,
    "title" TEXT,
    "listenRepeat" INTEGER NOT NULL,
    "reciteRepeat" INTEGER NOT NULL,
    "connectRepeat" INTEGER NOT NULL,
    "currentStage" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "memorization_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memorization_stages" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" "StageKind" NOT NULL,
    "fromAyah" INTEGER NOT NULL,
    "toAyah" INTEGER NOT NULL,
    "repeat" INTEGER NOT NULL,

    CONSTRAINT "memorization_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "rawText" TEXT NOT NULL,
    "polishedText" TEXT,
    "polishStatus" "PolishStatus" NOT NULL DEFAULT 'none',
    "polishError" TEXT,
    "polishedRawHash" TEXT,
    "polishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecture_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "speaker" TEXT,
    "source" TEXT,
    "date" DATE NOT NULL,
    "tags" TEXT[],
    "content" JSONB NOT NULL,
    "contentText" TEXT NOT NULL,
    "ayahRefs" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "lecture_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ayahs_surahId_numberInSurah_key" ON "ayahs"("surahId", "numberInSurah");

-- CreateIndex
CREATE INDEX "memorization_plans_userId_archived_createdAt_idx" ON "memorization_plans"("userId", "archived", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "memorization_stages_planId_position_key" ON "memorization_stages"("planId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_userId_date_key" ON "journal_entries"("userId", "date");

-- CreateIndex
CREATE INDEX "lecture_notes_userId_date_idx" ON "lecture_notes"("userId", "date");

-- AddForeignKey
ALTER TABLE "ayahs" ADD CONSTRAINT "ayahs_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "surahs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_plans" ADD CONSTRAINT "memorization_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_plans" ADD CONSTRAINT "memorization_plans_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "surahs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_stages" ADD CONSTRAINT "memorization_stages_planId_fkey" FOREIGN KEY ("planId") REFERENCES "memorization_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_notes" ADD CONSTRAINT "lecture_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
