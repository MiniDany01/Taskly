const prisma = require("../prismaClient");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        createdAt: true,
        twoFactorEnabled: true,
        taskReminder: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener el usuario",
    });
  }
};

exports.updateName = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        message: "El nombre debe tener al menos 2 caracteres",
      });
    }

    const updateUser = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    res.json(updateUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al actualizar el nombre",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Las nuevas contraseñas no coinciden",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Este usuario no tiene contraseña configurada",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "La contraseña actual es incorrecta",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al cambiar la contraseña",
    });
  }
};

exports.setupTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `Taskly (${req.user.email})`,
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false,
      },
    });

    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      qrCode: qrCodeDataURL,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al generar 2FA",
    });
  }
};

exports.verifyTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Código requerido",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        message: "2FA no configurado",
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({
        message: "Código inválido",
      });
    }

    // 🔥 Aquí activamos el 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      },
    });

    res.json({
      message: "2FA activado correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al verificar 2FA",
    });
  }
};

exports.updateReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskReminder } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (taskReminder !== null && !user.twoFactorEnabled) {
      return res.status(500).json({
        message:
          "Debes activar la verificación en dos pasos para recibir recordatorios por correo.",
      });
    }

    const updateUser = await prisma.user.update({
      where: { id: userId },
      data: {
        taskReminder,
      },
    });

    res.json(updateUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al actualizar recordatorio",
    });
  }
};
