import type { Metadata } from "next";
import { CompanySearch } from "@/components/company-search";
import { listCompaniesWithCounts } from "@/lib/data";

export const metadata: Metadata = { title: "Companies" };

export const revalidate = 300;

export default async function CompaniesPage() {
  const companies = await listCompaniesWithCounts();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Loop structure and frequently asked questions, company by company.
      </p>
      <CompanySearch companies={companies} />
    </div>
  );
}
