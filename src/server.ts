import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const urlObj = new URL(request.url);
    if (urlObj.pathname === "/api/ws-gemini") {
      const key = (env as any)?.GEMINI_API_KEY || (env as any)?.VITE_GEMINI_API_KEY || "AQ.Ab8RN6Lq-UQys-_ZeYVAcF6GkJAUKLaEPpjjZON73xBeQFhXdQ";
      const targetUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${key}`;
      const headers = new Headers(request.headers);
      headers.set("Origin", "https://generativelanguage.googleapis.com");
      try {
        return await fetch(targetUrl, {
          headers,
        });
      } catch (err: any) {
        return new Response(`WebSocket proxy error: ${err.message}`, { status: 502 });
      }
    }

    if (urlObj.pathname === "/api/pdf-proxy") {
      const targetUrl = urlObj.searchParams.get("url");
      if (!targetUrl) {
        return new Response("Missing url parameter", { status: 400 });
      }
      try {
        const response = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.cambridgeinternational.org/"
          }
        });
        const headers = new Headers();
        headers.set("Content-Type", "application/pdf");
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
        headers.set("Access-Control-Allow-Headers", "*");
        headers.set("Content-Disposition", "inline");
        
        const contentLength = response.headers.get("Content-Length");
        if (contentLength) {
          headers.set("Content-Length", contentLength);
        }
        
        return new Response(response.body, {
          status: response.status,
          headers,
        });
      } catch (err: any) {
        return new Response(`Proxy error: ${err.message}`, { status: 502 });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
