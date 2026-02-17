import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth-server";
import { todayIso } from "@/lib/date";
import type { WorkoutPayload, WorkoutResult } from "@/lib/types";
import { bootstrapBoard, checkAndUpdatePR, createWorkoutEntry, getOrCreateExercise } from "@/services/trello";

function sanitizeSeries(series: WorkoutPayload["series"]): Array<{ load: number; reps: number }> {
  if (!series || series.length === 0) return [];
  return series
    .map((set) => ({
      load: Number(set.load),
      reps: Number(set.reps),
    }))
    .filter((set) => Number.isFinite(set.load) && Number.isFinite(set.reps) && set.load > 0 && set.reps > 0);
}

export async function POST(request: Request) {
  const { response: authResponse } = await requireAuth();
  if (authResponse) return authResponse;

  try {
    const body = (await request.json()) as WorkoutPayload;
    const exerciseName = body.exerciseName?.trim();
    const series = sanitizeSeries(body.series);

    const parsedLoad = Number(body.load);
    const parsedReps = Number(body.reps);
    const parsedSets = Math.max(1, Math.floor(Number(body.sets)) || 1);

    const bestSeriesSet =
      series.length > 0
        ? series.reduce((best, current) => {
            if (current.load > best.load) return current;
            if (current.load === best.load && current.reps > best.reps) return current;
            return best;
          })
        : null;

    const load = bestSeriesSet?.load ?? parsedLoad;
    const reps = bestSeriesSet?.reps ?? parsedReps;
    const sets = series.length > 0 ? series.length : parsedSets;

    if (!exerciseName || !Number.isFinite(load) || !Number.isFinite(reps)) {
      return NextResponse.json({ message: "Payload inválido para registro de treino." }, { status: 400 });
    }

    if (load <= 0 || reps <= 0 || sets <= 0) {
      return NextResponse.json({ message: "Carga, reps e séries devem ser maiores que zero." }, { status: 400 });
    }

    const { lists } = await bootstrapBoard();
    const date = todayIso();
    const exerciseCard = await getOrCreateExercise(lists.exercises, exerciseName);

    const workoutCard = await createWorkoutEntry(lists.workouts, {
      exerciseName,
      load,
      reps,
      sets,
      date,
      series: series.length > 0 ? series : undefined,
    });

    const prResult = await checkAndUpdatePR(exerciseCard, lists.prs, workoutCard.id, {
      load,
      reps,
      sets,
      date,
      series: series.length > 0 ? series : undefined,
    });

    const response: WorkoutResult = {
      exercise: prResult.updated,
      isPR: prResult.isPR,
      deltaLoad: prResult.deltaLoad,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao registrar treino.",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
