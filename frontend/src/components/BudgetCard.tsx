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
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <p className="text-slate-400">
                    Loading monthly budget...
                </p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="font-semibold text-red-400">
                            Could not load budget
                        </p>

                        <p className="mt-2 text-sm text-red-200">
                            {error}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onManageBudget}
                        className="rounded-xl border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-300 hover:text-white"
                    >
                        Manage budget
                    </button>
                </div>
            </section>
        );
    }

    if (!budget) {
        return (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-cyan-400">
                            Monthly budget
                        </p>

                        <h2 className="mt-3 text-xl font-semibold">
                            No budget set for this month
                        </h2>

                        <p className="mt-3 text-slate-400">
                            Create a monthly budget to track your
                            spending progress.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onManageBudget}
                        className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
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

    const statusClasses = budget.is_over_budget
        ? {
            border: "border-red-500/30",
            background: "bg-red-500/10",
            text: "text-red-400",
            progress: "bg-red-500",
        }
        : budget.percentage_used >= 80
            ? {
                border: "border-amber-500/30",
                background: "bg-amber-500/10",
                text: "text-amber-400",
                progress: "bg-amber-500",
            }
            : {
                border: "border-cyan-400/30",
                background: "bg-cyan-400/10",
                text: "text-cyan-400",
                progress: "bg-cyan-400",
            };

    return (
        <section
            className={`rounded-2xl border p-6 ${statusClasses.border} ${statusClasses.background}`}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p
                        className={`text-sm font-semibold ${statusClasses.text}`}
                    >
                        Monthly budget
                    </p>

                    <h2 className="mt-2 text-2xl font-bold">
                        {formatMonth(budget.month)}
                    </h2>
                </div>

                <div className="flex flex-col items-start gap-3 sm:items-end">
                    <div className="sm:text-right">
                        <p className="text-sm text-slate-400">
                            Budget amount
                        </p>

                        <p className="mt-1 text-2xl font-bold">
                            {formatCurrency(budget.budget_amount)}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onManageBudget}
                        className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
                    >
                        Edit budget
                    </button>
                </div>
            </div>

            <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-300">
                        Spending progress
                    </span>

                    <span className={statusClasses.text}>
                        {budget.percentage_used.toFixed(2)}%
                    </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                    <div
                        className={`h-full rounded-full transition-all ${statusClasses.progress}`}
                        style={{
                            width: `${progressPercentage}%`,
                        }}
                    />
                </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
                    <p className="text-sm text-slate-400">
                        Total spent
                    </p>

                    <p className="mt-2 text-xl font-semibold">
                        {formatCurrency(budget.total_expense)}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
                    <p className="text-sm text-slate-400">
                        {budget.is_over_budget
                            ? "Amount over budget"
                            : "Remaining budget"}
                    </p>

                    <p
                        className={`mt-2 text-xl font-semibold ${budget.is_over_budget
                                ? "text-red-400"
                                : "text-emerald-400"
                            }`}
                    >
                        {formatCurrency(
                            Math.abs(budget.remaining_amount)
                        )}
                    </p>
                </div>
            </div>

            <p className={`mt-5 text-sm ${statusClasses.text}`}>
                {budget.is_over_budget
                    ? `You are ${formatCurrency(
                        Math.abs(budget.remaining_amount)
                    )} over your monthly budget.`
                    : budget.percentage_used >= 80
                        ? "You are close to reaching your monthly budget."
                        : "Your spending is currently within budget."}
            </p>
        </section>
    );
}

export type { BudgetSummary };
export default BudgetCard;