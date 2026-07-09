import { Router } from "express";
import { z } from "zod";

import { answerGroundedCopilot } from "../services/copilotService.js";

export const copilotRouter = Router();

const askSchema = z.object({
  question: z.string().min(3),
  route: z.string().optional().default(""),
  filters: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().default({}),
  dataset_id: z.string().optional(),
  run_id: z.string().optional(),
  selected_context: z.record(z.any()).optional().default({}),
  visible_context: z.record(z.any()).optional().default({})
});

copilotRouter.post("/ask", async (req, res, next) => {
  try {
    const parsed = askSchema.parse(req.body || {});

    const payload = await answerGroundedCopilot({
      question: parsed.question,
      route: parsed.route,
      filters: parsed.filters,
      datasetId: parsed.dataset_id,
      runId: parsed.run_id,
      selectedContext: parsed.selected_context,
      visibleContext: parsed.visible_context
    });

    res.json(payload);
  } catch (error) {
    next(error);
  }
});
