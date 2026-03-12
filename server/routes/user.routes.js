const express = require("express");
const router = express.Router();
const {
  getMe,
  updateName,
  changePassword,
  setupTwoFactor,
  verifyTwoFactor,
  updateReminder,
} = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middlewares");

router.get("/me", authMiddleware, getMe);
router.put("/me/name", authMiddleware, updateName);
router.put("/me/password", authMiddleware, changePassword);
router.post("/me/2fa/setup", authMiddleware, setupTwoFactor);
router.post("/me/2fa/verify", authMiddleware, verifyTwoFactor);
router.put("/reminder", authMiddleware, updateReminder);

module.exports = router;
