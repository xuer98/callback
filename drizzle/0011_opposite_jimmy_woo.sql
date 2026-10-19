CREATE TABLE "guides" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "guides_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"company_id" integer,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"sources" jsonb NOT NULL,
	CONSTRAINT "guides_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "guides" ADD CONSTRAINT "guides_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;