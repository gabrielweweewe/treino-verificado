import { NextResponse } from "next/server";

import { bootstrapBoard } from "@/services/trello";

export async function GET() {
  try {
    const data = await bootstrapBoard();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao inicializar board/listas no Trello.",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
