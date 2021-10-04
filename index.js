const express = require("express");
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "150mb" }));

require("dotenv").config();

const morgan = require("morgan");
app.use(morgan("dev"));

const mongoose = require("mongoose");
const User = require("./models/User");
mongoose.connect("mongodb://localhost/pages", () => {
	console.log("⚡ connected to db");
});

const redis = require("redis");
const rc = redis.createClient();
rc.on("error", function (error) {
	console.log(error);
});
rc.on("connect", function (error) {
	console.log('connected to REDIS');
});
rc.on("ready", function (error) {
	console.log('connected to REDIS');
});
rc.on("end", function (error) {
	console.log(error);
});
const DEFAULT_EXP = 600;

app.get("/", async (req, res) => {
	const limit = parseInt(req.query.limit || 10);
	const page = parseInt(req.query.page || 0);
	const skip = limit * page - limit > 0 ? limit * page - limit : 0;
	const users = await User.find().limit(limit).skip(skip);
	await rc.setEx(`page${skip}`, DEFAULT_EXP, JSON.stringify(users));
	res.json(users);
});

app.listen(3000, () => {
	console.log("🚀 Listening on http://localhost:3000");
});
