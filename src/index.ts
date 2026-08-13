import cors from "cors";
import { initLogger } from "evlog";
import { evlog } from "evlog/express";
import { createFsDrain } from "evlog/fs";
import express from "express";
import { env } from "./env.js";

initLogger({
	env: { service: "starter-server" },
});

const app = express();

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

app.get("/", (_req, res) => {
	res.status(200).send("OK");
});

app.listen(3000, () => {
	console.log("Server is running on http://localhost:3000");
});
