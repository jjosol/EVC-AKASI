-- CreateTable
CREATE TABLE `manager` (
    `manager_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(225) NOT NULL,
    `password` VARCHAR(225) NOT NULL,
    `gmail` VARCHAR(225) NOT NULL,

    UNIQUE INDEX `manager_id`(`manager_id`),
    PRIMARY KEY (`manager_id`, `username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin` (
    `admin_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(225) NOT NULL,
    `password` VARCHAR(225) NOT NULL,
    `gmail` VARCHAR(225) NOT NULL,
    `name` VARCHAR(225) NOT NULL,

    UNIQUE INDEX `admin_id`(`admin_id`),
    PRIMARY KEY (`admin_id`, `username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client` (
    `client_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(225) NOT NULL,
    `password` VARCHAR(225) NOT NULL,
    `name` VARCHAR(225) NOT NULL,
    `gmail` VARCHAR(225) NOT NULL,
    `age` INTEGER NOT NULL,
    `gender` VARCHAR(225) NOT NULL,
    `category` VARCHAR(225) NOT NULL,
    `type` VARCHAR(225) NOT NULL,
    `grade` INTEGER NULL,
    `section` VARCHAR(225) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',

    UNIQUE INDEX `client_id`(`client_id`),
    PRIMARY KEY (`client_id`, `username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment` (
    `appointment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `hour` INTEGER NOT NULL,
    `minute` INTEGER NOT NULL,
    `complaint` VARCHAR(225) NOT NULL,

    UNIQUE INDEX `appointment_id`(`appointment_id`),
    INDEX `FK_client_TO_appointmant`(`client_id`),
    PRIMARY KEY (`appointment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultation_records` (
    `consultation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `admin_id` INTEGER NOT NULL,
    `date` DATETIME(0) NOT NULL,
    `patient_name` VARCHAR(225) NOT NULL,
    `patient_occupation` VARCHAR(225) NOT NULL,
    `doctor` VARCHAR(225) NOT NULL,
    `complaint` VARCHAR(225) NOT NULL,
    `remarks` VARCHAR(500) NOT NULL,
    `intervention` VARCHAR(500) NOT NULL,
    `action` VARCHAR(500) NOT NULL DEFAULT '',
    `confined` BOOLEAN NOT NULL,
    `medAdministration` BOOLEAN NOT NULL,
    `disposition` VARCHAR(500) NOT NULL DEFAULT '',
    `intern` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `consultation_id`(`consultation_id`),
    INDEX `FK_admin_TO_consultation_records`(`admin_id`),
    INDEX `FK_client_TO_consultation_records`(`client_id`),
    PRIMARY KEY (`consultation_id`)
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

-- CreateTable
CREATE TABLE `dental_certificates` (
    `client_id` INTEGER NOT NULL,
    `grade` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `dental` LONGBLOB NOT NULL,
    `dental_id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `notes` VARCHAR(500) NULL,

    INDEX `FK_client_TO_dental_certificates`(`client_id`),
    PRIMARY KEY (`dental_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory` (
    `med_id` INTEGER NOT NULL AUTO_INCREMENT,
    `medName` VARCHAR(225) NOT NULL,
    `category_id` INTEGER NOT NULL DEFAULT 1,
    `expiration` DATE NOT NULL,
    `count` INTEGER NOT NULL,

    INDEX `inventory_category_id_idx`(`category_id`),
    PRIMARY KEY (`med_id`, `medName`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicineCategory` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(225) NOT NULL,

    UNIQUE INDEX `medicineCategory_name_key`(`name`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment` (
    `equip_id` INTEGER NOT NULL AUTO_INCREMENT,
    `equipName` VARCHAR(225) NOT NULL,
    `count` INTEGER NOT NULL,

    UNIQUE INDEX `equipment_equipName_key`(`equipName`),
    PRIMARY KEY (`equip_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EditsInventory` (
    `edit_id` INTEGER NOT NULL AUTO_INCREMENT,
    `med_id` INTEGER NOT NULL,
    `medName` VARCHAR(225) NOT NULL,
    `date` DATETIME(0) NOT NULL,
    `cause` VARCHAR(225) NOT NULL,
    `addSubCount` INTEGER NOT NULL,

    INDEX `FK_inventory_TO_EditsInventory`(`med_id`, `medName`),
    PRIMARY KEY (`edit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medAdministration` (
    `consultation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `admin_id` INTEGER NOT NULL,
    `med_id` INTEGER NOT NULL,
    `medName` VARCHAR(225) NOT NULL,
    `date` DATETIME(0) NOT NULL,
    `patient` VARCHAR(225) NOT NULL,
    `count` INTEGER NOT NULL,
    `schedule` VARCHAR(225) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `remarks` VARCHAR(500) NULL,
    `intervention` VARCHAR(500) NULL,

    INDEX `medAdministration_admin_id_idx`(`admin_id`),
    INDEX `medAdministration_client_id_idx`(`client_id`),
    INDEX `medAdministration_med_id_medName_idx`(`med_id`, `medName`),
    PRIMARY KEY (`consultation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medical_certificates` (
    `medical_id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `grade` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `medical` LONGBLOB NOT NULL,

    INDEX `FK_client_TO_medical_certificates`(`client_id`),
    PRIMARY KEY (`medical_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `opthal_certificates` (
    `client_id` INTEGER NOT NULL,
    `grade` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `opthal` LONGBLOB NOT NULL,
    `opthal_id` INTEGER NOT NULL AUTO_INCREMENT,

    INDEX `FK_client_TO_opthal_certificates`(`client_id`),
    PRIMARY KEY (`opthal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `physical_exam` (
    `client_id` INTEGER NOT NULL,
    `grade` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `physical` LONGBLOB NOT NULL,
    `physical_id` INTEGER NOT NULL AUTO_INCREMENT,

    INDEX `FK_client_TO_physical_exam`(`client_id`),
    PRIMARY KEY (`physical_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hsu_bulletin` (
    `post_id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL,
    `username` VARCHAR(225) NOT NULL,
    `caption` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FK_admin_TO_hsu_bulletin`(`admin_id`, `username`),
    PRIMARY KEY (`post_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hsu_bulletin_files` (
    `file_id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_type` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `data` LONGBLOB NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `hsu_bulletin_files_post_id_idx`(`post_id`),
    PRIMARY KEY (`file_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `EditsInventory` ADD CONSTRAINT `EditsInventory_med_id_medName_fkey` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `medAdministration_med_id_medName_fkey` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medical_certificates` ADD CONSTRAINT `medical_certificates_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `opthal_certificates` ADD CONSTRAINT `opthal_certificates_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `physical_exam` ADD CONSTRAINT `physical_exam_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `hsu_bulletin` ADD CONSTRAINT `hsu_bulletin_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `hsu_bulletin_files` ADD CONSTRAINT `hsu_bulletin_files_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `hsu_bulletin`(`post_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
