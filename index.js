const express = require("express");
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "150mb" }));
const axios = require("axios");
require("dotenv").config();

const morgan = require("morgan");
app.use(morgan("dev"));

const mongoose = require("mongoose");
const User = require("./models/User");
mongoose.connect("mongodb://localhost/pages", () => {
	console.log("⚡ connected to db");
});

const { createClient } = require("redis");
const rc = createClient();
(async () => {
	rc.on("error", (err) => console.log("Redis Client Error", err));
	rc.on("connect", () => console.log("💡 Redis Client Connected"));
	await rc.connect();
})();

const DEFAULT_EXP = 600;

app.get("/", async (req, res) => {
	const limit = parseInt(req.query.limit || 0);
	const page = parseInt(req.query.page || 0);
	const skip = page ? page * 10 - 10 : 0;
	const data = await rc.get(`page${skip}`);
	if (data) {
		res.json(JSON.parse(data));
	} else {
		const users = await User.find().skip(skip).limit(limit);
		res.json(users);
		rc.setEx(`page${page}limit${limit}`, DEFAULT_EXP, JSON.stringify(users));
	}
});

app.listen(3000, () => {
	console.log("🚀 Listening on http://localhost:3000");
});
