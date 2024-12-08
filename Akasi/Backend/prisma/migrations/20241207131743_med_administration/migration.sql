/*
  Warnings:

  - You are about to drop the `medadministration` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `medadministration`;

-- CreateTable
CREATE TABLE `med_administration` (
    `client_id` INTEGER NOT NULL,
    `admin_id` INTEGER NOT NULL,
    `med_id` INTEGER NOT NULL,
    `consultation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `start_date` DATETIME(0) NOT NULL,
    `end_date` DATETIME(0) NOT NULL,
    `patient` VARCHAR(225) NOT NULL,
    `schedule` VARCHAR(500) NOT NULL,
    `medName` VARCHAR(225) NOT NULL,
    `count` INTEGER NOT NULL,

    INDEX `FK_admin_TO_medAdministration`(`admin_id`),
    INDEX `FK_client_TO_medAdministration`(`client_id`),
    INDEX `FK_inventory_TO_medAdministration`(`med_id`, `medName`),
    PRIMARY KEY (`consultation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
