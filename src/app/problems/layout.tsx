import { ProblemMenuProvider } from "@/components/problem-menu";

// Holds the problem side menu for the whole section. It lives here, above
// the [slug] segment, because a layout inside that segment would remount on
// every problem — taking the menu's filters with it.
export default function ProblemsLayout({ children }: LayoutProps<"/problems">) {
  return <ProblemMenuProvider>{children}</ProblemMenuProvider>;
}
