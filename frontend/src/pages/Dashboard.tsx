import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { API_BASE_URL } from "../constants/api";
import BudgetForm from "../components/BudgetForm";
import BudgetCard, {
    type BudgetSummary,
} from "../components/BudgetCard";
import CategoryExpensePieChart from "../components/CategoryExpensePieChart";
import MonthlyIncomeExpenseChart from "../components/MonthlyIncomeExpenseChart";
import TransactionList, {
    type TransactionSortBy,
    type TransactionSortOrder,
} from "../components/TransactionList";

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

function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
}

function Dashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const currentMonth = getCurrentMonth();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] =
        useState<AnalyticsSummary>(emptySummary);
    const [monthlyAnalytics, setMonthlyAnalytics] = useState<
        MonthlyAnalytics[]
    >([]);
    const [categoryExpenses, setCategoryExpenses] = useState<
        CategoryExpense[]
    >([]);
    const [budget, setBudget] = useState<BudgetSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBudgetLoading, setIsBudgetLoading] = useState(true);
    const [error, setError] = useState("");
    const [budgetError, setBudgetError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
    const [transactionSortBy, setTransactionSortBy] =
        useState<TransactionSortBy>("transaction_date");
    const [transactionSortOrder, setTransactionSortOrder] =
        useState<TransactionSortOrder>("desc");

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
            setBudgetError("");
            setIsBudgetLoading(true);

            const [
                transactionsResponse,
                summaryResponse,
                monthlyResponse,
                categoryExpensesResponse,
                budgetResponse,
            ] = await Promise.all([
                fetch(
                    `${API_BASE_URL}/transactions?sort_by=${transactionSortBy}&order=${transactionSortOrder}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                ),
                fetch(`${API_BASE_URL}/analytics/summary`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch(`${API_BASE_URL}/analytics/monthly`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch(
                    `${API_BASE_URL}/analytics/category-expenses`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                ),
                fetch(
                    `${API_BASE_URL}/budgets/summary/${currentMonth}`,
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
                categoryExpensesResponse.status === 401 ||
                budgetResponse.status === 401
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

            if (budgetResponse.status === 404) {
                setBudget(null);
            } else {
                const budgetData = await budgetResponse.json();

                if (!budgetResponse.ok) {
                    setBudget(null);
                    setBudgetError(
                        typeof budgetData.detail === "string"
                            ? budgetData.detail
                            : "Could not load the monthly budget."
                    );
                } else {
                    setBudget(budgetData);
                }
            }
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load dashboard data."
            );
        } finally {
            setIsLoading(false);
            setIsBudgetLoading(false);
        }
    }, [
        currentMonth,
        handleUnauthorized,
        token,
        transactionSortBy,
        transactionSortOrder,
    ]);

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
                `${API_BASE_URL}/transactions/${transaction.id}`,
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

    const handleTransactionSortChange = (
        sortBy: TransactionSortBy,
        sortOrder: TransactionSortOrder
    ) => {
        setTransactionSortBy(sortBy);
        setTransactionSortOrder(sortOrder);
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

                <div className="mt-8">
                    <BudgetCard
                        budget={budget}
                        isLoading={isBudgetLoading}
                        error={budgetError}
                        onManageBudget={() =>
                            setIsBudgetFormOpen(true)
                        }
                    />
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
                    <TransactionList
                        transactions={transactions}
                        isLoading={isLoading}
                        error={error}
                        deletingId={deletingId}
                        sortBy={transactionSortBy}
                        sortOrder={transactionSortOrder}
                        onSortChange={
                            handleTransactionSortChange
                        }
                        onDelete={handleDelete}
                    />

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

            <BudgetForm
                isOpen={isBudgetFormOpen}
                month={currentMonth}
                existingAmount={
                    budget ? budget.budget_amount : null
                }
                token={token}
                onClose={() => setIsBudgetFormOpen(false)}
                onSaved={fetchDashboardData}
                onUnauthorized={handleUnauthorized}
            />
        </main>
    );
}

export default Dashboard;