const prisma = require("../prismaClient");

function parseLocalDate(dateString) {
  const [date, time] = dateString.split("T");
  const [year, month, day] = date.split("-");
  const [hours, minutes] = time.split(":");

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
  );
}

// CREAR TAREA
exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, subjectId } = req.body;
    const userId = req.user.id;

    if (!title || !dueDate || !subjectId) {
      return res.status(400).json({
        message: "Faltan campos obligatorios",
      });
    }

    const parsedDate = parseLocalDate(dueDate);

    // validar fecha pasada (usando fecha local real)
    const now = new Date();
    if (parsedDate < now.setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        message: "No puedes asignar una fecha pasada",
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: parsedDate, // ✅ FIX
        subjectId,
        userId,
      },
      include: {
        subject: true,
      },
    });

    res.status(201).json({ task });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al crear la tarea",
    });
  }
};

// OBTENER TAREAS
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await prisma.task.findMany({
      where: { userId },
      include: { subject: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener tareas",
    });
  }
};

// ACTUALIZAR TAREA
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, subjectId } = req.body;
    const userId = req.user.id;

    const parsedDate = parseLocalDate(dueDate);

    const task = await prisma.task.update({
      where: {
        id,
        userId,
      },
      data: {
        title,
        description,
        dueDate: parsedDate, // ✅ MISMO FIX
        subjectId,
      },
      include: {
        subject: true,
      },
    });

    res.json({ task });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al actualizar la tarea",
    });
  }
};

// ELIMINAR TAREA
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.task.deleteMany({
      where: {
        id,
        userId,
      },
    });

    res.json({ message: "Tarea eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al eliminar la tarea",
    });
  }
};

// TOGGLE COMPLETADO
exports.toggleTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!task) {
      return res.status(404).json({
        message: "Tarea no encontrada",
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        completed: !task.completed,
      },
      include: { subject: true },
    });

    res.json({ task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al actualizar estado",
    });
  }
};

// TOGGLE URGENTE
exports.toggleUrgentTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!task) {
      return res.status(400).json({
        message: "Tarea no encontrada",
      });
    }

    if (!task.urgent) {
      const urgentCount = await prisma.task.count({
        where: {
          userId,
          urgent: true,
        },
      });

      if (urgentCount >= 4) {
        return res.status(400).json({
          message: "Solo puedes tener 4 tareas urgentes",
        });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        urgent: !task.urgent,
      },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al actualizar la tarea",
    });
  }
};
