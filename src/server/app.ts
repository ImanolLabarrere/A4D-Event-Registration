import express from "express";
import cookieParser from "cookie-parser";
import { db } from "./db/client";
import { authRouter } from "./auth/router";
import { eventsRouter } from "./events/router";
import { manageRouter } from "./events/manage";
import { registrationsRouter } from "./registrations/router";
import { myRegistrationsRouter } from "./registrations/my";

export const app = express();

app.use(express.json());
app.use(cookieParser());

// ---------------------------------------------------------------------------
// Health and Readiness probes (Cloud Run / Smoke tests)
// ---------------------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/ready", async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({
      status: "unready",
      db: "disconnected",
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

app.get("/", (_req, res) => {
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>A4D Event Registration API</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #1a73e8; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; background: #e8f0fe; color: #1967d2; font-weight: bold; }
    code { background: #f1f3f4; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>A4D Event Registration API</h1>
  <p><span class="badge">Running</span> Google Cloud Run Deployment</p>
  <ul>
    <li>Health probe: <code>/api/health</code></li>
    <li>Readiness probe: <code>/api/ready</code></li>
    <li>API Documentation & Endpoints: <code>/api/auth</code>, <code>/api/events</code>, <code>/api/registrations</code></li>
  </ul>
</body>
</html>`);
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/events", manageRouter);
app.use("/api/events", registrationsRouter);
app.use("/api/registrations", myRegistrationsRouter);

// ---------------------------------------------------------------------------
// Generic error handler (used by next(err) calls)
// ---------------------------------------------------------------------------
app.use(
  (
    err: { status?: number; code?: string; message?: string } | Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const status = (err as any).status ?? 500;
    const code = (err as any).code ?? "INTERNAL_ERROR";
    const message = (err as any).message ?? "An unexpected error occurred.";
    res.status(status).json({ error: { code, message } });
  },
);
