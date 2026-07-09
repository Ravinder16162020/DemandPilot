import { parse } from "csv-parse/sync";
import XLSX from "xlsx";

import { pool } from "../db/pool.js";

const REQUIRED_COLUMNS = ["date", "store_id", "sku_id", "units_sold"];

export class IngestValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "IngestValidationError";
    this.statusCode = 400;
  }
}

function normalizeKey(key) {
  return String(key ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeRows(rows) {
  return rows.map((row) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeKey(key)] = value;
    }
    return normalized;
  });
}

function parseUploadRows({ buffer, fileName }) {
  const normalizedName = String(fileName || "").toLowerCase();

  if (normalizedName.endsWith(".xlsx") || normalizedName.endsWith(".xls")) {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames?.[0];
      if (!firstSheetName) {
        throw new IngestValidationError("Excel file has no worksheets");
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
      return normalizeRows(rows);
    } catch (error) {
      if (error instanceof IngestValidationError) {
        throw error;
      }
      throw new IngestValidationError("Could not parse Excel file. Please upload a valid .xlsx or .xls file.");
    }
  }

  if (normalizedName.endsWith(".csv") || normalizedName === "") {
    try {
      const csvText = buffer.toString("utf8");
      const rows = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      return normalizeRows(rows);
    } catch {
      throw new IngestValidationError("Could not parse CSV file. Check delimiters and headers.");
    }
  }

  throw new IngestValidationError("Unsupported file type. Please upload CSV or Excel (.xlsx/.xls).")
}

function toBool(value) {
  if (value === undefined || value === null || value === "") return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function toInt(value, fallback = 0) {
  const num = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(num) ? num : fallback;
}

function toNumber(value, fallback = 0) {
  const num = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(num) ? num : fallback;
}

function validateColumns(columns) {
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length > 0) {
    throw new IngestValidationError(`Missing required columns: ${missing.join(", ")}`);
  }

  if (!columns.includes("inventory_level") && !columns.includes("inventory_on_hand")) {
    throw new IngestValidationError("Missing required column: inventory_level (or inventory_on_hand)");
  }
}

export async function ingestSalesInventoryCsv({ buffer, fileName }) {
  const rows = parseUploadRows({ buffer, fileName });

  if (rows.length === 0) {
    return { rowsProcessed: 0, rowsRejected: 0 };
  }

  validateColumns(Object.keys(rows[0]));

  const client = await pool.connect();
  let rowsProcessed = 0;
  let rowsRejected = 0;

  try {
    await client.query("BEGIN");

    for (const row of rows) {
      try {
        const saleDate = row.date;
        const storeId = row.store_id;
        const skuId = row.sku_id;

        if (!saleDate || !storeId || !skuId) {
          rowsRejected += 1;
          continue;
        }

        const storeName = row.store_name || `Store ${storeId}`;
        const region = row.region || "Unknown";
        const city = row.city || "Unknown";
        const storeType = row.store_type || "General";

        const skuName = row.sku_name || `Product ${skuId}`;
        const category = row.category || "General";
        const brand = row.brand || "Unknown";
        const unitPrice = toNumber(row.unit_price, 0);
        const shelfLifeDays = row.shelf_life_days ? toInt(row.shelf_life_days, 0) : null;

        const unitsSold = toInt(row.units_sold, 0);
        const inventoryLevel = toInt(row.inventory_level ?? row.inventory_on_hand, 0);
        const promoFlag = toBool(row.promo_flag);
        const discountPct = toNumber(row.discount_pct, 0);
        const holidayFlag = toBool(row.holiday_flag);
        const stockInTransit = toInt(row.stock_in_transit, 0);
        const reorderPoint = toInt(row.reorder_point, 0);
        const leadTimeDays = toInt(row.lead_time_days, 3);

        const revenue = unitsSold * unitPrice;

        await client.query(
          `
            INSERT INTO stores (store_id, name, region, city, store_type)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (store_id)
            DO UPDATE SET
              name = EXCLUDED.name,
              region = EXCLUDED.region,
              city = EXCLUDED.city,
              store_type = EXCLUDED.store_type;
          `,
          [storeId, storeName, region, city, storeType]
        );

        await client.query(
          `
            INSERT INTO products (sku_id, sku_name, category, brand, unit_price, shelf_life_days)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (sku_id)
            DO UPDATE SET
              sku_name = EXCLUDED.sku_name,
              category = EXCLUDED.category,
              brand = EXCLUDED.brand,
              unit_price = EXCLUDED.unit_price,
              shelf_life_days = EXCLUDED.shelf_life_days;
          `,
          [skuId, skuName, category, brand, unitPrice, shelfLifeDays]
        );

        await client.query(
          `
            INSERT INTO sales_daily (
              sale_date, store_id, sku_id, units_sold, revenue, promo_flag, discount_pct, holiday_flag
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (sale_date, store_id, sku_id)
            DO UPDATE SET
              units_sold = EXCLUDED.units_sold,
              revenue = EXCLUDED.revenue,
              promo_flag = EXCLUDED.promo_flag,
              discount_pct = EXCLUDED.discount_pct,
              holiday_flag = EXCLUDED.holiday_flag;
          `,
          [saleDate, storeId, skuId, unitsSold, revenue, promoFlag, discountPct, holidayFlag]
        );

        await client.query(
          `
            INSERT INTO inventory_daily (
              snapshot_date, store_id, sku_id, stock_on_hand, stock_in_transit, reorder_point, lead_time_days
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (snapshot_date, store_id, sku_id)
            DO UPDATE SET
              stock_on_hand = EXCLUDED.stock_on_hand,
              stock_in_transit = EXCLUDED.stock_in_transit,
              reorder_point = EXCLUDED.reorder_point,
              lead_time_days = EXCLUDED.lead_time_days;
          `,
          [saleDate, storeId, skuId, inventoryLevel, stockInTransit, reorderPoint, leadTimeDays]
        );

        rowsProcessed += 1;
      } catch (_error) {
        rowsRejected += 1;
      }
    }

    await client.query("COMMIT");
    return { rowsProcessed, rowsRejected };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
