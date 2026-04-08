import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./context";
import { appRouter } from "./routers";
import { startTelemetryWorker } from "./telemetryWorker";

const app = express();

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ---------------------------------------------------------------------------
// Body parsing (for any non-tRPC Express routes you add later)
// ---------------------------------------------------------------------------
app.use(express.json());

// ---------------------------------------------------------------------------
// Health check (available outside tRPC)
// ---------------------------------------------------------------------------
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// ---------------------------------------------------------------------------
// tRPC
// ---------------------------------------------------------------------------
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});

// Telemetry worker
const statsInterval = 30;
startTelemetryWorker(statsInterval);
