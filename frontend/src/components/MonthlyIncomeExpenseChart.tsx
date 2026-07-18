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
    }).format(new Date(Number(year), Number(monthNumber) - 1));
}

function MonthlyIncomeExpenseChart({ data }: Props) {
    const formattedData = data.map((item) => ({
        ...item,
        formattedMonth: formatMonth(item.month),
    }));

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/10">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold text-white">
                    Monthly Income vs Expenses
                </h2>

                <p className="text-sm text-slate-400">
                    Compare your income and spending by month.
                </p>
            </div>

            {formattedData.length === 0 ? (
                <div className="mt-6 flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-700">
                    <p className="text-sm text-slate-400">
                        No monthly analytics available yet.
                    </p>
                </div>
            ) : (
                <div className="mt-6 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={formattedData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 10,
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
                                width={80}
                                tick={{
                                    fill: "#94a3b8",
                                    fontSize: 12,
                                }}
                                tickFormatter={(value) =>
                                    formatCurrency(Number(value))
                                }
                            />

                            <Tooltip
                                cursor={{
                                    fill: "rgba(51, 65, 85, 0.25)",
                                }}
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    border: "1px solid #334155",
                                    borderRadius: "12px",
                                    color: "#f8fafc",
                                    boxShadow:
                                        "0 10px 30px rgba(0, 0, 0, 0.25)",
                                }}
                                labelStyle={{
                                    color: "#cbd5e1",
                                    marginBottom: "6px",
                                }}
                                formatter={(value, name) => [
                                    formatCurrency(Number(value)),
                                    name,
                                ]}
                            />

                            <Legend
                                iconType="circle"
                                wrapperStyle={{
                                    paddingTop: "16px",
                                    color: "#cbd5e1",
                                }}
                            />

                            <Bar
                                dataKey="total_income"
                                name="Income"
                                fill="#22c55e"
                                radius={[6, 6, 0, 0]}
                            />

                            <Bar
                                dataKey="total_expense"
                                name="Expenses"
                                fill="#f43f5e"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

export default MonthlyIncomeExpenseChart;