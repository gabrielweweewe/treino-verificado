import { NextResponse } from "next/server";

import { todayIso } from "@/lib/date";
import type { WorkoutPayload, WorkoutResult } from "@/lib/types";
import { bootstrapBoard, checkAndUpdatePR, createWorkoutEntry, getOrCreateExercise } from "@/services/trello";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WorkoutPayload;
    const exerciseName = body.exerciseName?.trim();
    const load = Number(body.load);
    const reps = Number(body.reps);
    const sets = Math.max(1, Math.floor(Number(body.sets)) || 1);

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
    });

    const prResult = await checkAndUpdatePR(exerciseCard, lists.prs, workoutCard.id, { load, reps, sets, date });

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
