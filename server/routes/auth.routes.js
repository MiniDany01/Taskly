const express = require("express")
const router = express.Router()

const { loginUser, registerUser } = require("../controllers/auth.controller")
const verifyToken = require("../middlewares/auth.middlewares")

router.post("/login", loginUser)

router.post("/register", registerUser)

router.get("/profile", verifyToken, (req, res) => {
    res.json({
        message: "Ruta protegida",
        user: req.user
    })
})

module.exports = router