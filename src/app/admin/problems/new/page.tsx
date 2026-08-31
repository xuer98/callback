import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminProblemForm } from "@/components/admin-problem-form";
import { adminEmail } from "@/lib/admin-actions";

export const metadata: Metadata = { title: "New problem" };

export default async function NewProblemPage() {
  if (!(await adminEmail())) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/admin"
        className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        &larr; Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        New problem
      </h1>
      <div className="mt-6">
        <AdminProblemForm
          mode="create"
          initial={{
            title: "",
            summary: "",
            category: "algorithms",
            difficulty: "medium",
            companies: "",
            prompt: "",
            hints: [""],
            solution: "",
            rubric: "",
            testsJson: "",
            judgeConfigJson: "",
            uiJson: "",
          }}
        />
      </div>
    </div>
  );
}
