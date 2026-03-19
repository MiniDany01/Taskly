require("dotenv").config();
const cors = require("cors");
const express = require("express");
const path = require("path");
const authRoutes = require("./routes/auth.routes");
const subjectRoutes = require("./routes/subject.routes");
const tasksRoutes = require("./routes/tasks.routes");
const userRoutes = require("./routes/user.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const calendarRoutes = require("./routes/calendar.routes");
const statsRoutes = require("./routes/stats.routes");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "https://taskly-lilac-nine.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

require("./jobs/reminder.job");

// Middleware
app.use(express.json());

// Servir archivos Frontend
app.use(
  express.static(path.join(__dirname, "../client"), {
    extensions: ["html"],
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/stats", statsRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
