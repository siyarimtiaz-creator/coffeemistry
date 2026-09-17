ALTER TABLE `productImages` ADD `originalFilename` varchar(255);--> statement-breakpoint
ALTER TABLE `productImages` ADD `processingStatus` varchar(32) DEFAULT 'ready' NOT NULL;