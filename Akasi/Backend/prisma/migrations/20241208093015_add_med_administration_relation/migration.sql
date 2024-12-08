-- AddForeignKey
ALTER TABLE `med_administration` ADD CONSTRAINT `med_administration_med_id_medName_fkey` FOREIGN KEY (`med_id`, `medName`) REFERENCES `inventory`(`med_id`, `medName`) ON DELETE RESTRICT ON UPDATE CASCADE;
