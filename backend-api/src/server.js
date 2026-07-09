import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { ZodError } from "zod";

import { copilotRouter } from "./routes/copilot.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { datasetsRouter } from "./routes/datasets.js";
import { healthRouter } from "./routes/health.js";
import { pipelineRouter } from "./routes/pipeline.js";
import { authRouter } from "./routes/auth.js";
import { otpRouter } from "./routes/otp.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/health", healthRouter);
app.use("/api/pipeline", pipelineRouter);
app.use("/api/datasets", datasetsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/copilot", copilotRouter);
app.use("/api/auth", authRouter);
app.use("/api/otp", otpRouter);

app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "validation failed",
      issues: err.flatten()
    });
  }

  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

app.listen(port, () => {
  console.log(`backend-api running on http://localhost:${port}`);
});
