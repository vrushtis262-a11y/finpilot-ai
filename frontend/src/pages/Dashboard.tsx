import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";

type Transaction = {
    id: number;
    title: string;
    amount: number;
    category: string;
    transaction_type: "income" | "expense";
    user_id: number;
};

function Dashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) {
            return;
        }

        const fetchTransactions = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/transactions", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem("token");
                        navigate("/login");
                        return;
                    }

                    throw new Error(
                        typeof data.detail === "string"
                            ? data.detail
                            : "Could not load transactions."
                    );
                }

                setTransactions(data);
            } catch (err) {
                console.error(err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Could not load transactions."
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, [navigate, token]);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const totalIncome = transactions
        .filter((transaction) => transaction.transaction_type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const totalExpenses = transactions
        .filter((transaction) => transaction.transaction_type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const totalBalance = totalIncome - totalExpenses;
    const totalSavings = totalBalance;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);

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
            change: `${transactions.filter(
                (transaction) => transaction.transaction_type === "income"
            ).length} income transaction(s)`,
        },
        {
            title: "Total expenses",
            value: formatCurrency(totalExpenses),
            change: `${transactions.filter(
                (transaction) => transaction.transaction_type === "expense"
            ).length} expense transaction(s)`,
        },
        {
            title: "Total savings",
            value: formatCurrency(totalSavings),
            change:
                totalIncome > 0
                    ? `${((totalSavings / totalIncome) * 100).toFixed(1)}% savings rate`
                    : "Add income to calculate rate",
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
                        FinPilot <span className="text-cyan-400">AI</span>
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
                <p className="font-semibold text-cyan-400">Financial overview</p>

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
                            <p className="text-sm text-slate-400">{card.title}</p>
                            <p className="mt-3 text-3xl font-bold">{card.value}</p>
                            <p className="mt-3 text-sm text-cyan-400">{card.change}</p>
                        </article>
                    ))}
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
                                onClick={() => navigate("/add-transaction")}
                                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                            >
                                Add transaction
                            </button>
                        </div>

                        <div className="mt-6">
                            {isLoading && (
                                <p className="text-slate-400">Loading transactions...</p>
                            )}

                            {!isLoading && error && (
                                <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
                                    {error}
                                </p>
                            )}

                            {!isLoading && !error && transactions.length === 0 && (
                                <div className="rounded-xl bg-slate-950 p-6 text-center">
                                    <p className="font-medium">No transactions yet</p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Add your first income or expense to get started.
                                    </p>
                                </div>
                            )}

                            {!isLoading && !error && transactions.length > 0 && (
                                <div className="space-y-4">
                                    {transactions.map((transaction) => {
                                        const isIncome =
                                            transaction.transaction_type === "income";

                                        return (
                                            <div
                                                key={transaction.id}
                                                className="flex items-center justify-between rounded-xl bg-slate-950 p-4"
                                            >
                                                <div>
                                                    <p className="font-medium">{transaction.title}</p>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {transaction.category}
                                                    </p>
                                                </div>

                                                <p
                                                    className={`font-semibold ${isIncome
                                                        ? "text-emerald-400"
                                                        : "text-rose-400"
                                                        }`}
                                                >
                                                    {isIncome ? "+" : "-"}
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                            </div>
                                        );
                                    })}
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
                            {transactions.length === 0
                                ? "Add transactions to receive personalized financial insights."
                                : totalBalance >= 0
                                    ? `Your current balance is ${formatCurrency(
                                        totalBalance
                                    )}. Keep tracking your spending to improve your savings.`
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