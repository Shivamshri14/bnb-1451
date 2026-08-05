"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, ExpenseInput } from "@/lib/validations";
import { createExpenseAction, deleteExpenseAction } from "@/actions/expenses";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Loader2, X } from "lucide-react";

interface ExpenseWorkspaceProps {
  initialExpenses: any[];
}

export default function ExpenseWorkspace({ initialExpenses }: ExpenseWorkspaceProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: { title: "", amount: 0 },
  });

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const res = await createExpenseAction(data);
      if (res.success && res.data) {
        toast.success("Expense added");
        setExpenses([res.data, ...expenses]);
        setIsFormOpen(false);
        reset({ title: "", amount: 0 });
      } else {
        toast.error(("error" in res && res.error) || "Failed");
      }
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete expense “${title}”?`)) return;
    const res = await deleteExpenseAction(id);
    if (res.success) {
      setExpenses(expenses.filter((e) => e._id !== id));
      toast.success("Deleted");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Expenses</p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-semibold mt-1">
            Cost log
          </h1>
          <p className="text-sm text-muted mt-1">
            Total: <strong>₹{total.toLocaleString("en-IN")}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white self-start cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add expense
        </button>
      </div>

      <div className="space-y-3 md:hidden">
        {expenses.map((item) => (
          <div key={item._id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex justify-between gap-2">
              <div className="font-bold">{item.title}</div>
              <div className="font-black">₹{item.amount.toLocaleString("en-IN")}</div>
            </div>
            <div className="text-[11px] text-muted mt-2">
              By {item.createdBy || "—"} ·{" "}
              {item.createdAt ? format(parseISO(item.createdAt), "dd MMM yyyy, hh:mm a") : "—"}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(item._id, item.title)}
              className="mt-2 text-xs font-semibold text-rose-600 cursor-pointer"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="hidden md:block rounded-2xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted/60 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Created by</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {expenses.map((item) => (
              <tr key={item._id} className="hover:bg-surface-muted/40">
                <td className="px-4 py-3 font-semibold">{item.title}</td>
                <td className="px-4 py-3 font-bold">₹{item.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-xs">{item.createdBy || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {item.createdAt
                    ? format(parseISO(item.createdAt), "dd MMM yyyy, hh:mm a")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(item._id, item.title)}
                    className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer inline-flex"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No expenses yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsFormOpen(false)}
            aria-label="Close"
          />
          <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-surface p-5 shadow-xl">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute right-3 top-3 p-2 rounded-lg hover:bg-surface-muted cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold mb-4">Add expense</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted uppercase">Title *</label>
                <input
                  {...register("title")}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g. Electricity bill"
                />
                {errors.title && (
                  <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted uppercase">Amount (₹) *</label>
                <input
                  type="number"
                  {...register("amount")}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface-muted/40 font-bold focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.amount && (
                  <p className="text-xs text-rose-500 mt-1">{errors.amount.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-accent text-white py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
