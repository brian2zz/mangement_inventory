-- AlterTable
ALTER TABLE `outgoing_transactions` ADD COLUMN `customer_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `outgoing_transactions` ADD CONSTRAINT `outgoing_transactions_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
