import cors from "cors";
import { evlog } from "evlog/express";
import { createFsDrain } from "evlog/fs";
import express from "express";
import { env } from "./env.js";
import { apiRouter } from "./modules/index.js";
import "./utils/logger/index.js";

export const app = express();

app.use(
  evlog({
    drain: process.env.NODE_ENV === "production" ? undefined : createFsDrain(),
  }),
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
  }),
);

app.use(express.json());

// Base root endpoint
app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

// Mount modular API routes
app.use("/api", apiRouter);
