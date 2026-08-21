CREATE TYPE "public"."question_timeframe" AS ENUM('thirty-days', 'three-months', 'six-months', 'more-than-six-months', 'all');--> statement-breakpoint
CREATE TABLE "company_questions" (
	"company_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"timeframe" "question_timeframe" NOT NULL,
	"frequency" real NOT NULL,
	CONSTRAINT "company_questions_company_id_question_id_timeframe_pk" PRIMARY KEY("company_id","question_id","timeframe")
);
--> statement-breakpoint
CREATE TABLE "leetcode_questions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leetcode_questions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"topics" jsonb NOT NULL,
	CONSTRAINT "leetcode_questions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "company_questions" ADD CONSTRAINT "company_questions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_questions" ADD CONSTRAINT "company_questions_question_id_leetcode_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."leetcode_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_questions_timeframe_idx" ON "company_questions" USING btree ("timeframe","frequency");