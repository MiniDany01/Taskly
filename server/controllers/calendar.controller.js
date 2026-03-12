const prisma = require("../prismaClient");

exports.getCalendarTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await prisma.task.findMany({
      where: {
        userId,
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
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener las materias",
    });
  }
};
