import {
    type FormEvent,
    useState,
} from "react";
import {
    Navigate,
    useNavigate,
} from "react-router";

import { API_BASE_URL } from "../constants/api";
import { TRANSACTION_CATEGORIES } from "../constants/categories";

type TransactionType = "income" | "expense";

function AddTransaction() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const today = new Date().toISOString().split("T")[0];

    const [type, setType] =
        useState<TransactionType>("expense");
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [transactionDate, setTransactionDate] =
        useState(today);
    const [isSubmitting, setIsSubmitting] =
        useState(false);
    const [error, setError] = useState("");

    const availableCategories =
        TRANSACTION_CATEGORIES[type];

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleTypeChange = (
        newType: TransactionType
    ) => {
        setType(newType);
        setCategory("");
        setError("");
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const cleanTitle = title.trim();
        const numericAmount = Number(amount);

        if (!cleanTitle) {
            setError("Please enter a title.");
            return;
        }

        if (!category) {
            setError("Please choose a category.");
            return;
        }

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            setError("Amount must be greater than 0.");
            return;
        }

        if (!transactionDate) {
            setError(
                "Please choose a transaction date."
            );
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/transactions`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: cleanTitle,
                        amount: numericAmount,
                        category,
                        transaction_type: type,
                        transaction_date:
                            transactionDate,
                    }),
                }
            );

            const data: unknown =
                await response.json();

            if (!response.ok) {
                let message =
                    "Could not save transaction.";

                if (
                    typeof data === "object" &&
                    data !== null &&
                    "detail" in data &&
                    typeof data.detail === "string"
                ) {
                    message = data.detail;
                }

                if (response.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/login", {
                        replace: true,
                    });
                    return;
                }

                throw new Error(message);
            }

            navigate("/dashboard", {
                replace: true,
            });
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Cannot connect to backend."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
            <div className="mx-auto max-w-xl">
                <button
                    type="button"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                    className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                >
                    ← Back to dashboard
                </button>

                <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                    <h1 className="text-3xl font-bold">
                        Add transaction
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Record income or an expense.
                    </p>

                    {error && (
                        <div
                            role="alert"
                            className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                        >
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="mt-8 space-y-5"
                    >
                        <div>
                            <label
                                htmlFor="type"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Transaction type
                            </label>

                            <select
                                id="type"
                                value={type}
                                onChange={(event) =>
                                    handleTypeChange(
                                        event.target
                                            .value as TransactionType
                                    )
                                }
                                disabled={isSubmitting}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400 disabled:opacity-60"
                            >
                                <option value="income">
                                    Income
                                </option>

                                <option value="expense">
                                    Expense
                                </option>
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
                                placeholder="Example: Salary or Groceries"
                                value={title}
                                onChange={(event) => {
                                    setTitle(
                                        event.target.value
                                    );
                                    setError("");
                                }}
                                disabled={isSubmitting}
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-cyan-400 disabled:opacity-60"
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
                                placeholder="0.00"
                                value={amount}
                                onChange={(event) => {
                                    setAmount(
                                        event.target.value
                                    );
                                    setError("");
                                }}
                                disabled={isSubmitting}
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-cyan-400 disabled:opacity-60"
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
                                onChange={(event) => {
                                    setCategory(
                                        event.target.value
                                    );
                                    setError("");
                                }}
                                disabled={isSubmitting}
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400 disabled:opacity-60"
                            >
                                <option value="">
                                    Choose a category
                                </option>

                                {availableCategories.map(
                                    (item) => (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {item}
                                        </option>
                                    )
                                )}
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
                                onChange={(event) => {
                                    setTransactionDate(
                                        event.target.value
                                    );
                                    setError("");
                                }}
                                disabled={isSubmitting}
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400 disabled:opacity-60"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "Saving..."
                                : "Save transaction"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default AddTransaction;