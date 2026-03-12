const express = require("express");
const authMiddleware = require("../middlewares/auth.middlewares");
const { getStats } = require("../controllers/stats.controller");
const router = express.Router();

router.get("/", authMiddleware, getStats);

module.exports = router;
