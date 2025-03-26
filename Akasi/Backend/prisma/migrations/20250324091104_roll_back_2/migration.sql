/*
  Warnings:

  - Added the required column `name` to the `admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `complaint` to the `appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grade` to the `dental_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grade` to the `medical_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grade` to the `opthal_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grade` to the `physical_exam` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `admin` ADD COLUMN `name` VARCHAR(225) NOT NULL;

-- AlterTable
ALTER TABLE `appointment` ADD COLUMN `complaint` VARCHAR(225) NOT NULL,
    MODIFY `appointment_id` INTEGER NOT NULL AUTO_INCREMENT;

-- AlterTable
ALTER TABLE `dental_certificates` ADD COLUMN `grade` INTEGER NOT NULL,
    MODIFY `dental` LONGBLOB NOT NULL;

-- AlterTable
ALTER TABLE `medical_certificates` ADD COLUMN `grade` INTEGER NOT NULL,
    MODIFY `medical` LONGBLOB NOT NULL;

-- AlterTable
ALTER TABLE `opthal_certificates` ADD COLUMN `grade` INTEGER NOT NULL,
    MODIFY `opthal` LONGBLOB NOT NULL;

-- AlterTable
ALTER TABLE `physical_exam` ADD COLUMN `grade` INTEGER NOT NULL,
    MODIFY `physical` LONGBLOB NOT NULL;

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
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `medicineCategory`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EditsInverntory` ADD CONSTRAINT `EditsInverntory_med_id_medName_fkey` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_med_id_medName_fkey` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `dental_certificates` ADD CONSTRAINT `dental_certificates_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medical_certificates` ADD CONSTRAINT `medical_certificates_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `opthal_certificates` ADD CONSTRAINT `opthal_certificates_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `physical_exam` ADD CONSTRAINT `physical_exam_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `appointment_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `HSU_bulletin` ADD CONSTRAINT `HSU_bulletin_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `HSU_bulletin_files` ADD CONSTRAINT `HSU_bulletin_files_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `HSU_bulletin`(`post_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
