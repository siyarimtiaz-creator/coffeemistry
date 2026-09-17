ALTER TABLE `orderStatusHistory` MODIFY COLUMN `status` enum('new','confirmed','preparing','ready','out_for_delivery','completed','cancelled') NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('new','confirmed','preparing','ready','out_for_delivery','completed','cancelled') NOT NULL DEFAULT 'new';--> statement-breakpoint
ALTER TABLE `orderPayments` ADD `receiptMimeType` varchar(100);--> statement-breakpoint
ALTER TABLE `orderPayments` ADD `receiptByteSize` int;--> statement-breakpoint
ALTER TABLE `orderPayments` ADD `rejectedBy` int;--> statement-breakpoint
ALTER TABLE `orderPayments` ADD `rejectedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orderPayments` ADD `rejectionReason` text;--> statement-breakpoint
ALTER TABLE `orderPayments` ADD CONSTRAINT `orderPayments_rejectedBy_users_id_fk` FOREIGN KEY (`rejectedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;