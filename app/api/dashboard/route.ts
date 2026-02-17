import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth-server";
import { getDashboardData } from "@/services/trello";

export async function GET() {
  const { response: authResponse } = await requireAuth();
  if (authResponse) return authResponse;

  try {
    const data = await getDashboardData();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao carregar dados do dashboard.",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
