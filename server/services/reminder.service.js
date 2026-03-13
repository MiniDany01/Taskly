const prisma = require("../prismaClient");
const { sendEmail } = require("../utils/email");

async function sendTaskReminders() {
  console.log("Checking tasks for reminders...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks = await prisma.task.findMany({
    where: {
      completed: false,
    },
    include: {
      user: true,
      subject: true,
    },
  });

  console.log("Tasks found:", tasks.length);

  const tasksByUser = {};

  for (const task of tasks) {
    const reminderDays = task.user.taskReminder;

    // usuario desactivó recordatorios
    if (reminderDays === null || reminderDays === "") continue;

    if (!task.user.twoFactorEnabled) continue;

    const reminderDate = new Date(task.dueDate);
    reminderDate.setDate(reminderDate.getDate() - reminderDays);
    reminderDate.setHours(0, 0, 0, 0);

    if (reminderDate.getTime() === today.getTime()) {
      if (!tasksByUser[task.user.email]) {
        tasksByUser[task.user.email] = [];
      }

      tasksByUser[task.user.email].push(task);
    }
  }

  for (const email in tasksByUser) {
    const userTasks = tasksByUser[email];

    const tasksHtml = userTasks
      .map(
        (task) => `
        <li>
          <b>${task.title}</b> — ${task.subject.name}
        </li>
      `,
      )
      .join("");

    const html = `
      <div style="font-family:Arial;padding:20px;background:#f7f8fa">
        <div style="max-width:500px;margin:auto;background:white;padding:25px;border-radius:10px">

          <h2 style="color:#4f7cff">Taskly</h2>

          <p>Tienes tareas que vencen pronto:</p>

          <ul>
            ${tasksHtml}
          </ul>

          <a href="http://localhost:3000/pages/dashboard"
            style="
              display:inline-block;
              padding:10px 16px;
              background:#4f7cff;
              color:white;
              text-decoration:none;
              border-radius:6px;
              margin-top:15px
            ">
            Abrir Taskly
          </a>

        </div>
      </div>
    `;

    try {
      console.log("Sending email to:", email);

      await sendEmail(email, "Recordatorio de tareas - Taskly", html);

      console.log("Email sent");
    } catch (error) {
      console.error("Email error:", error);
    }
  }
}

module.exports = { sendTaskReminders };
