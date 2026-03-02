// app/api/fault-episodes/[episodeId]/report.json/route.ts

import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { episodeId: string } }
) {
  const { episodeId } = params;
  const filePath = path.join(
    process.cwd(),
    "artifacts",
    "fault-episodes",
    episodeId,
    "report.json"
  );

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const content = fs.readFileSync(filePath, "utf8");
  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="report.json"`,
    },
  });
}



































