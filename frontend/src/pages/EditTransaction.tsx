import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";

import { TRANSACTION_CATEGORIES } from "../constants/categories";

type TransactionType = "income" | "expense";

type Transaction = {
    id: number;
    title: string;
    amount: number;
    category: string;
    transaction_type: TransactionType;
    transaction_date: string;
};

function EditTransaction() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [transactionType, setTransactionType] =
        useState<TransactionType>("expense");
    const [transactionDate, setTransactionDate] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availableCategories = TRANSACTION_CATEGORIES[transactionType];

    useEffect(() => {
        const fetchTransaction = async () => {
            if (!token) {
                return;
            }

            try {
                const response = await fetch(
                    "http://127.0.0.1:8000/transactions",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data: Transaction[] = await response.json();

                if (!response.ok) {
                    throw new Error("Failed to load transaction.");
                }

                const transaction = data.find(
                    (item) => item.id === Number(id)
                );

                if (!transaction) {
                    throw new Error("Transaction not found.");
                }

                setTitle(transaction.title);
                setAmount(transaction.amount.toString());
                setCategory(transaction.category);
                setTransactionType(transaction.transaction_type);
                setTransactionDate(transaction.transaction_date);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load transaction."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTransaction();
    }, [id, token]);

    const handleTypeChange = (newType: TransactionType) => {
        setTransactionType(newType);
        setCategory("");
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const cleanTitle = title.trim();
        const numericAmount = Number(amount);

        setError("");

        if (!cleanTitle) {
            setError("Please enter a title.");
            return;
        }

        if (!category) {
            setError("Please choose a category.");
            return;
        }

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            setError("Amount must be greater than 0.");
            return;
        }

        if (!transactionDate) {
            setError("Please choose a transaction date.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/transactions/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: cleanTitle,
                        amount: numericAmount,
                        category,
                        transaction_type: transactionType,
                        transaction_date: transactionDate,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    typeof data.detail === "string"
                        ? data.detail
                        : "Update failed."
                );
            }

            navigate("/dashboard");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Update failed."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                Loading...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
            <div className="mx-auto max-w-xl">
                <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                >
                    ← Back to dashboard
                </button>

                <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                    <h1 className="text-3xl font-bold">
                        Edit transaction
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Update this transaction's details.
                    </p>

                    {error && (
                        <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-300">
                            {error}
                        </p>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label
                                htmlFor="type"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Transaction type
                            </label>

                            <select
                                id="type"
                                value={transactionType}
                                onChange={(e) =>
                                    handleTypeChange(
                                        e.target.value as TransactionType
                                    )
                                }
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                            >
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="title"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Title
                            </label>

                            <input
                                id="title"
                                type="text"
                                maxLength={100}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="amount"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Amount
                            </label>

                            <input
                                id="amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="category"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Category
                            </label>

                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                            >
                                <option value="">Choose a category</option>

                                {availableCategories.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="transaction-date"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Transaction date
                            </label>

                            <input
                                id="transaction-date"
                                type="date"
                                value={transactionDate}
                                onChange={(e) =>
                                    setTransactionDate(e.target.value)
                                }
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "Updating..."
                                : "Update transaction"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default EditTransaction;