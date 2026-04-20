CREATE TABLE `service_health` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_name` text NOT NULL,
	`status` text NOT NULL,
	`latency_ms` integer,
	`error` text,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
