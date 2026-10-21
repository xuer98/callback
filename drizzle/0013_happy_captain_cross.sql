CREATE TABLE "illustrations" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"scene" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
