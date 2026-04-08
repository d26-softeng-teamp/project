import type http from "node:http";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { createContext } from "./context";
import { appRouter } from "./routers";

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:5174"];

function setCorsHeaders(req: http.IncomingMessage, res: http.ServerResponse) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

const server = createHTTPServer({
  router: appRouter,
  createContext,
  middleware: (req, res, next) => {
    setCorsHeaders(req, res);

    // Handle preflight OPTIONS
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    next();
  },
});

const port = Number(process.env.PORT) || 3000;

server.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
