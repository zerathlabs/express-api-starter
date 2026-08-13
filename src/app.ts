import cors from "cors";
import { initLogger } from "evlog";
import { evlog } from "evlog/express";
import { createFsDrain } from "evlog/fs";
import express from "express";
import { env } from "./env.js";
import { apiRouter } from "./modules/index.js";

initLogger({
	env: { service: "starter-server" },
});

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
