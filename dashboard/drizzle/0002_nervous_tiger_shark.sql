CREATE TABLE `authUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` text,
	`isAuthorized` boolean NOT NULL DEFAULT false,
	`isAdmin` boolean NOT NULL DEFAULT false,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `authUsers_email_unique` UNIQUE(`email`)
);
