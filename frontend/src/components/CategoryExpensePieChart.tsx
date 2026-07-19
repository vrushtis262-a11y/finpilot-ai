import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

type CategoryExpense = {
    category: string;
    total: number;
};

type Props = {
    data: CategoryExpense[];
};

const chartColors = [
    "#22d3ee",
    "#8b5cf6",
    "#f97316",
    "#eab308",
    "#ec4899",
    "#14b8a6",
    "#6366f1",
    "#f43f5e",
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value);
}

function CategoryExpensePieChart({ data }: Props) {
    const totalExpenses = data.reduce(
        (total, item) => total + item.total,
        0
    );

    const largestCategory =
        data.length === 0
            ? null
            : data.reduce((largest, item) =>
                item.total > largest.total ? item : largest
            );

    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/10 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-cyan-400">
                        Spending breakdown
                    </p>

                    <h2 className="mt-1 text-xl font-semibold text-white">
                        Expenses by category
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                        See which categories account for most of your spending.
                    </p>
                </div>

                {largestCategory && (
                    <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 sm:min-w-44">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Largest category
                        </p>

                        <p className="mt-1 truncate font-semibold text-white">
                            {largestCategory.category}
                        </p>

                        <p className="mt-1 text-sm text-cyan-300">
                            {formatCurrency(largestCategory.total)}
                        </p>
                    </div>
                )}
            </div>

            {data.length === 0 ? (
                <div className="mt-6 flex min-h-80 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 text-center">
                    <div>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xl text-cyan-400">
                            %
                        </div>

                        <p className="mt-4 font-semibold text-white">
                            No category data yet
                        </p>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                            Add expense transactions to see how your spending is
                            distributed across categories.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="relative mt-6 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="total"
                                nameKey="category"
                                cx="50%"
                                cy="43%"
                                innerRadius={66}
                                outerRadius={104}
                                paddingAngle={3}
                                stroke="none"
                            >
                                {data.map((item, index) => (
                                    <Cell
                                        key={`${item.category}-${index}`}
                                        fill={
                                            chartColors[
                                            index %
                                            chartColors.length
                                            ]
                                        }
                                    />
                                ))}
                            </Pie>

                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    border: "1px solid #334155",
                                    borderRadius: "12px",
                                    color: "#f8fafc",
                                    boxShadow:
                                        "0 10px 30px rgba(0, 0, 0, 0.25)",
                                }}
                                itemStyle={{
                                    color: "#f8fafc",
                                }}
                                labelStyle={{
                                    color: "#cbd5e1",
                                }}
                                formatter={(value) => [
                                    formatCurrency(Number(value)),
                                    "Expenses",
                                ]}
                            />

                            <Legend
                                iconType="circle"
                                verticalAlign="bottom"
                                wrapperStyle={{
                                    color: "#cbd5e1",
                                    fontSize: "14px",
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute inset-x-0 top-[39%] -translate-y-1/2 text-center">
                        <p className="text-sm text-slate-400">
                            Total expenses
                        </p>

                        <p className="mt-1 text-xl font-bold text-white">
                            {formatCurrency(totalExpenses)}
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}

export default CategoryExpensePieChart;