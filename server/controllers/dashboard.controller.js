const prisma = require("../prismaClient");

exports.getUpcomingTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        completed: false,
        urgent: false,
        dueDate: {
          gte: new Date(),
        },
      },
      include: {
        subject: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener las materias",
    });
  }
};

exports.getUrgentTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        urgent: true,
        completed: false,
      },
      include: {
        subject: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 4,
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener las materias",
    });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalTasks = await prisma.task.count({
      where: { userId },
    });

    const completedTasks = await prisma.task.count({
      where: {
        userId,
        completed: true,
      },
    });

    const today = new Date();
    const endOfWeek = new Date();

    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    const tasksThisWeek = await prisma.task.count({
      where: {
        userId,
        completed: false,
        dueDate: {
          gte: today,
          lte: endOfWeek,
        },
      },
    });

    res.json({
      totalTasks,
      tasksThisWeek,
      completedTasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener el resumen",
    });
  }
};
