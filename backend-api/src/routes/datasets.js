import { Router } from "express";
import multer from "multer";

import { ingestSalesInventoryCsv } from "../services/ingestService.js";

export const datasetsRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

datasetsRouter.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const datasetId = `ds_${Date.now()}`;
    const { rowsProcessed, rowsRejected } = await ingestSalesInventoryCsv({
      buffer: req.file.buffer,
      fileName: req.file.originalname,
    });

    return res.status(201).json({
      datasetId,
      filename: req.file.originalname,
      size: req.file.size,
      rowsProcessed,
      rowsRejected,
      status: "INGESTED"
    });
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});
