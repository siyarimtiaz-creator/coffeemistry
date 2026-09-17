CREATE TABLE `productImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`storageKey` text NOT NULL,
	`url` text NOT NULL,
	`thumbnailStorageKey` text,
	`thumbnailUrl` text,
	`altText` varchar(260) NOT NULL,
	`caption` varchar(500),
	`mimeType` varchar(100) NOT NULL,
	`width` int,
	`height` int,
	`byteSize` int,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `productImages` ADD CONSTRAINT `productImages_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `product_images_product_idx` ON `productImages` (`productId`,`sortOrder`);