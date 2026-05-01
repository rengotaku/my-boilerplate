import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "hello from route handler",
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
    timestamp: new Date().toISOString(),
  });
}
