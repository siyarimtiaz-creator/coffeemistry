CREATE TABLE `orderPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`paymentMethodId` int,
	`paymentMethodCode` varchar(40) NOT NULL,
	`paymentMethodLabel` varchar(100) NOT NULL,
	`status` varchar(40) NOT NULL DEFAULT 'unpaid',
	`transactionReference` varchar(160),
	`amountPkr` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'PKR',
	`screenshotStorageKey` text,
	`screenshotUrl` text,
	`providerKey` varchar(80),
	`providerTransactionId` varchar(200),
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`verificationNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orderPayments_id` PRIMARY KEY(`id`),
	CONSTRAINT `orderPayments_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `code` varchar(40) NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `description` varchar(180) NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `requiresReference` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `providerKey` varchar(80);--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `providerStatus` varchar(40) DEFAULT 'not_configured' NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `receivingNumber` varchar(80);--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `accountTitle` varchar(160);--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `instructions` text;--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD CONSTRAINT `paymentMethods_code_unique` UNIQUE(`code`);--> statement-breakpoint
ALTER TABLE `orderPayments` ADD CONSTRAINT `orderPayments_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderPayments` ADD CONSTRAINT `orderPayments_paymentMethodId_paymentMethods_id_fk` FOREIGN KEY (`paymentMethodId`) REFERENCES `paymentMethods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderPayments` ADD CONSTRAINT `orderPayments_verifiedBy_users_id_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `order_payments_status_idx` ON `orderPayments` (`status`,`createdAt`);