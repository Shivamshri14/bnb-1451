"use server";

import { expenseSchema, ExpenseInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import Expense from "@/models/Expense";

export type ExpenseRecord = {
  _id: string;
  title: string;
  amount: number;
  createdAt: string;
  createdBy: string;
};

function mapExpense(doc: any): ExpenseRecord {
  return {
    _id: String(doc._id),
    title: doc.title,
    amount: doc.amount,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    createdBy: doc.createdBy || "Owner",
  };
}

export async function getExpensesAction(filters?: { search?: string }) {
  await connectToDatabase();
  const query: any = {};
  if (filters?.search) {
    const s = filters.search;
    query.$or = [
      { title: new RegExp(s, "i") },
      { createdBy: new RegExp(s, "i") },
    ];
  }
  const docs = await Expense.find(query).sort({ createdAt: -1 }).lean();
  return { success: true, data: docs.map(mapExpense) };
}

export async function createExpenseAction(data: ExpenseInput) {
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await connectToDatabase();
  const session = await auth();
  const createdBy = session?.user?.name || session?.user?.email || "Owner";

  const doc = await Expense.create({
    title: parsed.data.title,
    amount: parsed.data.amount,
    createdBy,
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  return { success: true, data: mapExpense(doc.toObject()) };
}

export async function deleteExpenseAction(id: string) {
  await connectToDatabase();
  await Expense.findByIdAndDelete(id);
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}
