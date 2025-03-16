/*
  Warnings:

  - You are about to drop the column `compalint` on the `medadministration` table. All the data in the column will be lost.
  - Added the required column `end_date` to the `medAdministration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schedule` to the `medAdministration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `medAdministration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `medadministration` DROP COLUMN `compalint`,
    ADD COLUMN `end_date` DATE NOT NULL,
    ADD COLUMN `remarks` VARCHAR(500) NULL,
    ADD COLUMN `schedule` VARCHAR(225) NOT NULL,
    ADD COLUMN `start_date` DATE NOT NULL;

-- AddForeignKey
ALTER TABLE `EditsInverntory` ADD CONSTRAINT `FK_inventory_TO_EditsInverntory` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `HSU_bulletin` ADD CONSTRAINT `FK_admin_TO_HSU_bulletin` FOREIGN KEY (`admin_id`, `username`) REFERENCES `admin`(`admin_id`, `username`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `appointmant` ADD CONSTRAINT `FK_client_TO_appointmant` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `consultation_records` ADD CONSTRAINT `FK_admin_TO_consultation_records` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `consultation_records` ADD CONSTRAINT `FK_client_TO_consultation_records` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `dental_certificates` ADD CONSTRAINT `FK_client_TO_dental_certificates` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_med_id_medName_fkey` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medical_certificates` ADD CONSTRAINT `FK_client_TO_medical_certificates` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `opthal_certificates` ADD CONSTRAINT `FK_client_TO_opthal_certificates` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `physical_exam` ADD CONSTRAINT `FK_client_TO_physical_exam` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- RenameIndex
ALTER TABLE `medadministration` RENAME INDEX `FK_admin_TO_medAdministration` TO `medAdministration_admin_id_idx`;

-- RenameIndex
ALTER TABLE `medadministration` RENAME INDEX `FK_client_TO_medAdministration` TO `medAdministration_client_id_idx`;

-- RenameIndex
ALTER TABLE `medadministration` RENAME INDEX `FK_inventory_TO_medAdministration` TO `medAdministration_med_id_medName_idx`;
