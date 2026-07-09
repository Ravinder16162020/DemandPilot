import { Router } from "express";
import { z } from "zod";

import {
  getDashboardKpis,
  getRecommendations,
  getTopRisks
} from "../services/dashboardStore.js";

export const dashboardRouter = Router();

const limitSchema = z
  .string()
  .regex(/^\d+$/)
  .transform((value) => Number.parseInt(value, 10))
  .pipe(z.number().int().min(1).max(100));

dashboardRouter.get("/kpis", async (_req, res, next) => {
  try {
    const runId = _req.query.runId ? z.string().min(1).parse(_req.query.runId) : undefined;
    const datasetId = _req.query.datasetId ? z.string().min(1).parse(_req.query.datasetId) : undefined;
    const data = await getDashboardKpis({ runId, datasetId });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get("/risks/top", async (req, res, next) => {
  try {
    const limit = req.query.limit ? limitSchema.parse(req.query.limit) : 25;
    const runId = req.query.runId ? z.string().min(1).parse(req.query.runId) : undefined;
    const datasetId = req.query.datasetId ? z.string().min(1).parse(req.query.datasetId) : undefined;
    const data = await getTopRisks(limit, { runId, datasetId });
    res.json({ count: data.length, items: data, runId: runId ?? null, datasetId: datasetId ?? null, data_source: "postgres" });
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get("/recommendations", async (req, res, next) => {
  try {
    const limit = req.query.limit ? limitSchema.parse(req.query.limit) : 25;
    const runId = req.query.runId ? z.string().min(1).parse(req.query.runId) : undefined;
    const datasetId = req.query.datasetId ? z.string().min(1).parse(req.query.datasetId) : undefined;
    const data = await getRecommendations(limit, { runId, datasetId });
    res.json({ count: data.length, items: data, runId: runId ?? null, datasetId: datasetId ?? null, data_source: "postgres" });
  } catch (error) {
    next(error);
  }
});
