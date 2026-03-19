let calendar;
const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://taskly-c6ba.onrender.com";

const notyf = new Notyf({
  duration: 2500,
  dismissible: false,
  position: { x: "right", y: "top" },
  types: [
    {
      type: "success",
      background: "#4f7cff",
      color: "#fff",
    },
    {
      type: "error",
      background: "#ff4d4f",
      color: "#fff",
    },
  ],
});

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function getUser() {
  return (
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"))
  );
}

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const toggleBtn = document.getElementById("toggleSidebar");
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main");
  const logoutBtn = document.querySelector(".logout");
  const user = getUser();
  const token = getToken();
  const userName = document.querySelector(".user-info strong");

  const calendarEl = document.getElementById("calendar");

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "es",
    height: "auto",
    contentHeight: 650,
    editable: true,
    eventStartEditable: true,
    dayMaxEvents: 3,

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth",
    },

    moreLinkContent: function (args) {
      return `+${args.num} más`;
    },

    buttonText: {
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      day: "Día",
    },

    eventTimeFormat: {
      hour: "2-digit",
      minute: "2-digit",
      meridiem: false,
    },

    events: [],

    eventClick: function (arg) {
      const date = new Date(arg.event.start);
      const hours = date.getHours();
      const minutes = date.getMinutes();

      let timeText = "";

      if (!(hours === 0 && minutes === 0)) {
        timeText =
          date.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) + " ";
      }

      return {
        html: `<b>${timeText}</b>${arg.event.title}`,
      };
    },

    eventClick: function (info) {
      const title = info.event.title;
      const subject = info.event.extendedProps.subject;
      const description = info.event.extendedProps.description;

      document.querySelectorAll(".fc-popover").forEach((pop) => pop.remove());

      document.getElementById("modalTaskTitle").textContent = title;
      document.getElementById("modalTaskSubject").textContent = subject;
      document.getElementById("modalTaskDescription").textContent =
        description || "Sin descripción";

      document.getElementById("calendarTaskModal").classList.add("active");
    },
    eventDrop: async function (info) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newDate = new Date(info.event.start);
      newDate.setHours(0, 0, 0, 0);

      if (newDate < today) {
        info.revert();
        notyf.error("No puedes mover una tarea a una fecha pasada");
        return;
      }

      const taskId = info.event.extendedProps.taskId;

      try {
        const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            dueDate: info.event.startStr,
          }),
        });

        if (!res.ok) throw new Error();

        // notyf.success("Fecha actualizada");
      } catch (error) {
        info.revert();
        notyf.error("Error al actualizar la fecha");
      }
    },
    eventDidMount: function (info) {
      info.el.title =
        info.event.title + " • " + info.event.extendedProps.subject;
    },
  });

  if (!token || !user) {
    window.location.href = "/login";
    return;
  }

  userName.textContent = user.name;

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");

    if (sidebar.classList.contains("collapsed")) {
      main.style.marginLeft = "70px";
      toggleBtn.innerHTML = '<i data-lucide="chevron-right"></i>';
    } else {
      main.style.marginLeft = "220px";
      toggleBtn.innerHTML = '<i data-lucide="chevron-left"></i>';
    }

    lucide.createIcons();
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  });

  document
    .getElementById("closeCalendarModal")
    .addEventListener("click", () => {
      document.getElementById("calendarTaskModal").classList.remove("active");
    });

  const modal = document.getElementById("calendarTaskModal");
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  const mobileBtn = document.getElementById("mobileMenuBtn");
  // const sidebar = document.querySelector(".sidebar");

  mobileBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    const clickInsideSidebar = sidebar.contains(e.target);
    const clickOnButton = mobileBtn.contains(e.target);

    if (!clickInsideSidebar && !clickOnButton) {
      sidebar.classList.remove("open");
    }
  });

  loadCalendarTasks();
  calendar.render();
});

async function loadCalendarTasks() {
  const res = await fetch(`${API_URL}/api/calendar/tasks`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const tasks = await res.json();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = tasks.map((task) => {
    const dueDate = new Date(task.dueDate);

    const isOverdue = dueDate < today;

    return {
      title: isOverdue ? "⚠ " + task.title : task.title,
      start: task.dueDate,
      end: new Date(dueDate.getTime() + 60000),
      allDay: false,

      backgroundColor: isOverdue ? "#ff4d4f" : task.subject.color,
      borderColor: isOverdue ? "#ff4d4f" : task.subject.color,

      extendedProps: {
        taskId: task.id,
        subject: task.subject.name,
        description: task.description,
      },
    };
  });

  calendar.addEventSource(events);
}
