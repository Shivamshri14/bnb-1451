import { getExpensesAction } from "@/actions/expenses";
import ExpenseWorkspace from "@/components/expenses/ExpenseWorkspace";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const revalidate = 0; // Dynamic route to pull live expense records

export default async function ExpensesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const res = await getExpensesAction();
  const expenses = res.success && res.data ? res.data : [];

  return <ExpenseWorkspace initialExpenses={expenses} />;
}
