CREATE TABLE "algo_submissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "algo_submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"problem_id" integer NOT NULL,
	"language" text NOT NULL,
	"code" text NOT NULL,
	"status" text NOT NULL,
	"passed" integer NOT NULL,
	"total" integer NOT NULL,
	"runtime_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "algo_submissions" ADD CONSTRAINT "algo_submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "algo_submissions" ADD CONSTRAINT "algo_submissions_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "algo_submissions_user_problem_idx" ON "algo_submissions" USING btree ("user_id","problem_id","created_at");