const express = require("express");
const authMiddleware = require("../middlewares/auth.middlewares");
const { getCalendarTasks } = require("../controllers/calendar.controller");
const router = express.Router();

router.get("/tasks", authMiddleware, getCalendarTasks);

module.exports = router;
