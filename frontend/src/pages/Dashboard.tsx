import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import CategoryExpensePieChart from "../components/CategoryExpensePieChart";
import MonthlyIncomeExpenseChart from "../components/MonthlyIncomeExpenseChart";

type Transaction = {
    id: number;
    title: string;
    amount: number;
    category: string;
    transaction_type: "income" | "expense";
    transaction_date: string;
    user_id: number;
};

type AnalyticsSummary = {
    total_income: number;
    total_expense: number;
    balance: number;
    transaction_count: number;
};

type MonthlyAnalytics = {
    month: string;
    total_income: number;
    total_expense: number;
    balance: number;
};

type CategoryExpense = {
    category: string;
    total: number;
};

const emptySummary: AnalyticsSummary = {
    total_income: 0,
    total_expense: 0,
    balance: 0,
    transaction_count: 0,
};

function Dashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] =
        useState<AnalyticsSummary>(emptySummary);
    const [monthlyAnalytics, setMonthlyAnalytics] = useState<
        MonthlyAnalytics[]
    >([]);
    const [categoryExpenses, setCategoryExpenses] = useState<
        CategoryExpense[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem("token");
        navigate("/login");
    }, [navigate]);

    const fetchDashboardData = useCallback(async () => {
        if (!token) {
            return;
        }

        try {
            setError("");

            const [
                transactionsResponse,
                summaryResponse,
                monthlyResponse,
                categoryExpensesResponse,
            ] = await Promise.all([
                fetch("http://127.0.0.1:8000/transactions", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch("http://127.0.0.1:8000/analytics/summary", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch("http://127.0.0.1:8000/analytics/monthly", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch(
                    "http://127.0.0.1:8000/analytics/category-expenses",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                ),
            ]);

            if (
                transactionsResponse.status === 401 ||
                summaryResponse.status === 401 ||
                monthlyResponse.status === 401 ||
                categoryExpensesResponse.status === 401
            ) {
                handleUnauthorized();
                return;
            }

            const transactionsData =
                await transactionsResponse.json();
            const summaryData = await summaryResponse.json();
            const monthlyData = await monthlyResponse.json();
            const categoryExpensesData =
                await categoryExpensesResponse.json();

            if (!transactionsResponse.ok) {
                throw new Error(
                    typeof transactionsData.detail === "string"
                        ? transactionsData.detail
                        : "Could not load transactions."
                );
            }

            if (!summaryResponse.ok) {
                throw new Error(
                    typeof summaryData.detail === "string"
                        ? summaryData.detail
                        : "Could not load financial summary."
                );
            }

            if (!monthlyResponse.ok) {
                throw new Error(
                    typeof monthlyData.detail === "string"
                        ? monthlyData.detail
                        : "Could not load monthly analytics."
                );
            }

            if (!categoryExpensesResponse.ok) {
                throw new Error(
                    typeof categoryExpensesData.detail === "string"
                        ? categoryExpensesData.detail
                        : "Could not load category analytics."
                );
            }

            setTransactions(transactionsData);
            setSummary(summaryData);
            setMonthlyAnalytics(monthlyData);
            setCategoryExpenses(categoryExpensesData);
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load dashboard data."
            );
        } finally {
            setIsLoading(false);
        }
    }, [handleUnauthorized, token]);

    useEffect(() => {
        if (!token) {
            return;
        }

        fetchDashboardData();
    }, [fetchDashboardData, token]);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const totalIncome = summary.total_income;
    const totalExpenses = summary.total_expense;
    const totalBalance = summary.balance;
    const totalSavings = totalBalance;

    const incomeTransactionCount = transactions.filter(
        (transaction) => transaction.transaction_type === "income"
    ).length;

    const expenseTransactionCount = transactions.filter(
        (transaction) => transaction.transaction_type === "expense"
    ).length;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
        }).format(new Date(`${date}T00:00:00Z`));

    const handleDelete = async (transaction: Transaction) => {
        const shouldDelete = window.confirm(
            `Delete "${transaction.title}"? This action cannot be undone.`
        );

        if (!shouldDelete) {
            return;
        }

        try {
            setDeletingId(transaction.id);
            setError("");

            const response = await fetch(
                `http://127.0.0.1:8000/transactions/${transaction.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                let message = "Could not delete transaction.";

                try {
                    const data = await response.json();

                    if (typeof data.detail === "string") {
                        message = data.detail;
                    }
                } catch {
                    console.error(
                        "Could not read delete error response."
                    );
                }

                throw new Error(message);
            }

            await fetchDashboardData();
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Could not delete transaction."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const summaryCards = [
        {
            title: "Total balance",
            value: formatCurrency(totalBalance),
            change: "Income minus expenses",
        },
        {
            title: "Total income",
            value: formatCurrency(totalIncome),
            change: `${incomeTransactionCount} income transaction(s)`,
        },
        {
            title: "Total expenses",
            value: formatCurrency(totalExpenses),
            change: `${expenseTransactionCount} expense transaction(s)`,
        },
        {
            title: "Transactions",
            value: summary.transaction_count.toString(),
            change: "Total recorded transactions",
        },
    ];

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <header className="border-b border-slate-800 bg-slate-900">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="text-2xl font-bold"
                    >
                        FinPilot{" "}
                        <span className="text-cyan-400">AI</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <span className="hidden text-sm text-slate-400 sm:block">
                            Welcome back
                        </span>

                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold transition hover:border-cyan-400 hover:text-cyan-400"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                <p className="font-semibold text-cyan-400">
                    Financial overview
                </p>

                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                    Your dashboard
                </h1>

                <p className="mt-3 text-slate-400">
                    Track your financial health and recent activity.
                </p>

                <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <article
                            key={card.title}
                            className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                        >
                            <p className="text-sm text-slate-400">
                                {card.title}
                            </p>

                            <p className="mt-3 text-3xl font-bold">
                                {isLoading ? "..." : card.value}
                            </p>

                            <p className="mt-3 text-sm text-cyan-400">
                                {card.change}
                            </p>
                        </article>
                    ))}
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-2">
                    {isLoading ? (
                        <>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                                Loading monthly analytics...
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                                Loading category analytics...
                            </div>
                        </>
                    ) : (
                        <>
                            <MonthlyIncomeExpenseChart
                                data={monthlyAnalytics}
                            />

                            <CategoryExpensePieChart
                                data={categoryExpenses}
                            />
                        </>
                    )}
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Recent transactions
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Your latest income and expenses
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/add-transaction")
                                }
                                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                            >
                                Add transaction
                            </button>
                        </div>

                        <div className="mt-6">
                            {isLoading && (
                                <p className="text-slate-400">
                                    Loading dashboard...
                                </p>
                            )}

                            {!isLoading && error && (
                                <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
                                    {error}
                                </p>
                            )}

                            {!isLoading &&
                                transactions.length === 0 &&
                                !error && (
                                    <div className="rounded-xl bg-slate-950 p-6 text-center">
                                        <p className="font-medium">
                                            No transactions yet
                                        </p>

                                        <p className="mt-2 text-sm text-slate-500">
                                            Add your first income or
                                            expense to get started.
                                        </p>
                                    </div>
                                )}

                            {!isLoading &&
                                transactions.length > 0 && (
                                    <div className="space-y-4">
                                        {transactions.map(
                                            (transaction) => {
                                                const isIncome =
                                                    transaction.transaction_type ===
                                                    "income";

                                                const isDeleting =
                                                    deletingId ===
                                                    transaction.id;

                                                return (
                                                    <div
                                                        key={
                                                            transaction.id
                                                        }
                                                        className="rounded-xl bg-slate-950 p-4"
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="font-medium">
                                                                    {
                                                                        transaction.title
                                                                    }
                                                                </p>

                                                                <p className="mt-1 text-sm text-slate-500">
                                                                    {
                                                                        transaction.category
                                                                    }
                                                                </p>

                                                                <p className="mt-1 text-sm text-slate-600">
                                                                    {formatDate(
                                                                        transaction.transaction_date
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <p
                                                                className={`font-semibold ${isIncome
                                                                    ? "text-emerald-400"
                                                                    : "text-rose-400"
                                                                    }`}
                                                            >
                                                                {isIncome
                                                                    ? "+"
                                                                    : "-"}
                                                                {formatCurrency(
                                                                    transaction.amount
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div className="mt-4 flex justify-end gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/edit-transaction/${transaction.id}`
                                                                    )
                                                                }
                                                                className="rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/10"
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        transaction
                                                                    )
                                                                }
                                                                disabled={
                                                                    isDeleting
                                                                }
                                                                className="rounded-lg border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {isDeleting
                                                                    ? "Deleting..."
                                                                    : "Delete"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                )}
                        </div>
                    </section>

                    <aside className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-6">
                        <p className="text-sm font-semibold text-cyan-400">
                            Financial insight
                        </p>

                        <h2 className="mt-3 text-xl font-semibold">
                            {totalBalance >= 0
                                ? "You are currently saving money"
                                : "Your expenses are higher than your income"}
                        </h2>

                        <p className="mt-3 leading-7 text-slate-300">
                            {summary.transaction_count === 0
                                ? "Add transactions to receive personalized financial insights."
                                : totalBalance >= 0
                                    ? `Your current balance is ${formatCurrency(
                                        totalBalance
                                    )}. Your estimated savings rate is ${totalIncome > 0
                                        ? (
                                            (totalSavings /
                                                totalIncome) *
                                            100
                                        ).toFixed(1)
                                        : "0.0"
                                    }%.`
                                    : `You are spending ${formatCurrency(
                                        Math.abs(totalBalance)
                                    )} more than your recorded income.`}
                        </p>
                    </aside>
                </div>
            </section>
        </main>
    );
}

export default Dashboard;