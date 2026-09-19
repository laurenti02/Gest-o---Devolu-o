import { NextResponse } from "next/server";
import { encerrarSessaoPlanner } from "@/lib/plannerAuth";

export async function POST() {
  await encerrarSessaoPlanner();
  return NextResponse.json({ ok: true });
}
