CREATE TABLE `businessSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(40) NOT NULL,
	`businessName` varchar(160) NOT NULL,
	`shortAddress` varchar(200) NOT NULL,
	`fullAddress` text NOT NULL,
	`phone` varchar(40) NOT NULL,
	`whatsapp` varchar(40) NOT NULL,
	`openingHours` text,
	`estimatedOrderTime` varchar(140),
	`rating` varchar(12) NOT NULL,
	`reviewCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `businessSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`sortOrder` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `customerAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`address` text NOT NULL,
	`area` varchar(100),
	`instructions` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	CONSTRAINT `customerAddresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(160) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`whatsapp` varchar(40),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorites_user_product_idx` UNIQUE(`userId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int,
	`productName` varchar(160) NOT NULL,
	`productDescription` text NOT NULL,
	`productSize` varchar(80),
	`unitPricePkr` int NOT NULL,
	`quantity` int NOT NULL,
	`customizationsJson` text,
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`status` enum('pending','preparing','ready') NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(24) NOT NULL,
	`customerId` int,
	`customerName` varchar(160) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`whatsapp` varchar(40),
	`orderType` enum('pickup','delivery') NOT NULL,
	`deliveryAddress` text,
	`area` varchar(100),
	`deliveryInstructions` text,
	`notes` text,
	`subtotalPkr` int NOT NULL,
	`discountPkr` int NOT NULL DEFAULT 0,
	`deliveryFeePkr` int,
	`totalPkr` int,
	`paymentMethodLabel` varchar(100),
	`paymentStatus` varchar(40),
	`status` enum('pending','preparing','ready') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `paymentMethods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(100) NOT NULL,
	`methodType` enum('cash_on_delivery','online','other') NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `paymentMethods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productOptionGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`label` varchar(100) NOT NULL,
	`choiceType` enum('single','multiple') NOT NULL DEFAULT 'single',
	`isRequired` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `productOptionGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`optionGroupId` int NOT NULL,
	`label` varchar(100) NOT NULL,
	`pricePkrDelta` int NOT NULL DEFAULT 0,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `productOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`size` varchar(80),
	`pricePkr` int NOT NULL,
	`imageUrl` text,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`customizationsEnabled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `customerAddresses` ADD CONSTRAINT `customerAddresses_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderItems` ADD CONSTRAINT `orderItems_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderItems` ADD CONSTRAINT `orderItems_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderStatusHistory` ADD CONSTRAINT `orderStatusHistory_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productOptionGroups` ADD CONSTRAINT `productOptionGroups_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productOptions` ADD CONSTRAINT `productOptions_optionGroupId_productOptionGroups_id_fk` FOREIGN KEY (`optionGroupId`) REFERENCES `productOptionGroups`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `orders_status_created_idx` ON `orders` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`categoryId`);