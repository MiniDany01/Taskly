const prisma = require('../prismaClient')
const bycrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// REGISTRO
const registerUser = async (req, res) => {

  try {
    const { name, email, password } = req.body

    if (!name || !password || !email) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios"
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({
        message: "El usuario ya esta registrado"
      });
    }

    const hashedPassword = await bycrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      },
    })

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      },
    })
  } catch (error) {
    console.error("Error en registro: ", error)
    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
}

// LOGIN
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son obligatorios"
      })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(400).json({
        message: "Credenciales incorrectas"
      })
    }

    const isPassword = await bycrypt.compare(password, user.password)

    if (!isPassword) {
      return res.status(400).json({
        message: "Credenciales incorrectas"
      })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    return res.status(200).json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error("Error en el login: ", error)
    return res.status(500).json({
      message: "Error interno del servidor"
    })
  }
}

module.exports = {
  registerUser,
  loginUser
}