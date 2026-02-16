"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface EvolutionChartProps {
  data: Array<{
    date: string;
    exerciseName: string;
    load: number;
  }>;
}

export function EvolutionChart({ data }: EvolutionChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-400">
        Registre treinos para visualizar sua evolução de carga.
      </div>
    );
  }

  return (
    <div className="h-56 rounded-2xl border border-slate-700 bg-slate-900/70 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: 12 }}
            formatter={(value, _name, entry) => [`${value} kg`, entry.payload.exerciseName]}
          />
          <Line dataKey="load" stroke="#22d3ee" strokeWidth={2.4} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
