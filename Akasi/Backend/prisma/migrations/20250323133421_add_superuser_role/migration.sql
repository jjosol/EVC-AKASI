-- CreateTable
CREATE TABLE `superuser` (
    `superuser_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(225) NOT NULL,
    `password` VARCHAR(225) NOT NULL,
    `gmail` VARCHAR(225) NOT NULL,

    UNIQUE INDEX `superuser_id`(`superuser_id`),
    PRIMARY KEY (`superuser_id`, `username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diagnosis` (
    `diagnosis_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(225) NOT NULL,
    `category_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `diagnosis_category_id_idx`(`category_id`),
    INDEX `diagnosis_created_by_idx`(`created_by`),
    PRIMARY KEY (`diagnosis_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diagnosis_category` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(225) NOT NULL,

    UNIQUE INDEX `diagnosis_category_name_key`(`name`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultation_diagnosis` (
    `consultation_id` INTEGER NOT NULL,
    `diagnosis_id` INTEGER NOT NULL,

    INDEX `consultation_diagnosis_consultation_id_idx`(`consultation_id`),
    INDEX `consultation_diagnosis_diagnosis_id_idx`(`diagnosis_id`),
    PRIMARY KEY (`consultation_id`, `diagnosis_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `consultation_records` ADD CONSTRAINT `consultation_records_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultation_records` ADD CONSTRAINT `consultation_records_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_med_id_medName_fkey` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dental_certificates` ADD CONSTRAINT `dental_certificates_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_certificates` ADD CONSTRAINT `medical_certificates_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opthal_certificates` ADD CONSTRAINT `opthal_certificates_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `physical_exam` ADD CONSTRAINT `physical_exam_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `appointment_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HSU_bulletin` ADD CONSTRAINT `HSU_bulletin_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HSU_bulletin_files` ADD CONSTRAINT `HSU_bulletin_files_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `HSU_bulletin`(`post_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
