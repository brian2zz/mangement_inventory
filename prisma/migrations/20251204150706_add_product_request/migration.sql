-- CreateTable
CREATE TABLE `proeduct_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestedItem` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `requestedQuantity` INTEGER NOT NULL,
    `fulfilledQuantity` INTEGER NOT NULL DEFAULT 0,
    `requestDate` DATETIME(3) NOT NULL,
    `fulfilledDate` DATETIME(3) NULL,
    `store` VARCHAR(191) NOT NULL,
    `supplier` VARCHAR(191) NULL,
    `unitPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `totalPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
