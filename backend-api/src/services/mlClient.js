import axios from "axios";

const mlBaseUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

export async function runFullPipeline(payload) {
  const { data } = await axios.post(`${mlBaseUrl}/ml/full-pipeline`, payload, {
    timeout: 30_000
  });

  return data;
}
