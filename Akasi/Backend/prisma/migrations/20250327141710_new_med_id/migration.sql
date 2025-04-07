/*
  Warnings:

  - The primary key for the `medadministration` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `med_administration_id` to the `medAdministration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `medadministration` DROP PRIMARY KEY,
    ADD COLUMN `med_administration_id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `consultation_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`med_administration_id`);

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `appointment_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `consultation_records` ADD CONSTRAINT `consultation_records_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `consultation_records` ADD CONSTRAINT `consultation_records_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `diagnosis` ADD CONSTRAINT `diagnosis_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `diagnosis_category`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diagnosis` ADD CONSTRAINT `diagnosis_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admin`(`admin_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultation_diagnosis` ADD CONSTRAINT `consultation_diagnosis_consultation_id_fkey` FOREIGN KEY (`consultation_id`) REFERENCES `consultation_records`(`consultation_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultation_diagnosis` ADD CONSTRAINT `consultation_diagnosis_diagnosis_id_fkey` FOREIGN KEY (`diagnosis_id`) REFERENCES `diagnosis`(`diagnosis_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dental_certificates` ADD CONSTRAINT `dental_certificates_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `medicineCategory`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EditsInverntory` ADD CONSTRAINT `EditsInverntory_med_id_medName_fkey` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_certificates` ADD CONSTRAINT `medical_certificates_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `opthal_certificates` ADD CONSTRAINT `opthal_certificates_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `physical_exam` ADD CONSTRAINT `physical_exam_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `hsu_bulletin` ADD CONSTRAINT `FK_admin_TO_HSU_bulletin` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `hsu_bulletin_files` ADD CONSTRAINT `hsu_bulletin_files_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `hsu_bulletin`(`post_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_med_id_medName_fkey` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_consultation_id_fkey` FOREIGN KEY (`consultation_id`) REFERENCES `consultation_records`(`consultation_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
