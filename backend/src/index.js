import "dotenv/config";
import express from "express";
import cors from "cors";
import { createStore } from "./services/store.js";
import { createApiRouter } from "./routes/api.js";

const app = express();
const port = Number(process.env.PORT || 5050);
const store = await createStore();

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/api", createApiRouter(store));

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || "Unexpected server error"
  });
});

app.listen(port, () => {
  console.log(`CareerLink AI API running on http://localhost:${port}`);
});
