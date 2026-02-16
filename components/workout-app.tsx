"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Plus, Trophy, Zap } from "lucide-react";

import { ConfettiBurst } from "@/components/confetti-burst";
import { EvolutionChart } from "@/components/evolution-chart";
import { readCache, writeCache } from "@/lib/client-cache";
import { volume, type DashboardData, type ExerciseProgress, type WorkoutResult } from "@/lib/types";

const EXERCISES_CACHE_KEY = "tv.exercises";
const DASHBOARD_CACHE_KEY = "tv.dashboard";

export function WorkoutApp() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exercises, setExercises] = useState<ExerciseProgress[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [load, setLoad] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isPRPulse, setIsPRPulse] = useState(false);
  const [error, setError] = useState("");

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.name === selectedExerciseName) ?? null,
    [exercises, selectedExerciseName]
  );

  const progressPercent = useMemo(() => {
    if (!selectedExercise) return 0;
    if (!load) return 0;

    const currentLoad = Number(load);
    if (!Number.isFinite(currentLoad) || currentLoad <= 0) return 0;

    const pr = selectedExercise.prLoad ?? currentLoad;
    return Math.min(100, Math.round((currentLoad / pr) * 100));
  }, [selectedExercise, load]);

  async function hydrateData() {
    setLoading(true);
    setError("");

    const cachedExercises = readCache<ExerciseProgress[]>(EXERCISES_CACHE_KEY);
    const cachedDashboard = readCache<DashboardData>(DASHBOARD_CACHE_KEY);
    if (cachedExercises) setExercises(cachedExercises);
    if (cachedDashboard) setDashboard(cachedDashboard);

    try {
      await fetch("/api/bootstrap", { method: "GET" });
      const [exerciseRes, dashboardRes] = await Promise.all([fetch("/api/exercises"), fetch("/api/dashboard")]);

      if (!exerciseRes.ok || !dashboardRes.ok) {
        throw new Error("Não foi possível sincronizar com Trello.");
      }

      const exercisesPayload = (await exerciseRes.json()) as { exercises: ExerciseProgress[] };
      const dashboardPayload = (await dashboardRes.json()) as DashboardData;

      setExercises(exercisesPayload.exercises);
      setDashboard(dashboardPayload);

      writeCache(EXERCISES_CACHE_KEY, exercisesPayload.exercises);
      writeCache(DASHBOARD_CACHE_KEY, dashboardPayload);

      if (!selectedExerciseName && exercisesPayload.exercises[0]) {
        setSelectedExerciseName(exercisesPayload.exercises[0].name);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void hydrateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createExercise() {
    setError("");
    const value = newExerciseName.trim();
    if (!value) return;

    try {
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName: value }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível criar exercício.");
      }

      setNewExerciseName("");
      await hydrateData();
      setSelectedExerciseName(value);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao criar exercício.");
    }
  }

  async function registerWorkout() {
    if (!selectedExerciseName) {
      setError("Selecione um exercício antes de salvar.");
      return;
    }

    const parsedLoad = Number(load);
    const parsedReps = Number(reps);
    const parsedSets = Math.max(1, Math.floor(Number(sets)) || 1);
    if (!Number.isFinite(parsedLoad) || !Number.isFinite(parsedReps) || parsedLoad <= 0 || parsedReps <= 0) {
      setError("Informe carga e reps válidas.");
      return;
    }

    setSubmitting(true);
    setError("");
    setFeedback("");

    try {
      const response = await fetch("/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseName: selectedExerciseName,
          load: parsedLoad,
          reps: parsedReps,
          sets: parsedSets,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao registrar treino.");
      }

      const payload = (await response.json()) as WorkoutResult;

      if (payload.isPR) {
        setFeedback("Novo PR desbloqueado");
        setIsPRPulse(true);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(100);
        }
        window.setTimeout(() => setIsPRPulse(false), 900);
      } else if (payload.deltaLoad > 0) {
        setFeedback(`+${payload.deltaLoad}kg 🔥`);
      } else {
        setFeedback("Treino registrado");
      }

      setLoad("");
      setReps("");
      setSets("");
      await hydrateData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao registrar treino.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 bg-slate-950 px-4 pb-10 pt-6 text-slate-100">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Treino Verificado</p>
        <h1 className="text-2xl font-semibold">Progressão de Carga</h1>
        <p className="text-sm text-slate-400">Registro rápido durante o treino, com persistência no Trello.</p>
      </header>

      <section className="relative rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
        <ConfettiBurst visible={isPRPulse} />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">Selecionar exercício</h2>
          <span className="text-xs text-slate-400">2 cliques para registrar</span>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {exercises.map((exercise) => (
            <button
              key={exercise.cardId}
              type="button"
              onClick={() => setSelectedExerciseName(exercise.name)}
              className={`rounded-full border px-3 py-2 text-sm ${
                selectedExerciseName === exercise.name
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                  : "border-slate-700 bg-slate-900 text-slate-300"
              }`}
            >
              {exercise.name}
            </button>
          ))}
        </div>

        <div className="mb-3 flex gap-2">
          <input
            value={newExerciseName}
            onChange={(event) => setNewExerciseName(event.target.value)}
            placeholder="Novo exercício"
            className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={createExercise}
            className="inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm"
          >
            <Plus size={16} />
            Criar
          </button>
        </div>

        {selectedExercise && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
            <p className="font-medium text-slate-100">Último treino</p>
            <p>
              {selectedExercise.lastLoad ?? "-"}kg × {selectedExercise.lastReps ?? "-"} reps
              {selectedExercise.lastSets != null && selectedExercise.lastSets > 0 ? ` × ${selectedExercise.lastSets} séries` : ""}
              {" · "}
              {selectedExercise.lastDate ?? "-"}
            </p>
            {selectedExercise.lastLoad != null && selectedExercise.lastReps != null && (selectedExercise.lastSets ?? 1) > 0 && (
              <p className="mt-0.5 text-xs text-cyan-300/90">
                Volume: {volume({ load: selectedExercise.lastLoad, reps: selectedExercise.lastReps, sets: selectedExercise.lastSets ?? 1, date: selectedExercise.lastDate ?? "" }).toLocaleString("pt-BR")} kg
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              PR: {selectedExercise.prLoad ?? "-"}kg × {selectedExercise.prReps ?? "-"}
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
        <h2 className="text-sm font-medium text-slate-300">Registrar treino</h2>
        <p className="text-xs text-slate-400">Carga · Reps (média ou 1ª série) · Séries</p>
        <div className="grid grid-cols-3 gap-2">
          <input
            inputMode="decimal"
            value={load}
            onChange={(event) => setLoad(event.target.value)}
            placeholder="Carga (kg)"
            className="h-14 rounded-xl border border-slate-700 bg-slate-950 px-3 text-lg outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />
          <input
            inputMode="numeric"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
            placeholder="Reps"
            className="h-14 rounded-xl border border-slate-700 bg-slate-950 px-3 text-lg outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />
          <input
            inputMode="numeric"
            value={sets}
            onChange={(event) => setSets(event.target.value)}
            placeholder="Séries"
            className="h-14 rounded-xl border border-slate-700 bg-slate-950 px-3 text-lg outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Zap size={14} />
              Progresso vs PR
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800">
            <motion.div
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={registerWorkout}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
        >
          {submitting ? "Salvando..." : "Salvar treino"}
        </button>

        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
          >
            {isPRPulse ? <Trophy size={16} /> : <Flame size={16} />}
            {feedback}
            {isPRPulse && <span className="font-semibold">Badge PR</span>}
          </motion.div>
        )}

        {error && <p className="text-sm text-rose-400">{error}</p>}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
        <h2 className="text-sm font-medium text-slate-300">Dashboard</h2>
        {loading ? (
          <p className="text-sm text-slate-400">Sincronizando com Trello...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <InfoCard label="Treinos/semana" value={String(dashboard?.workoutsThisWeek ?? 0)} />
              <InfoCard label="Streak semanal" value={`${dashboard?.weeklyStreak ?? 0} sem`} />
              <InfoCard
                label="Último PR"
                value={dashboard?.lastPR ? `${dashboard.lastPR.load}kg x ${dashboard.lastPR.reps}` : "-"}
              />
              <InfoCard
                label="Mais evoluído"
                value={
                  dashboard?.mostImprovedExercise
                    ? `${dashboard.mostImprovedExercise.exerciseName} (+${dashboard.mostImprovedExercise.delta}kg)`
                    : "-"
                }
              />
            </div>

            <EvolutionChart data={dashboard?.chart ?? []} />
          </>
        )}
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
