CREATE TYPE "public"."category" AS ENUM('algorithms', 'system-design', 'behavioral', 'frontend', 'sql');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "companies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"blurb" text NOT NULL,
	"process" jsonb NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "problem_companies" (
	"problem_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	CONSTRAINT "problem_companies_problem_id_company_id_pk" PRIMARY KEY("problem_id","company_id")
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "problems_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" "category" NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"summary" text NOT NULL,
	"prompt" text NOT NULL,
	"hints" jsonb NOT NULL,
	"judge" jsonb,
	CONSTRAINT "problems_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "track_problems" (
	"track_id" integer NOT NULL,
	"problem_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "track_problems_track_id_problem_id_pk" PRIMARY KEY("track_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tracks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "tracks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "problem_companies" ADD CONSTRAINT "problem_companies_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_companies" ADD CONSTRAINT "problem_companies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_problems" ADD CONSTRAINT "track_problems_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_problems" ADD CONSTRAINT "track_problems_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;