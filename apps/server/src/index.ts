import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { apiRouter } from "./routes/api.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 60_000,
  max: 300
});

app.use(limiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
