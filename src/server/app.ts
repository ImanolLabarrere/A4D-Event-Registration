import express from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth/router";
import { eventsRouter } from "./events/router";

export const app = express();

app.use(express.json());
app.use(cookieParser());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);

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
