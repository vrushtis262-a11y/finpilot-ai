import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { API_BASE_URL } from "../constants/api";

type BudgetFormProps = {
    isOpen: boolean;
    month: string;
    existingAmount: number | null;
    token: string;
    onClose: () => void;
    onSaved: () => Promise<void> | void;
    onUnauthorized: () => void;
};

function BudgetForm({
    isOpen,
    month,
    existingAmount,
    token,
    onClose,
    onSaved,
    onUnauthorized,
}: BudgetFormProps) {
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = existingAmount !== null;

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setAmount(
            existingAmount !== null
                ? existingAmount.toString()
                : ""
        );
        setError("");
    }, [existingAmount, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isSaving) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, isSaving, onClose]);

    if (!isOpen) {
        return null;
    }

    const formatMonth = (value: string) => {
        const [year, monthNumber] = value.split("-");

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

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const parsedAmount = Number(amount);

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            setError(
                "Enter a valid budget amount greater than zero."
            );
            return;
        }

        try {
            setIsSaving(true);
            setError("");

            const response = await fetch(
                isEditing
                    ? `${API_BASE_URL}/budgets/${month}`
                    : `${API_BASE_URL}/budgets`,
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(
                        isEditing
                            ? {
                                amount: parsedAmount,
                            }
                            : {
                                month,
                                amount: parsedAmount,
                            }
                    ),
                }
            );

            if (response.status === 401) {
                onUnauthorized();
                return;
            }

            if (!response.ok) {
                let message = isEditing
                    ? "Could not update the budget."
                    : "Could not create the budget.";

                try {
                    const data = await response.json();

                    if (typeof data.detail === "string") {
                        message = data.detail;
                    }
                } catch {
                    console.error(
                        "Could not read the budget error response."
                    );
                }

                throw new Error(message);
            }

            await onSaved();
            onClose();
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Could not save the budget."
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-form-title"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isSaving
                ) {
                    onClose();
                }
            }}
        >
            <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-cyan-400">
                            Monthly budget
                        </p>

                        <h2
                            id="budget-form-title"
                            className="mt-2 text-2xl font-bold text-white"
                        >
                            {isEditing
                                ? "Edit your budget"
                                : "Set your budget"}
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            {formatMonth(month)}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Close
                    </button>
                </div>

                <form
                    className="mt-6"
                    onSubmit={handleSubmit}
                >
                    <label
                        htmlFor="budget-amount"
                        className="text-sm font-medium text-slate-300"
                    >
                        Budget amount
                    </label>

                    <div className="relative mt-2">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                            $
                        </span>

                        <input
                            id="budget-amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(event) =>
                                setAmount(event.target.value)
                            }
                            placeholder="1500.00"
                            autoFocus
                            disabled={isSaving}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-9 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                    </div>

                    {error && (
                        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </p>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving
                                ? "Saving..."
                                : isEditing
                                    ? "Update budget"
                                    : "Create budget"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default BudgetForm;