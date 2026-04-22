CREATE TABLE `cacheItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(64) NOT NULL,
	`productName` text NOT NULL,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cacheItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `cacheItems_productId_unique` UNIQUE(`productId`)
);
--> statement-breakpoint
CREATE TABLE `executionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executionId` varchar(64) NOT NULL,
	`status` enum('success','error','partial') NOT NULL,
	`productFound` varchar(64),
	`productName` text,
	`channelsPublished` json NOT NULL DEFAULT ('[]'),
	`errorMessage` text,
	`executionTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `executionLogs_id` PRIMARY KEY(`id`),
	CONSTRAINT `executionLogs_executionId_unique` UNIQUE(`executionId`)
);
--> statement-breakpoint
CREATE TABLE `integrationStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationName` enum('shopee','telegram','buffer_instagram','gemini') NOT NULL,
	`status` enum('healthy','warning','error') NOT NULL DEFAULT 'healthy',
	`lastCheck` timestamp NOT NULL DEFAULT (now()),
	`errorMessage` text,
	`responseTime` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrationStatus_id` PRIMARY KEY(`id`),
	CONSTRAINT `integrationStatus_integrationName_unique` UNIQUE(`integrationName`)
);
--> statement-breakpoint
CREATE TABLE `metricsSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`totalPublished` int NOT NULL DEFAULT 0,
	`telegramSuccess` int NOT NULL DEFAULT 0,
	`instagramSuccess` int NOT NULL DEFAULT 0,
	`facebookSuccess` int NOT NULL DEFAULT 0,
	`totalFailed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `metricsSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pipelineConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleTimes` json NOT NULL DEFAULT ('["09:00","15:00","21:00"]'),
	`keywords` json NOT NULL DEFAULT ('{}'),
	`maxPrice` decimal(10,2) NOT NULL DEFAULT '1000.00',
	`minRating` decimal(3,1) NOT NULL DEFAULT '3.5',
	`activeCategories` json NOT NULL DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pipelineConfig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(64) NOT NULL,
	`productName` text NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`imageUrl` varchar(512),
	`affiliateUrl` varchar(512) NOT NULL,
	`category` varchar(128) NOT NULL,
	`status` enum('published','failed','pending') NOT NULL DEFAULT 'pending',
	`publishedChannels` json NOT NULL DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
