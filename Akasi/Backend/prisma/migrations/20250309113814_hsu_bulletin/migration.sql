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
