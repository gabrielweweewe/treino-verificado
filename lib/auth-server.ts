import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

/** Retorna a sessão atual ou null. Use nas rotas API para exigir login. */
export async function getSession() {
  return getServerSession(authOptions);
}

/** Retorna 401 NextResponse se não houver sessão. Use no início das rotas API protegidas. */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return { session: null as never, response: NextResponse.json({ message: "Não autorizado." }, { status: 401 }) };
  }
  return { session, response: null };
}
