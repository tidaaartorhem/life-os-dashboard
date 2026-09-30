"use client";

import { useState, useTransition } from "react";
import { Zap, Plus, Receipt } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTaskAction } from "@/app/actions/tasks";
import { createTransactionAction } from "@/app/actions/misc";
import { todayKey } from "@/lib/dates";

export function QuickCapture() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const quickTask = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    if (!title) return;
    setError(null);
    startTransition(async () => {
      try {
        await createTaskAction({ title, dueDate: todayKey() });
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add task.");
      }
    });
  };

  const quickTransaction = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    const category = String(data.get("category") ?? "").trim();
    if (!amount || !category) return;
    const kind = String(data.get("kind") ?? "expense");
    setError(null);
    startTransition(async () => {
      try {
        await createTransactionAction({
          amount: kind === "expense" ? -Math.abs(amount) : Math.abs(amount),
          category,
          description: String(data.get("description") ?? ""),
          date: todayKey(),
        });
        form.reset();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not log transaction."
        );
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-4 text-indigo-600" aria-hidden="true" />
          Quick capture
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            quickTask(e.currentTarget);
          }}
          className="flex flex-col gap-2"
        >
          <Label htmlFor="quick-task" className="flex items-center gap-1.5">
            <Plus className="size-3.5" aria-hidden="true" />
            Task due today
          </Label>
          <div className="flex gap-2">
            <Input
              id="quick-task"
              name="title"
              placeholder="Add a task…"
              maxLength={200}
              className="flex-1"
            />
            <Button type="submit" disabled={isPending}>
              Add
            </Button>
          </div>
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            quickTransaction(e.currentTarget);
          }}
          className="flex flex-col gap-2"
        >
          <Label htmlFor="quick-amount" className="flex items-center gap-1.5">
            <Receipt className="size-3.5" aria-hidden="true" />
            Log spending / income
          </Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="quick-amount"
              name="amount"
              type="number"
              step="0.01"
              min={0.01}
              placeholder="0.00"
              className="w-28"
              required
            />
            <Input
              name="category"
              placeholder="Category"
              maxLength={40}
              className="w-32"
              required
            />
            <label className="sr-only" htmlFor="quick-kind">
              Transaction type
            </label>
            <select
              id="quick-kind"
              name="kind"
              className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm"
              defaultValue="expense"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <Button type="submit" disabled={isPending}>
              Log
            </Button>
          </div>
        </form>
      </CardContent>
      {error && (
        <p role="alert" className="px-5 pb-4 text-sm text-red-600">
          {error}
        </p>
      )}
    </Card>
  );
}
