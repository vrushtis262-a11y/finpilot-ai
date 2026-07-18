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

function MonthlyIncomeExpenseChart({ data }: Props) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
                Monthly Income vs Expenses
            </h2>

            <p className="mt-1 text-sm text-slate-400">
                Compare your income and spending by month.
            </p>

            <div className="mt-6 h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis dataKey="month" />

                        <YAxis />

                        <Tooltip />

                        <Legend />

                        <Bar
                            dataKey="total_income"
                            name="Income"
                        />

                        <Bar
                            dataKey="total_expense"
                            name="Expenses"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default MonthlyIncomeExpenseChart;
