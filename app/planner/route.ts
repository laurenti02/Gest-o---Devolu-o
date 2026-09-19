import fs from "fs";
import path from "path";

export async function GET() {
  const html = fs.readFileSync(path.join(process.cwd(), "public", "planner-app.html"), "utf-8");
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
