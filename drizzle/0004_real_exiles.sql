ALTER TABLE `productImages` ADD `imageType` varchar(64) DEFAULT 'owner_product_photo' NOT NULL;--> statement-breakpoint
ALTER TABLE `productImages` ADD `source` varchar(64) DEFAULT 'owner_upload' NOT NULL;--> statement-breakpoint
ALTER TABLE `productImages` ADD `replacementAllowed` boolean DEFAULT true NOT NULL;