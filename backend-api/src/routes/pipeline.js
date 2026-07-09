import { Router } from "express";
import { z } from "zod";

import { runFullPipeline } from "../services/mlClient.js";
import { clearDashboardCache } from "../services/dashboardStore.js";
import { clearLatestRunCache, getLatestPipelineRun, getPipelineRun, savePipelineRun } from "../services/pipelineStore.js";

export const pipelineRouter = Router();

function requireApiKey(req, res, next) {
  const expected = process.env.WORKFLOW_API_KEY;
  if (!expected) {
    return next();
  }

  if (req.header("x-api-key") !== expected) {
    return res.status(401).json({ error: "unauthorized" });
  }

  return next();
}

const runSchema = z.object({
  datasetId: z.string().min(1),
  forecastDays: z.number().int().min(7).max(60).default(28),
  forecastModel: z
    .enum(["moving_average", "linear_regression", "xgboost", "prophet"])
    .default("moving_average")
});

pipelineRouter.post("/run", requireApiKey, async (req, res, next) => {
  try {
    const parsed = runSchema.parse(req.body);
    let result;

    try {
      result = await runFullPipeline(parsed);
    } catch (error) {
      if (error?.code === "ECONNABORTED") {
        return res.status(504).json({
          error: "ml service timeout",
          message: "Model processing exceeded timeout. Retry with a smaller horizon or lighter model.",
        });
      }

      if (error?.response?.status) {
        return res.status(503).json({
          error: "ml service unavailable",
          message: "ML service returned an error while processing the pipeline run.",
        });
      }

      throw error;
    }

    let persisted = true;
    let persistenceError = null;

    try {
      await savePipelineRun({
        datasetId: parsed.datasetId,
        forecastDays: parsed.forecastDays,
        result
      });
      clearLatestRunCache(parsed.datasetId);
      clearDashboardCache();
    } catch (error) {
      persisted = false;
      persistenceError = "Failed to persist run in database";
      console.error(error);
    }

    res.status(202).json({ ...result, persisted, persistenceError, data_source: persisted ? "postgres" : "memory_fallback" });
  } catch (error) {
    next(error);
  }
});

pipelineRouter.get("/runs/latest", requireApiKey, async (req, res, next) => {
  try {
    const datasetId = req.query.datasetId ? z.string().min(1).parse(req.query.datasetId) : undefined;
    let record;

    try {
      record = await getLatestPipelineRun(datasetId);
    } catch (error) {
      console.error(error);
      return res.status(503).json({ error: "database unavailable" });
    }

    if (!record) {
      return res.status(404).json({ error: "latest run not found" });
    }

    return res.json({ ...record, persisted: true, data_source: "postgres" });
  } catch (error) {
    next(error);
  }
});

pipelineRouter.get("/latest-run", requireApiKey, async (req, res, next) => {
  try {
    const datasetId = req.query.datasetId ? z.string().min(1).parse(req.query.datasetId) : undefined;
    let record;

    try {
      record = await getLatestPipelineRun(datasetId);
    } catch (error) {
      console.error(error);
      return res.status(503).json({ error: "database unavailable" });
    }

    if (!record) {
      return res.status(404).json({ error: "latest run not found" });
    }

    return res.json({ ...record, persisted: true, data_source: "postgres" });
  } catch (error) {
    next(error);
  }
});

pipelineRouter.get("/runs/:jobId", async (req, res, next) => {
  try {
    const jobId = z.string().min(1).parse(req.params.jobId);
    let record;

    try {
      record = await getPipelineRun(jobId);
    } catch (error) {
      console.error(error);
      return res.status(503).json({ error: "database unavailable" });
    }

    if (!record) {
      return res.status(404).json({ error: "job not found" });
    }

    return res.json(record);
  } catch (error) {
    next(error);
  }
});
