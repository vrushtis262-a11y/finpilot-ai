import { useState } from "react";
import { Navigate, useNavigate } from "react-router";

function AddTransaction() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const today = new Date().toISOString().split("T")[0];

    const [type, setType] = useState("expense");
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [transactionDate, setTransactionDate] = useState(today);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanTitle = title.trim();
        const cleanCategory = category.trim();
        const numericAmount = Number(amount);

        if (!cleanTitle) {
            alert("Please enter a title.");
            return;
        }

        if (!cleanCategory) {
            alert("Please enter a category.");
            return;
        }

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            alert("Amount must be greater than 0.");
            return;
        }

        if (!transactionDate) {
            alert("Please choose a transaction date.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: cleanTitle,
                    amount: numericAmount,
                    category: cleanCategory,
                    transaction_type: type,
                    transaction_date: transactionDate,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const message =
                    typeof data.detail === "string"
                        ? data.detail
                        : "Could not save transaction.";

                alert(message);

                if (response.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/login");
                }

                return;
            }

            alert("Transaction saved successfully!");
            navigate("/dashboard");
        } catch (error) {
            console.error(error);
            alert("Cannot connect to backend.");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    <h1 className="text-3xl font-bold">Add transaction</h1>

                    <p className="mt-2 text-slate-400">
                        Record income or an expense.
                    </p>

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
                                value={type}
                                onChange={(e) => setType(e.target.value)}
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
                                placeholder="Example: Salary or Groceries"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-cyan-400"
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
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="category"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Category
                            </label>

                            <input
                                id="category"
                                type="text"
                                maxLength={50}
                                placeholder="Example: Food, Housing, Salary"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-cyan-400"
                            />
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
                                onChange={(e) => setTransactionDate(e.target.value)}
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Saving..." : "Save transaction"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default AddTransaction;