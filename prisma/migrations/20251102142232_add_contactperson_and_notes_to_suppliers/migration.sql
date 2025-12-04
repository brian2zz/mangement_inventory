/*
  Warnings:

  - You are about to drop the column `contact_person` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `suppliers` table. All the data in the column will be lost.
  - Made the column `phone` on table `suppliers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `suppliers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `suppliers` DROP COLUMN `contact_person`,
    DROP COLUMN `created_at`,
    DROP COLUMN `updated_at`,
    ADD COLUMN `contactPerson` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `phone` VARCHAR(191) NOT NULL,
    MODIFY `address` VARCHAR(191) NOT NULL;
