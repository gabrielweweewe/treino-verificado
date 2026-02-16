"use client";

import { useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface EvolutionChartProps {
  data: Array<{
    date: string;
    exerciseName: string;
    load: number;
    volume: number;
  }>;
}

/** Gera labels únicas para o eixo X quando há vários pontos no mesmo dia */
function buildChartData(
  data: EvolutionChartProps["data"]
): Array<{ date: string; exerciseName: string; load: number; volume: number; xLabel: string }> {
  const dateCount = new Map<string, number>();
  return data.map((entry) => {
    const count = dateCount.get(entry.date) ?? 0;
    dateCount.set(entry.date, count + 1);
    const xLabel = count === 0 ? entry.date : `${entry.date} (${count + 1})`;
    return { ...entry, xLabel };
  });
}

export function EvolutionChart({ data }: EvolutionChartProps) {
  const [metric, setMetric] = useState<"load" | "volume">("volume");
  const chartData = buildChartData(data);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-400">
        Registre treinos para visualizar evolução de carga e volume.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMetric("volume")}
          className={`rounded-lg border px-2 py-1 text-xs ${metric === "volume" ? "border-cyan-400 bg-cyan-500/20 text-cyan-200" : "border-slate-700 text-slate-400"}`}
        >
          Volume
        </button>
        <button
          type="button"
          onClick={() => setMetric("load")}
          className={`rounded-lg border px-2 py-1 text-xs ${metric === "load" ? "border-cyan-400 bg-cyan-500/20 text-cyan-200" : "border-slate-700 text-slate-400"}`}
        >
          Carga
        </button>
      </div>
      <div className="h-56 rounded-2xl border border-slate-700 bg-slate-900/70 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
            <XAxis dataKey="xLabel" stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: 12 }}
              formatter={(value, _name, entry) => [
                metric === "volume" ? `${Number(value).toLocaleString("pt-BR")} kg` : `${value} kg`,
                entry.payload.exerciseName,
              ]}
              labelFormatter={(label, payload) => {
                const date = (payload?.[0]?.payload as { date?: string } | undefined)?.date;
                return `Data: ${date ?? label}`;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              dataKey={metric}
              name={metric === "volume" ? "Volume (kg)" : "Carga (kg)"}
              stroke={metric === "volume" ? "#a78bfa" : "#22d3ee"}
              strokeWidth={2.4}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
