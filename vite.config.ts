// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "path";
import type { Plugin } from "vite";
import https from "https";
import http from "http";

/**
 * Dev-only PDF proxy plugin.
 * Intercepts /api/pdf-proxy?url=<encoded> and streams the PDF using Node's
 * native https.request with rejectUnauthorized:false to bypass SSL cert issues
 * that cause Node.js global fetch() to fail on sites like gceguide.xyz.
 * In production (Cloudflare Workers), server.ts handles the same path.
 */
function pdfProxyPlugin(): Plugin {
  return {
    name: "pdf-proxy-dev",
    apply: "serve", // dev only
    configureServer(server) {
      server.middlewares.use("/api/pdf-proxy", (req: any, res: any) => {
        // Parse the request URL (req.url is relative, e.g. "?url=...")
        const urlObj = new URL(req.url ?? "/", "http://localhost");
        const targetUrl = urlObj.searchParams.get("url");

        if (!targetUrl) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing url parameter");
          return;
        }

        let parsed: URL;
        try {
          parsed = new URL(targetUrl);
        } catch {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Invalid url parameter");
          return;
        }

        const isHttps = parsed.protocol === "https:";
        const mod = isHttps ? https : http;
        const defaultPort = isHttps ? 443 : 80;

        const proxyReq = mod.request(
          {
            hostname: parsed.hostname,
            port: parsed.port ? Number(parsed.port) : defaultPort,
            path: parsed.pathname + parsed.search,
            method: req.method ?? "GET",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Referer": "https://www.cambridgeinternational.org/",
              "Accept": "application/pdf,*/*",
            },
            // Allow self-signed / mismatched SSL certs (gceguide.xyz, etc.)
            rejectUnauthorized: false,
          } as any,
          (proxyRes) => {
            const status = proxyRes.statusCode ?? 200;
            if (!res.headersSent) {
              res.writeHead(status, {
                "Content-Type":
                  proxyRes.headers["content-type"] ?? "application/pdf",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                "Content-Disposition": "inline",
                ...(proxyRes.headers["content-length"]
                  ? { "Content-Length": proxyRes.headers["content-length"] }
                  : {}),
              });
            }
            proxyRes.pipe(res);
          }
        );

        proxyReq.on("error", (err: Error) => {
          if (!res.headersSent) {
            res.writeHead(502, { "Content-Type": "text/plain" });
          }
          res.end(`Proxy error: ${err.message}`);
        });

        proxyReq.end();
      });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      proxy: {
        "/api/ws-gemini": {
          target: "wss://generativelanguage.googleapis.com",
          changeOrigin: true,
          ws: true,
          rewrite: () => {
            const key = process.env.VITE_GEMINI_API_KEY || "AQ.Ab8RN6Lq-UQys-_ZeYVAcF6GkJAUKLaEPpjjZON73xBeQFhXdQ";
            return `/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${key}`;
          },
          headers: {
            "Origin": "https://generativelanguage.googleapis.com",
          },
        },
      },
    },
    plugins: [pdfProxyPlugin()],
    resolve: {
      alias: {
        "lucide-react": path.resolve(
          "./node_modules/lucide-react/dist/esm/lucide-react.js"
        ),
      },
    },
    optimizeDeps: {
      include: ["lucide-react"],
    },
  },
});
