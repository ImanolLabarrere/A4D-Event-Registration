import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/server/app";
import { db } from "../../src/server/db/client";

describe("Cloud-Ready Health & Readiness Probes (Episode 2)", () => {
  it("GET /api/health returns 200 ok", async () => {
    const res = await request(app).get("/api/health");
    // INTENTIONALLY BROKEN FOR C-02 QUALITY GATE PROOF
    expect(res.status).toBe(999);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/ready returns 200 ready and db connected when database is healthy", async () => {
    vi.spyOn(db, "$queryRaw").mockResolvedValueOnce([{ "?column?": 1 }] as any);
    const res = await request(app).get("/api/ready");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
    expect(res.body.db).toBe("connected");
  });

  it("GET /api/ready returns 503 unready when database connection fails", async () => {
    vi.spyOn(db, "$queryRaw").mockRejectedValueOnce(new Error("Connection refused"));
    const res = await request(app).get("/api/ready");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("unready");
    expect(res.body.db).toBe("disconnected");
    expect(res.body.error).toContain("Connection refused");
  });

  it("GET / returns 200 HTML landing page", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("A4D Event Registration API");
  });
});
