import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HOP_BY_HOP = [
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer"
];

function upstreamBase(): string {
  // Dynamic lookup so `next start` reads API_PROXY_TARGET at runtime.
  // A static `process.env.API_PROXY_TARGET` is inlined at build time.
  const configured = process.env["API_PROXY_TARGET"] || process.env["API_BASE_URL"];
  // Dev default matches scripts/dev-api.sh. prod-web.sh always sets API_PROXY_TARGET.
  return (configured || "http://127.0.0.1:8000").replace(/\/$/, "");
}

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  const dest = `${upstreamBase()}/${path.map((segment) => encodeURIComponent(segment)).join("/")}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("accept-encoding");
  for (const name of HOP_BY_HOP) headers.delete(name);

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    const upstream = await fetch(dest, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual"
    });
    const out = new Headers(upstream.headers);
    for (const name of HOP_BY_HOP) out.delete(name);
    out.delete("content-encoding");
    out.delete("content-length");
    return new NextResponse(upstream.body, { status: upstream.status, headers: out });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown proxy error";
    return NextResponse.json({ error: "API proxy failed", detail }, { status: 502 });
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path ?? []);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
