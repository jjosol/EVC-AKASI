-- CreateTable
CREATE TABLE `EditsInverntory` (
    `med_id` INTEGER NOT NULL,
    `medName` VARCHAR(225) NOT NULL,
    `date` DATETIME(0) NOT NULL,
    `cause` VARCHAR(225) NOT NULL,
    `addSubCount` INTEGER NOT NULL,
    `edit_id` INTEGER NOT NULL AUTO_INCREMENT,

    INDEX `FK_inventory_TO_EditsInverntory`(`med_id`, `medName`),
    PRIMARY KEY (`edit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HSU_bulletin` (
    `admin_id` INTEGER NOT NULL,
    `username` VARCHAR(225) NOT NULL,
    `caption` VARCHAR(500) NOT NULL,
    `file` TEXT NULL,
    `post_id` INTEGER NOT NULL AUTO_INCREMENT,

    UNIQUE INDEX `post_id`(`post_id`),
    INDEX `FK_admin_TO_HSU_bulletin`(`admin_id`, `username`),
    PRIMARY KEY (`post_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin` (
    `admin_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(225) NOT NULL,
    `password` VARCHAR(225) NOT NULL,
    `gmail` VARCHAR(225) NOT NULL,

    UNIQUE INDEX `admin_id`(`admin_id`),
    PRIMARY KEY (`admin_id`, `username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointmant` (
    `appointment_id` INTEGER NOT NULL,
    `client_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `hour` INTEGER NOT NULL,
    `minute` INTEGER NOT NULL,

    UNIQUE INDEX `appointment_id`(`appointment_id`),
    INDEX `FK_client_TO_appointmant`(`client_id`),
    PRIMARY KEY (`appointment_id`)
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
    `grade` INTEGER NULL,
    `section` VARCHAR(225) NOT NULL,

    UNIQUE INDEX `client_id`(`client_id`),
    PRIMARY KEY (`client_id`, `username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultation_records` (
    `client_id` INTEGER NOT NULL,
    `admin_id` INTEGER NOT NULL,
    `consultation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(0) NOT NULL,
    `patient_name` VARCHAR(225) NOT NULL,
    `patient_occupation` VARCHAR(225) NOT NULL,
    `doctor` VARCHAR(225) NOT NULL,
    `complaint` VARCHAR(225) NOT NULL,
    `remarks` VARCHAR(500) NOT NULL,
    `confined` BOOLEAN NOT NULL,
    `medAdministration` BOOLEAN NOT NULL,

    UNIQUE INDEX `consultation_id`(`consultation_id`),
    INDEX `FK_admin_TO_consultation_records`(`admin_id`),
    INDEX `FK_client_TO_consultation_records`(`client_id`),
    PRIMARY KEY (`consultation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dental_certificates` (
    `client_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `dental` BLOB NOT NULL,
    `dental_id` INTEGER NOT NULL AUTO_INCREMENT,

    INDEX `FK_client_TO_dental_certificates`(`client_id`),
    PRIMARY KEY (`dental_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory` (
    `med_id` INTEGER NOT NULL AUTO_INCREMENT,
    `medName` VARCHAR(225) NOT NULL,
    `expiration` DATE NOT NULL,
    `count` INTEGER NOT NULL,

    PRIMARY KEY (`med_id`, `medName`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medAdministration` (
    `client_id` INTEGER NOT NULL,
    `admin_id` INTEGER NOT NULL,
    `med_id` INTEGER NOT NULL,
    `consultation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(0) NOT NULL,
    `patient` VARCHAR(225) NOT NULL,
    `compalint` VARCHAR(500) NOT NULL,
    `medName` VARCHAR(225) NOT NULL,
    `count` INTEGER NOT NULL,

    INDEX `FK_admin_TO_medAdministration`(`admin_id`),
    INDEX `FK_client_TO_medAdministration`(`client_id`),
    INDEX `FK_inventory_TO_medAdministration`(`med_id`, `medName`),
    PRIMARY KEY (`consultation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medical_certificates` (
    `client_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `medical` BLOB NOT NULL,
    `medical_id` INTEGER NOT NULL AUTO_INCREMENT,

    INDEX `FK_client_TO_medical_certificates`(`client_id`),
    PRIMARY KEY (`medical_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `opthal_certificates` (
    `client_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `opthal` BLOB NOT NULL,
    `opthal_id` INTEGER NOT NULL AUTO_INCREMENT,

    INDEX `FK_client_TO_opthal_certificates`(`client_id`),
    PRIMARY KEY (`opthal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `physical_exam` (
    `client_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `physical` BLOB NOT NULL,
    `physical_id` INTEGER NOT NULL AUTO_INCREMENT,

    INDEX `FK_client_TO_physical_exam`(`client_id`),
    PRIMARY KEY (`physical_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment` (
    `equip_id` INTEGER NOT NULL AUTO_INCREMENT,
    `equipName` VARCHAR(225) NOT NULL,
    `count` INTEGER NOT NULL,

    UNIQUE INDEX `equipment_equipName_key`(`equipName`),
    PRIMARY KEY (`equip_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `medAdministration` ADD CONSTRAINT `FK_admin_TO_medAdministration` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`admin_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `FK_client_TO_medAdministration` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medAdministration` ADD CONSTRAINT `FK_inventory_TO_medAdministration` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medical_certificates` ADD CONSTRAINT `FK_client_TO_medical_certificates` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `opthal_certificates` ADD CONSTRAINT `FK_client_TO_opthal_certificates` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `physical_exam` ADD CONSTRAINT `FK_client_TO_physical_exam` FOREIGN KEY (`client_id`) REFERENCES `client`(`client_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
