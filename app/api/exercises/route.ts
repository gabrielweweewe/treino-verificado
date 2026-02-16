import { NextResponse } from "next/server";

import { bootstrapBoard, getOrCreateExercise, listExercises } from "@/services/trello";

export async function GET() {
  try {
    const { lists } = await bootstrapBoard();
    const exercises = await listExercises(lists.exercises);
    return NextResponse.json({ exercises }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao carregar exercícios.",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { exerciseName?: string };
    const exerciseName = body.exerciseName?.trim();
    if (!exerciseName) {
      return NextResponse.json({ message: "exerciseName é obrigatório." }, { status: 400 });
    }

    const { lists } = await bootstrapBoard();
    const card = await getOrCreateExercise(lists.exercises, exerciseName);
    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao criar exercício.",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
