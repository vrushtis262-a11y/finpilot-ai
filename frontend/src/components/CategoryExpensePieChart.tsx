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

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div>
                <h2 className="text-xl font-semibold text-white">
                    Expenses by Category
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                    See where most of your money is being spent.
                </p>
            </div>

            {data.length === 0 ? (
                <div className="mt-6 flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-700">
                    <p className="text-sm text-slate-400">
                        Add expense transactions to view category analytics.
                    </p>
                </div>
            ) : (
                <div className="mt-6 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="total"
                                nameKey="category"
                                cx="50%"
                                cy="45%"
                                innerRadius={65}
                                outerRadius={105}
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

                    <p className="-mt-44 text-center text-sm text-slate-400">
                        Total expenses
                    </p>

                    <p className="mt-1 text-center text-xl font-bold text-white">
                        {formatCurrency(totalExpenses)}
                    </p>
                </div>
            )}
        </div>
    );
}

export default CategoryExpensePieChart;