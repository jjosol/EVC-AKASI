/*
  Warnings:

  - The primary key for the `admin` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `editsinverntory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `complaint` to the `appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `admin` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`admin_id`);

-- AlterTable
ALTER TABLE `appointment` ADD COLUMN `complaint` VARCHAR(225) NOT NULL,
    MODIFY `appointment_id` INTEGER NOT NULL AUTO_INCREMENT;

-- DropTable
DROP TABLE `editsinverntory`;

-- CreateTable
CREATE TABLE `editsinventory` (
    `med_id` INTEGER NOT NULL,
    `medName` VARCHAR(225) NOT NULL,
    `date` DATETIME(0) NOT NULL,
    `cause` VARCHAR(225) NOT NULL,
    `addSubCount` INTEGER NOT NULL,
    `edit_id` INTEGER NOT NULL AUTO_INCREMENT,

    INDEX `FK_inventory_TO_EditsInverntory`(`med_id`, `medName`),
    PRIMARY KEY (`edit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_med_id_medName_fkey` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- RenameIndex
ALTER TABLE `admin` RENAME INDEX `admin_id` TO `admin_admin_id_key`;
