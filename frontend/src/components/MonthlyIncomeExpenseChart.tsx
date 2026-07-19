import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

type MonthlyAnalytics = {
    month: string;
    total_income: number;
    total_expense: number;
    balance: number;
};

type Props = {
    data: MonthlyAnalytics[];
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatMonth(month: string) {
    const [year, monthNumber] = month.split("-");

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "2-digit",
    }).format(
        new Date(
            Number(year),
            Number(monthNumber) - 1
        )
    );
}

function MonthlyIncomeExpenseChart({
    data,
}: Props) {
    const formattedData = data.map((item) => ({
        ...item,
        formattedMonth: formatMonth(item.month),
    }));

    const totalIncome = data.reduce(
        (total, item) => total + item.total_income,
        0
    );

    const totalExpense = data.reduce(
        (total, item) => total + item.total_expense,
        0
    );

    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/10 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-cyan-400">
                        Monthly trends
                    </p>

                    <h2 className="mt-1 text-xl font-semibold text-white">
                        Income vs expenses
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                        Compare your recorded income and
                        spending across each month.
                    </p>
                </div>

                {formattedData.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:min-w-56">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">
                                Income
                            </p>

                            <p className="mt-1 text-sm font-semibold text-white">
                                {formatCurrency(
                                    totalIncome
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-rose-300">
                                Expenses
                            </p>

                            <p className="mt-1 text-sm font-semibold text-white">
                                {formatCurrency(
                                    totalExpense
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {formattedData.length === 0 ? (
                <div className="mt-6 flex min-h-80 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 text-center">
                    <div>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-lg font-bold text-cyan-400">
                            $
                        </div>

                        <p className="mt-4 font-semibold text-white">
                            No monthly analytics yet
                        </p>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                            Add income and expense
                            transactions to see how your
                            finances change over time.
                        </p>
                    </div>
                </div>
            ) : (
                <div
                    className="mt-6 h-80"
                    aria-label="Monthly income and expense chart"
                >
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <BarChart
                            data={formattedData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 5,
                            }}
                            barGap={6}
                        >
                            <CartesianGrid
                                stroke="#334155"
                                strokeDasharray="4 4"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="formattedMonth"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: "#94a3b8",
                                    fontSize: 12,
                                }}
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                width={72}
                                tick={{
                                    fill: "#94a3b8",
                                    fontSize: 12,
                                }}
                                tickFormatter={(
                                    value
                                ) =>
                                    formatCurrency(
                                        Number(value)
                                    )
                                }
                            />

                            <Tooltip
                                cursor={{
                                    fill: "rgba(51, 65, 85, 0.25)",
                                }}
                                contentStyle={{
                                    backgroundColor:
                                        "#0f172a",
                                    border:
                                        "1px solid #334155",
                                    borderRadius:
                                        "12px",
                                    color: "#f8fafc",
                                    boxShadow:
                                        "0 10px 30px rgba(0, 0, 0, 0.25)",
                                }}
                                labelStyle={{
                                    color: "#cbd5e1",
                                    marginBottom:
                                        "6px",
                                }}
                                itemStyle={{
                                    color: "#f8fafc",
                                }}
                                formatter={(
                                    value,
                                    name
                                ) => [
                                        formatCurrency(
                                            Number(value)
                                        ),
                                        name,
                                    ]}
                            />

                            <Legend
                                iconType="circle"
                                wrapperStyle={{
                                    paddingTop:
                                        "16px",
                                    color: "#cbd5e1",
                                }}
                            />

                            <Bar
                                dataKey="total_income"
                                name="Income"
                                fill="#22c55e"
                                radius={[
                                    6, 6, 0, 0,
                                ]}
                            />

                            <Bar
                                dataKey="total_expense"
                                name="Expenses"
                                fill="#f43f5e"
                                radius={[
                                    6, 6, 0, 0,
                                ]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}

export default MonthlyIncomeExpenseChart;