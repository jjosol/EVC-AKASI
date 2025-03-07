/*
  Warnings:

  - You are about to drop the column `file_path` on the `hsu_bulletin_files` table. All the data in the column will be lost.
  - Added the required column `data` to the `HSU_bulletin_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mime_type` to the `HSU_bulletin_files` table without a default value. This is not possible if the table is not empty.
  - Made the column `file_name` on table `hsu_bulletin_files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `file_type` on table `hsu_bulletin_files` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `hsu_bulletin_files` DROP COLUMN `file_path`,
    ADD COLUMN `data` LONGBLOB NOT NULL,
    ADD COLUMN `mime_type` VARCHAR(191) NOT NULL,
    MODIFY `file_name` VARCHAR(191) NOT NULL,
    MODIFY `file_type` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `EditsInverntory` ADD CONSTRAINT `FK_inventory_TO_EditsInverntory` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `HSU_bulletin` ADD CONSTRAINT `FK_admin_TO_HSU_bulletin` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `HSU_bulletin_files` ADD CONSTRAINT `HSU_bulletin_files_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `HSU_bulletin`(`post_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `FK_client_TO_appointmant` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

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
