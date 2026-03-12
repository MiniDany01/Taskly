const express = require("express")
const router = express.Router()
const { createSubject, getSubjects, updateSubject, deleteSubject } = require("../controllers/subject.controller")
const authMiddleware = require("../middlewares/auth.middlewares")

router.post("/", authMiddleware, createSubject)
router.get("/", authMiddleware, getSubjects)
router.put("/:id", authMiddleware, updateSubject)
router.delete("/:id", authMiddleware, deleteSubject)

module.exports = router