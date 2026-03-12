const express = require("express");
const authMiddleware = require("../middlewares/auth.middlewares");
const {
  getUpcomingTasks,
  getUrgentTasks,
  getSummary,
} = require("../controllers/dashboard.controller");
const router = express.Router();

router.get("/upcoming", authMiddleware, getUpcomingTasks);
router.get("/urgent", authMiddleware, getUrgentTasks);
router.get("/summary", authMiddleware, getSummary);

module.exports = router;
