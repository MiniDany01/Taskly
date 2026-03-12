const prisma = require("../prismaClient");

exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    /* ===============================
       RESUMEN GENERAL
    =============================== */

    const totalTasks = await prisma.task.count({
      where: { userId },
    });

    const completedTasks = await prisma.task.count({
      where: {
        userId,
        completed: true,
      },
    });

    const pendingTasks = await prisma.task.count({
      where: {
        userId,
        completed: false,
        dueDate: { gte: now },
      },
    });

    const overdueTasks = await prisma.task.count({
      where: {
        userId,
        completed: false,
        dueDate: { lt: now },
      },
    });

    /* ===============================
       TAREAS POR MATERIA
    =============================== */

    const tasksBySubject = await prisma.task.groupBy({
      by: ["subjectId"],
      _count: {
        subjectId: true,
      },
      where: { userId },
    });

    const subjectsData = await Promise.all(
      tasksBySubject.map(async (item) => {
        const subject = await prisma.subject.findUnique({
          where: { id: item.subjectId },
        });

        return {
          name: subject?.name || "Sin materia",
          color: subject?.color || "#999",
          count: item._count.subjectId,
        };
      }),
    );

    /* ===============================
       PRODUCTIVIDAD
    =============================== */

    const productivity = {
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
    };

    /* ===============================
       RACHA
    =============================== */

    const lastOverdue = await prisma.task.findFirst({
      where: {
        userId,
        completed: false,
        dueDate: { lt: now },
      },
      orderBy: { dueDate: "desc" },
    });

    let currentStreak = 0;

    if (!lastOverdue) {
      const firstTask = await prisma.task.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });

      if (firstTask) {
        currentStreak = Math.floor(
          (now - new Date(firstTask.createdAt)) / (1000 * 60 * 60 * 24),
        );
      }
    } else {
      currentStreak = Math.floor(
        (now - new Date(lastOverdue.dueDate)) / (1000 * 60 * 60 * 24),
      );
    }

    /* ===============================
       VENCIDAS ESTE MES
    =============================== */

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthOverdue = await prisma.task.count({
      where: {
        userId,
        completed: false,
        dueDate: {
          lt: now,
          gte: startOfMonth,
        },
      },
    });

    /* ===============================
       RESPUESTA FINAL
    =============================== */

    res.json({
      summary: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
      },

      subjects: subjectsData,

      productivity,

      streak: {
        current: currentStreak,
        best: currentStreak,
        onTimeRate: 0,
        monthOverdue,
      },
    });
  } catch (error) {
    console.error("Error obteniendo las estadísticas", error);

    res.status(500).json({
      error: "Error al obtener las estadísticas",
    });
  }
};
