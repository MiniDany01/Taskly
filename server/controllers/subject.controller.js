const prisma = require("../prismaClient");

// CREAR MATERIA
const createSubject = async (req, res) => {
  try {
    const { name, color } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        message: "El nombre es obligatorio",
      });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        color: color || "#007bff",
        userId,
      },
    });

    res.status(201).json({ subject });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error interno",
    });
  }
};

// OBTENER MATERIAS DEL USUARIO
const getSubjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const subjects = await prisma.subject.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            tasks: {
              where: {
                completed: false,
              },
            },
          },
        },
      },
    });

    res.json(subjects);
  } catch (error) {
    res.status(500).json({
      message: "Error interno",
    });
  }
};

// ACTUALIZAR MATERIA
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        name,
        color,
      },
    });

    res.json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error interno",
    });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const tasksCount = await prisma.task.count({
      where: {
        subjectId: id,
        userId,
      },
    });

    if (tasksCount > 0) {
      return res.status(400).json({
        message: "No puedes eliminar una materia con tareas asignadas",
      });
    }

    await prisma.subject.delete({
      where: { id },
    });

    res.json({
      message: "Materia eliminada correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error interno",
    });
  }
};

module.exports = {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
};
