const cron = require("node-cron");
const { sendTaskReminders } = require("../services/reminder.service");

cron.schedule("0 0 * * *", async () => {
  console.log("Running task reminders");

  await sendTaskReminders();
});
