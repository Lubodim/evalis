-- CreateEnum
CREATE TYPE "ExamSessionDeviceStatus" AS ENUM ('PENDING', 'APPROVED');

-- CreateTable
CREATE TABLE "ExamSessionDevice" (
    "id" TEXT NOT NULL,
    "examSessionParticipantId" TEXT NOT NULL,
    "status" "ExamSessionDeviceStatus" NOT NULL DEFAULT 'PENDING',
    "deviceCode" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSessionDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamSessionDevice_examSessionParticipantId_key" ON "ExamSessionDevice"("examSessionParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSessionDevice_deviceCode_key" ON "ExamSessionDevice"("deviceCode");

-- AddForeignKey
ALTER TABLE "ExamSessionDevice" ADD CONSTRAINT "ExamSessionDevice_examSessionParticipantId_fkey" FOREIGN KEY ("examSessionParticipantId") REFERENCES "ExamSessionParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;