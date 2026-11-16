-- CreateTable
CREATE TABLE "finance_template_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "finance_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "date" DATE NOT NULL,
    "month" CHAR(7) NOT NULL,
    "templateItemId" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "finance_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_template_items_userId_idx" ON "finance_template_items"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_plans_transactionId_key" ON "finance_plans"("transactionId");

-- CreateIndex
CREATE INDEX "finance_plans_userId_month_idx" ON "finance_plans"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "finance_plans_templateItemId_month_key" ON "finance_plans"("templateItemId", "month");

-- AddForeignKey
ALTER TABLE "finance_template_items" ADD CONSTRAINT "finance_template_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_template_items" ADD CONSTRAINT "finance_template_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "finance_categories"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_plans" ADD CONSTRAINT "finance_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_plans" ADD CONSTRAINT "finance_plans_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "finance_categories"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_plans" ADD CONSTRAINT "finance_plans_templateItemId_fkey" FOREIGN KEY ("templateItemId") REFERENCES "finance_template_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_plans" ADD CONSTRAINT "finance_plans_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "finance_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
