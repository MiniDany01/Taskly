const express = require("express");
const authMiddleware = require("../middlewares/auth.middlewares");
const router = express.Router();
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  toggleTaskStatus,
  toggleUrgentTasks,
} = require("../controllers/tasks.controller");

router.post("/", authMiddleware, createTask);
router.get("/", authMiddleware, getTasks);
router.put("/:id", authMiddleware, updateTask);
router.delete("/:id", authMiddleware, deleteTask);
router.patch("/:id/toggle", authMiddleware, toggleTaskStatus);
router.patch("/:id/urgent", authMiddleware, toggleUrgentTasks);

module.exports = router;
