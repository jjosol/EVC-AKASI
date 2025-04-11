/*
  Warnings:

  - You are about to drop the column `client_id` on the `appointment` table. All the data in the column will be lost.
  - You are about to drop the column `admin_id` on the `consultation_records` table. All the data in the column will be lost.
  - You are about to drop the column `client_id` on the `consultation_records` table. All the data in the column will be lost.
  - You are about to drop the column `doctor` on the `consultation_records` table. All the data in the column will be lost.
  - You are about to drop the column `intern` on the `consultation_records` table. All the data in the column will be lost.
  - You are about to drop the column `client_id` on the `dental_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `dental` on the `dental_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `admin_id` on the `editsequipment` table. All the data in the column will be lost.
  - You are about to drop the column `equip_id` on the `editsequipment` table. All the data in the column will be lost.
  - The primary key for the `equipment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `equip_id` on the `equipment` table. All the data in the column will be lost.
  - You are about to drop the column `admin_id` on the `hsu_bulletin` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `hsu_bulletin_files` table. All the data in the column will be lost.
  - You are about to drop the column `file_type` on the `hsu_bulletin_files` table. All the data in the column will be lost.
  - You are about to alter the column `file_name` on the `hsu_bulletin_files` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `mime_type` on the `hsu_bulletin_files` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to drop the column `admin_id` on the `medadministration` table. All the data in the column will be lost.
  - You are about to drop the column `client_id` on the `medadministration` table. All the data in the column will be lost.
  - You are about to drop the column `patient` on the `medadministration` table. All the data in the column will be lost.
  - You are about to drop the column `client_id` on the `medical_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `medical` on the `medical_certificates` table. All the data in the column will be lost.
  - The primary key for the `medicinecategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `category_id` on the `medicinecategory` table. All the data in the column will be lost.
  - You are about to drop the column `client_id` on the `opthal_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `opthal` on the `opthal_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `client_id` on the `physical_exam` table. All the data in the column will be lost.
  - You are about to drop the column `physical` on the `physical_exam` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `prescription` table. All the data in the column will be lost.
  - You are about to drop the column `med_id` on the `prescription` table. All the data in the column will be lost.
  - You are about to drop the `admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `editsinverntory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `manager` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `patient_id` to the `appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nurse_id` to the `consultation_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nurse_name` to the `consultation_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patient_id` to the `consultation_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_name` to the `dental_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_path` to the `dental_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mime_type` to the `dental_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patient_id` to the `dental_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id` to the `EditsEquipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `equipment_id` to the `EditsEquipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nurse_id` to the `EditsEquipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `equipment_id` to the `equipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nurse_id` to the `hsu_bulletin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_path` to the `hsu_bulletin_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_size` to the `hsu_bulletin_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nurse_id` to the `medAdministration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patient_id` to the `medAdministration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patient_name` to the `medAdministration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patient_id` to the `medical_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medCategory_id` to the `medicineCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patient_id` to the `opthal_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patient_id` to the `physical_exam` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `FK_client_TO_appointmant` ON `appointment`;

-- DropIndex
DROP INDEX `FK_admin_TO_consultation_records` ON `consultation_records`;

-- DropIndex
DROP INDEX `FK_client_TO_consultation_records` ON `consultation_records`;

-- DropIndex
DROP INDEX `FK_client_TO_dental_certificates` ON `dental_certificates`;

-- DropIndex
DROP INDEX `EditsEquipment_admin_id_idx` ON `editsequipment`;

-- DropIndex
DROP INDEX `EditsEquipment_equip_id_idx` ON `editsequipment`;

-- DropIndex
DROP INDEX `FK_admin_TO_HSU_bulletin` ON `hsu_bulletin`;

-- DropIndex
DROP INDEX `medAdministration_admin_id_idx` ON `medadministration`;

-- DropIndex
DROP INDEX `medAdministration_client_id_idx` ON `medadministration`;

-- DropIndex
DROP INDEX `medAdministration_consultation_id_fkey` ON `medadministration`;

-- DropIndex
DROP INDEX `FK_client_TO_medical_certificates` ON `medical_certificates`;

-- DropIndex
DROP INDEX `FK_client_TO_opthal_certificates` ON `opthal_certificates`;

-- DropIndex
DROP INDEX `FK_client_TO_physical_exam` ON `physical_exam`;

-- DropIndex
DROP INDEX `prescription_med_id_medName_idx` ON `prescription`;

-- AlterTable
ALTER TABLE `appointment` DROP COLUMN `client_id`,
    ADD COLUMN `patient_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `consultation_records` DROP COLUMN `admin_id`,
    DROP COLUMN `client_id`,
    DROP COLUMN `doctor`,
    DROP COLUMN `intern`,
    ADD COLUMN `doctor_id` INTEGER NULL,
    ADD COLUMN `doctor_name` VARCHAR(225) NULL,
    ADD COLUMN `nurse_id` INTEGER NOT NULL,
    ADD COLUMN `nurse_name` VARCHAR(225) NOT NULL,
    ADD COLUMN `patient_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `dental_certificates` DROP COLUMN `client_id`,
    DROP COLUMN `dental`,
    ADD COLUMN `file_name` VARCHAR(100) NOT NULL,
    ADD COLUMN `file_path` VARCHAR(255) NOT NULL,
    ADD COLUMN `file_size` INTEGER NULL,
    ADD COLUMN `mime_type` VARCHAR(50) NOT NULL,
    ADD COLUMN `patient_id` INTEGER NOT NULL,
    MODIFY `grade` INTEGER NULL;

-- AlterTable
ALTER TABLE `editsequipment` DROP COLUMN `admin_id`,
    DROP COLUMN `equip_id`,
    ADD COLUMN `category_id` INTEGER NOT NULL,
    ADD COLUMN `equipment_id` INTEGER NOT NULL,
    ADD COLUMN `nurse_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `equipment` DROP PRIMARY KEY,
    DROP COLUMN `equip_id`,
    ADD COLUMN `equipCategory_id` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `equipment_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`equipment_id`);

-- AlterTable
ALTER TABLE `hsu_bulletin` DROP COLUMN `admin_id`,
    ADD COLUMN `nurse_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `hsu_bulletin_files` DROP COLUMN `data`,
    DROP COLUMN `file_type`,
    ADD COLUMN `file_path` VARCHAR(255) NOT NULL,
    ADD COLUMN `file_size` INTEGER NOT NULL,
    MODIFY `file_name` VARCHAR(100) NOT NULL,
    MODIFY `mime_type` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `medadministration` DROP COLUMN `admin_id`,
    DROP COLUMN `client_id`,
    DROP COLUMN `patient`,
    ADD COLUMN `doctor_id` INTEGER NULL,
    ADD COLUMN `nurse_id` INTEGER NOT NULL,
    ADD COLUMN `patient_id` INTEGER NOT NULL,
    ADD COLUMN `patient_name` VARCHAR(225) NOT NULL;

-- AlterTable
ALTER TABLE `medical_certificates` DROP COLUMN `client_id`,
    DROP COLUMN `medical`,
    ADD COLUMN `file_name` VARCHAR(100) NULL,
    ADD COLUMN `file_path` VARCHAR(255) NULL,
    ADD COLUMN `file_size` INTEGER NULL,
    ADD COLUMN `mime_type` VARCHAR(50) NULL,
    ADD COLUMN `patient_id` INTEGER NOT NULL,
    MODIFY `grade` INTEGER NULL;

-- AlterTable
ALTER TABLE `medicinecategory` DROP PRIMARY KEY,
    DROP COLUMN `category_id`,
    ADD COLUMN `medCategory_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`medCategory_id`);

-- AlterTable
ALTER TABLE `opthal_certificates` DROP COLUMN `client_id`,
    DROP COLUMN `opthal`,
    ADD COLUMN `file_name` VARCHAR(100) NULL,
    ADD COLUMN `file_path` VARCHAR(255) NULL,
    ADD COLUMN `file_size` INTEGER NULL,
    ADD COLUMN `mime_type` VARCHAR(50) NULL,
    ADD COLUMN `patient_id` INTEGER NOT NULL,
    MODIFY `grade` INTEGER NULL;

-- AlterTable
ALTER TABLE `physical_exam` DROP COLUMN `client_id`,
    DROP COLUMN `physical`,
    ADD COLUMN `file_name` VARCHAR(100) NULL,
    ADD COLUMN `file_path` VARCHAR(255) NULL,
    ADD COLUMN `file_size` INTEGER NULL,
    ADD COLUMN `mime_type` VARCHAR(50) NULL,
    ADD COLUMN `patient_id` INTEGER NOT NULL,
    MODIFY `grade` INTEGER NULL;

-- AlterTable
ALTER TABLE `prescription` DROP COLUMN `image`,
    DROP COLUMN `med_id`,
    ADD COLUMN `file_name` VARCHAR(100) NULL,
    ADD COLUMN `file_path` VARCHAR(255) NULL,
    ADD COLUMN `file_size` INTEGER NULL,
    ADD COLUMN `medicine_id` INTEGER NULL,
    ADD COLUMN `mime_type` VARCHAR(50) NULL;

-- DropTable
DROP TABLE `admin`;

-- DropTable
DROP TABLE `client`;

-- DropTable
DROP TABLE `editsinverntory`;

-- DropTable
DROP TABLE `inventory`;

-- DropTable
DROP TABLE `manager`;

-- CreateTable
CREATE TABLE `doctor` (
    `doctor_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(225) NOT NULL,
    `password` VARCHAR(225) NOT NULL,
    `gmail` VARCHAR(225) NOT NULL,
    `name` VARCHAR(225) NOT NULL,

    UNIQUE INDEX `doctor_id`(`doctor_id`),
    PRIMARY KEY (`doctor_id`, `username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nurse` (
    `nurse_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(225) NOT NULL,
    `password` VARCHAR(225) NOT NULL,
    `gmail` VARCHAR(225) NOT NULL,
    `name` VARCHAR(225) NOT NULL,

    UNIQUE INDEX `nurse_id`(`nurse_id`),
    PRIMARY KEY (`nurse_id`, `username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient` (
    `patient_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(225) NOT NULL,
    `password` VARCHAR(225) NOT NULL,
    `name` VARCHAR(225) NOT NULL,
    `gmail` VARCHAR(225) NOT NULL,
    `age` INTEGER NOT NULL,
    `gender` VARCHAR(225) NOT NULL,
    `type` VARCHAR(225) NOT NULL,
    `civil_status` VARCHAR(225) NOT NULL,
    `address` VARCHAR(225) NOT NULL,
    `division` VARCHAR(225) NULL,
    `position` VARCHAR(225) NULL,
    `grade` INTEGER NULL,
    `section` VARCHAR(225) NULL,
    `category` VARCHAR(225) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',

    UNIQUE INDEX `patient_id`(`patient_id`),
    PRIMARY KEY (`patient_id`, `username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicine` (
    `medicine_id` INTEGER NOT NULL AUTO_INCREMENT,
    `medName` VARCHAR(225) NOT NULL,
    `medCategory_id` INTEGER NOT NULL DEFAULT 1,
    `expiration` DATE NOT NULL,
    `count` INTEGER NOT NULL,
    `otc` BOOLEAN NOT NULL DEFAULT true,

    INDEX `medicine_medCategory_id_idx`(`medCategory_id`),
    PRIMARY KEY (`medicine_id`, `medName`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EditsMedicine` (
    `edit_id` INTEGER NOT NULL AUTO_INCREMENT,
    `med_id` INTEGER NOT NULL,
    `medName` VARCHAR(225) NOT NULL,
    `date` DATETIME(0) NOT NULL,
    `cause` VARCHAR(225) NOT NULL,
    `addSubCount` INTEGER NOT NULL,
    `runningTotal` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `nurse_id` INTEGER NOT NULL,

    INDEX `EditsMedicine_med_id_medName_idx`(`med_id`, `medName`),
    INDEX `EditsMedicine_nurse_id_idx`(`nurse_id`),
    INDEX `EditsMedicine_category_id_idx`(`category_id`),
    PRIMARY KEY (`edit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipmentCategory` (
    `medCategory_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(225) NOT NULL,

    UNIQUE INDEX `equipmentCategory_name_key`(`name`),
    PRIMARY KEY (`medCategory_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medical_consent` (
    `patient_id` INTEGER NOT NULL,
    `grade` INTEGER NULL,
    `date` DATE NOT NULL,
    `file_path` VARCHAR(255) NULL,
    `file_name` VARCHAR(100) NULL,
    `mime_type` VARCHAR(50) NULL,
    `file_size` INTEGER NULL,
    `medical_consent_id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `notes` VARCHAR(500) NULL,

    INDEX `FK_patient_TO_physical_exam`(`patient_id`),
    PRIMARY KEY (`medical_consent_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dental_consent` (
    `patient_id` INTEGER NOT NULL,
    `grade` INTEGER NULL,
    `date` DATE NOT NULL,
    `file_path` VARCHAR(255) NULL,
    `file_name` VARCHAR(100) NULL,
    `mime_type` VARCHAR(50) NULL,
    `file_size` INTEGER NULL,
    `dental_consent_id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `notes` VARCHAR(500) NULL,

    INDEX `FK_patient_TO_physical_exam`(`patient_id`),
    PRIMARY KEY (`dental_consent_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dental_history` (
    `patient_id` INTEGER NOT NULL,
    `grade` INTEGER NULL,
    `date` DATE NOT NULL,
    `file_path` VARCHAR(255) NULL,
    `file_name` VARCHAR(100) NULL,
    `mime_type` VARCHAR(50) NULL,
    `file_size` INTEGER NULL,
    `dental_history_id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `notes` VARCHAR(500) NULL,

    INDEX `FK_patient_TO_physical_exam`(`patient_id`),
    PRIMARY KEY (`dental_history_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hh_pds` (
    `patient_id` INTEGER NOT NULL,
    `grade` INTEGER NULL,
    `date` DATE NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_name` VARCHAR(100) NOT NULL,
    `mime_type` VARCHAR(50) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `hh_pds_id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `notes` VARCHAR(500) NULL,

    INDEX `FK_patient_TO_physical_exam`(`patient_id`),
    PRIMARY KEY (`hh_pds_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `laboratory` (
    `patient_id` INTEGER NOT NULL,
    `grade` INTEGER NULL,
    `date` DATE NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_name` VARCHAR(100) NOT NULL,
    `mime_type` VARCHAR(50) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `laboratory_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(225) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `notes` VARCHAR(500) NULL,

    INDEX `FK_patient_TO_physical_exam`(`patient_id`),
    PRIMARY KEY (`laboratory_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `FK_patient_TO_appointment` ON `appointment`(`patient_id`);

-- CreateIndex
CREATE INDEX `FK_nurse_TO_consultation_records` ON `consultation_records`(`nurse_id`);

-- CreateIndex
CREATE INDEX `FK_patient_TO_consultation_records` ON `consultation_records`(`patient_id`);

-- CreateIndex
CREATE INDEX `FK_doctor_TO_consultation_records` ON `consultation_records`(`doctor_id`);

-- CreateIndex
CREATE INDEX `FK_patient_TO_dental_certificates` ON `dental_certificates`(`patient_id`);

-- CreateIndex
CREATE INDEX `EditsEquipment_equipment_id_idx` ON `EditsEquipment`(`equipment_id`);

-- CreateIndex
CREATE INDEX `EditsEquipment_nurse_id_idx` ON `EditsEquipment`(`nurse_id`);

-- CreateIndex
CREATE INDEX `EditsEquipment_category_id_idx` ON `EditsEquipment`(`category_id`);

-- CreateIndex
CREATE INDEX `equipment_equipCategory_id_idx` ON `equipment`(`equipCategory_id`);

-- CreateIndex
CREATE INDEX `FK_nurse_TO_HSU_bulletin` ON `hsu_bulletin`(`nurse_id`, `username`);

-- CreateIndex
CREATE INDEX `FK_nurse_TO_medAdministration` ON `medAdministration`(`nurse_id`);

-- CreateIndex
CREATE INDEX `FK_patient_TO_medAdministration` ON `medAdministration`(`patient_id`);

-- CreateIndex
CREATE INDEX `FK_doctor_TO_medAdministration` ON `medAdministration`(`doctor_id`);

-- CreateIndex
CREATE INDEX `FK_patient_TO_medical_certificates` ON `medical_certificates`(`patient_id`);

-- CreateIndex
CREATE INDEX `FK_patient_TO_opthal_certificates` ON `opthal_certificates`(`patient_id`);

-- CreateIndex
CREATE INDEX `FK_patient_TO_physical_exam` ON `physical_exam`(`patient_id`);

-- CreateIndex
CREATE INDEX `prescription_medicine_id_medName_idx` ON `prescription`(`medicine_id`, `medName`);

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `appointment_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `consultation_records` ADD CONSTRAINT `consultation_records_nurse_id_fkey` FOREIGN KEY (`nurse_id`) REFERENCES `nurse`(`nurse_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `consultation_records` ADD CONSTRAINT `consultation_records_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `consultation_records` ADD CONSTRAINT `consultation_records_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctor`(`doctor_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `consultation_diagnosis` ADD CONSTRAINT `consultation_diagnosis_consultation_id_fkey` FOREIGN KEY (`consultation_id`) REFERENCES `consultation_records`(`consultation_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultation_diagnosis` ADD CONSTRAINT `consultation_diagnosis_diagnosis_id_fkey` FOREIGN KEY (`diagnosis_id`) REFERENCES `diagnosis`(`diagnosis_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diagnosis` ADD CONSTRAINT `diagnosis_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `diagnosis_category`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diagnosis` ADD CONSTRAINT `diagnosis_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `nurse`(`nurse_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_nurse_id_fkey` FOREIGN KEY (`nurse_id`) REFERENCES `nurse`(`nurse_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctor`(`doctor_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_med_id_medName_fkey` FOREIGN KEY (`med_id`, `medName`) REFERENCES `medicine`(`medicine_id`, `medName`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_consultation_id_fkey` FOREIGN KEY (`consultation_id`) REFERENCES `consultation_records`(`consultation_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medicine` ADD CONSTRAINT `medicine_medCategory_id_fkey` FOREIGN KEY (`medCategory_id`) REFERENCES `medicineCategory`(`medCategory_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EditsMedicine` ADD CONSTRAINT `EditsMedicine_nurse_id_fkey` FOREIGN KEY (`nurse_id`) REFERENCES `nurse`(`nurse_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EditsMedicine` ADD CONSTRAINT `EditsMedicine_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `medicineCategory`(`medCategory_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EditsMedicine` ADD CONSTRAINT `EditsMedicine_med_id_medName_fkey` FOREIGN KEY (`med_id`, `medName`) REFERENCES `medicine`(`medicine_id`, `medName`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription` ADD CONSTRAINT `prescription_consultation_id_fkey` FOREIGN KEY (`consultation_id`) REFERENCES `consultation_records`(`consultation_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription` ADD CONSTRAINT `prescription_medicine_id_medName_fkey` FOREIGN KEY (`medicine_id`, `medName`) REFERENCES `medicine`(`medicine_id`, `medName`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment` ADD CONSTRAINT `equipment_equipCategory_id_fkey` FOREIGN KEY (`equipCategory_id`) REFERENCES `equipmentCategory`(`medCategory_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EditsEquipment` ADD CONSTRAINT `EditsEquipment_nurse_id_fkey` FOREIGN KEY (`nurse_id`) REFERENCES `nurse`(`nurse_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EditsEquipment` ADD CONSTRAINT `EditsEquipment_equipment_id_fkey` FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`equipment_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EditsEquipment` ADD CONSTRAINT `EditsEquipment_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `equipmentCategory`(`medCategory_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dental_certificates` ADD CONSTRAINT `dental_certificates_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medical_certificates` ADD CONSTRAINT `medical_certificates_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `opthal_certificates` ADD CONSTRAINT `opthal_certificates_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `physical_exam` ADD CONSTRAINT `physical_exam_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medical_consent` ADD CONSTRAINT `medical_consent_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `dental_consent` ADD CONSTRAINT `dental_consent_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `dental_history` ADD CONSTRAINT `dental_history_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `hh_pds` ADD CONSTRAINT `hh_pds_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `laboratory` ADD CONSTRAINT `laboratory_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `hsu_bulletin` ADD CONSTRAINT `FK_nurse_TO_HSU_bulletin` FOREIGN KEY (`nurse_id`) REFERENCES `nurse`(`nurse_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `hsu_bulletin_files` ADD CONSTRAINT `hsu_bulletin_files_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `hsu_bulletin`(`post_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
