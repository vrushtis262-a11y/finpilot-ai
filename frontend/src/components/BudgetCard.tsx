type BudgetSummary = {
    month: string;
    budget_amount: number;
    total_expense: number;
    remaining_amount: number;
    percentage_used: number;
    is_over_budget: boolean;
};

type BudgetCardProps = {
    budget: BudgetSummary | null;
    isLoading: boolean;
    error: string;
    onManageBudget: () => void;
};

function BudgetCard({
    budget,
    isLoading,
    error,
    onManageBudget,
}: BudgetCardProps) {
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);

    const formatMonth = (month: string) => {
        const [year, monthNumber] = month.split("-");

        const date = new Date(
            Number(year),
            Number(monthNumber) - 1,
            1
        );

        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            year: "numeric",
        }).format(date);
    };

    if (isLoading) {
        return (
            <section
                aria-label="Loading monthly budget"
                className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/10"
            >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="w-full max-w-sm">
                        <div className="h-4 w-28 rounded bg-slate-800" />
                        <div className="mt-3 h-7 w-48 rounded bg-slate-800" />
                        <div className="mt-4 h-4 w-full rounded bg-slate-800" />
                    </div>

                    <div className="w-full sm:w-40">
                        <div className="h-4 w-24 rounded bg-slate-800 sm:ml-auto" />
                        <div className="mt-3 h-7 w-32 rounded bg-slate-800 sm:ml-auto" />
                    </div>
                </div>

                <div className="mt-7 h-3 rounded-full bg-slate-800" />

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="h-24 rounded-xl bg-slate-800/70" />
                    <div className="h-24 rounded-xl bg-slate-800/70" />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section
                role="alert"
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 shadow-lg shadow-black/10"
            >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-rose-300">
                            Monthly budget
                        </p>

                        <h2 className="mt-2 text-xl font-semibold text-white">
                            Could not load your budget
                        </h2>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-rose-200">
                            {error}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onManageBudget}
                        className="rounded-xl border border-rose-400/40 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:border-rose-300 hover:bg-rose-500/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-400/40"
                    >
                        Manage budget
                    </button>
                </div>
            </section>
        );
    }

    if (!budget) {
        return (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/10">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-cyan-400">
                            Monthly budget
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-white">
                            No budget set for this month
                        </h2>

                        <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                            Set a monthly spending limit to track your progress,
                            see how much remains, and receive an alert when you
                            are close to your limit.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onManageBudget}
                        className="shrink-0 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        Set budget
                    </button>
                </div>
            </section>
        );
    }

    const progressPercentage = Math.min(
        Math.max(budget.percentage_used, 0),
        100
    );

    const remainingPercentage = Math.max(
        100 - budget.percentage_used,
        0
    );

    const status = budget.is_over_budget
        ? {
            label: "Over budget",
            message: `You are ${formatCurrency(
                Math.abs(budget.remaining_amount)
            )} over your monthly budget.`,
            border: "border-rose-500/30",
            background: "bg-rose-500/10",
            text: "text-rose-300",
            progress: "bg-rose-500",
            badge: "bg-rose-500/15 text-rose-200",
        }
        : budget.percentage_used >= 80
            ? {
                label: "Approaching limit",
                message:
                    "You are close to reaching your monthly budget.",
                border: "border-amber-500/30",
                background: "bg-amber-500/10",
                text: "text-amber-300",
                progress: "bg-amber-500",
                badge: "bg-amber-500/15 text-amber-200",
            }
            : {
                label: "On track",
                message:
                    "Your spending is currently within budget.",
                border: "border-cyan-400/30",
                background: "bg-cyan-400/10",
                text: "text-cyan-300",
                progress: "bg-cyan-400",
                badge: "bg-cyan-400/15 text-cyan-200",
            };

    return (
        <section
            className={`rounded-2xl border p-6 shadow-lg shadow-black/10 ${status.border} ${status.background}`}
        >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className={`text-sm font-semibold ${status.text}`}>
                            Monthly budget
                        </p>

                        <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}
                        >
                            {status.label}
                        </span>
                    </div>

                    <h2 className="mt-3 text-2xl font-bold text-white">
                        {formatMonth(budget.month)}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                        Track how your monthly expenses compare with your
                        spending limit.
                    </p>
                </div>

                <div className="flex flex-col items-start gap-4 sm:items-end">
                    <div className="sm:text-right">
                        <p className="text-sm text-slate-400">
                            Budget amount
                        </p>

                        <p className="mt-1 text-3xl font-bold text-white">
                            {formatCurrency(budget.budget_amount)}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onManageBudget}
                        className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:bg-slate-950/30 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                    >
                        Edit budget
                    </button>
                </div>
            </div>

            <div className="mt-7">
                <div className="mb-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium text-slate-200">
                        Spending progress
                    </span>

                    <span className={status.text}>
                        {budget.percentage_used.toFixed(1)}% used
                    </span>
                </div>

                <div
                    className="h-3 overflow-hidden rounded-full bg-slate-800"
                    role="progressbar"
                    aria-label="Monthly budget used"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progressPercentage)}
                >
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${status.progress}`}
                        style={{
                            width: `${progressPercentage}%`,
                        }}
                    />
                </div>

                {!budget.is_over_budget && (
                    <p className="mt-2 text-right text-xs text-slate-400">
                        {remainingPercentage.toFixed(1)}% remaining
                    </p>
                )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
                    <p className="text-sm text-slate-400">
                        Total spent
                    </p>

                    <p className="mt-2 text-xl font-semibold text-white">
                        {formatCurrency(budget.total_expense)}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
                    <p className="text-sm text-slate-400">
                        {budget.is_over_budget
                            ? "Amount over"
                            : "Remaining"}
                    </p>

                    <p
                        className={`mt-2 text-xl font-semibold ${budget.is_over_budget
                            ? "text-rose-300"
                            : "text-emerald-300"
                            }`}
                    >
                        {formatCurrency(
                            Math.abs(budget.remaining_amount)
                        )}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
                    <p className="text-sm text-slate-400">
                        Budget used
                    </p>

                    <p className={`mt-2 text-xl font-semibold ${status.text}`}>
                        {budget.percentage_used.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div
                className={`mt-5 rounded-xl border border-slate-700/60 bg-slate-950/30 px-4 py-3 text-sm leading-6 ${status.text}`}
            >
                {status.message}
            </div>
        </section>
    );
}

export type { BudgetSummary };

export default BudgetCard;