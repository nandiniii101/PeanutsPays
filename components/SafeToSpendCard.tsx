"use client";

import { ShieldCheck, AlertCircle, Calendar } from "lucide-react";

interface SafeToSpendProps {
  income: number;
  expenses: number;
  daysRemaining: number;
}

export default function SafeToSpendCard({
  income,
  expenses,
  daysRemaining,
}: SafeToSpendProps) {
  const remainingBalance = income - expenses;
  const isOverspent = income > 0 && remainingBalance <= 0;
  const noIncome = income <= 0;

  const safePerDay = Math.max(0, Math.floor(remainingBalance / Math.max(1, daysRemaining)));

  const fmt = (v: number) =>
    `\u20B9${v.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

  return (
    <div className="bg-gradient-to-r from-teal-900 to-[#0f2044] text-white rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck size={18} className="text-teal-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-200">
              Safe to Spend Today
            </span>
          </div>

          {noIncome ? (
            <div>
              <p className="text-lg font-bold text-teal-100">
                Log income to calculate daily allowance
              </p>
              <p className="text-xs text-teal-200/80 mt-1">
                You have spent {fmt(expenses)} this month. Add your monthly stipend or allowance to see your daily target.
              </p>
            </div>
          ) : isOverspent ? (
            <div className="flex items-start gap-2">
              <AlertCircle size={20} className="text-[#f4614d] shrink-0 mt-0.5" />
              <div>
                <p className="text-base font-bold text-red-200">
                  You&apos;ve spent more than your logged income this month
                </p>
                <p className="text-xs text-teal-200/80 mt-0.5">
                  Spent {fmt(expenses)} vs {fmt(income)} earned ({fmt(Math.abs(remainingBalance))} deficit).
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {fmt(safePerDay)}
                </span>
                <span className="text-xs text-teal-300 font-medium">/ day</span>
              </div>
              <p className="text-xs text-teal-200/90 mt-1">
                Based on this month&apos;s income ({fmt(income)}) and spending ({fmt(expenses)}) with {daysRemaining} days left.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center bg-white/10 px-3.5 py-2 rounded-lg border border-white/15 text-xs text-teal-100 shrink-0">
          <Calendar size={15} className="text-teal-300" />
          <span>{daysRemaining} days left in month</span>
        </div>
      </div>
    </div>
  );
}
