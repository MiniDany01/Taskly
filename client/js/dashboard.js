let allUpcomingTasks = [];

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://taskly-c6ba.onrender.com";

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

  const toogleBtn = document.getElementById("toggleSidebar");
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main");
  const token = getToken();
  const logoutBtn = document.querySelector(".logout");
  const user = getUser();
  const userName = document.querySelector(".user-info strong");

  userName.textContent = user ? user.name : "User";

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  });

  if (!token || !user) {
    window.location.href = "/login";
    return;
  }

  toogleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");

    if (sidebar.classList.contains("collapsed")) {
      main.style.marginLeft = "70px";
    } else {
      main.style.marginLeft = "220px";
    }

    const icon = toogleBtn.querySelector("i");

    if (sidebar.classList.contains("collapsed")) {
      toogleBtn.innerHTML = '<i data-lucide="chevron-right"></i>';
    } else {
      toogleBtn.innerHTML = '<i data-lucide="chevron-left"></i>';
    }

    lucide.createIcons();
  });

  document.getElementById("betaModal").classList.add("active");

  document.getElementById("closeBeta").addEventListener("click", () => {
    document.getElementById("betaModal").classList.remove("active");
  });

  const viewAllBtn = document.getElementById("viewAllTasks");

  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", () => {
      const modal = document.getElementById("tasksModal");
      const modalList = document.getElementById("modalTaskList");

      modalList.innerHTML = "";

      allUpcomingTasks.forEach((task) => {
        const li = document.createElement("li");

        li.innerHTML = `
          <span class="task-title">
            ${task.title}
            <small class="task-subject">
              • ${task.subject?.name || "Sin materia"}
            </small>
          </span>
          <small>${formatDueDate(task.dueDate)}</small>
        `;

        modalList.appendChild(li);
      });

      modal.classList.add("active");
    });
  }

  const closeModalBtn = document.getElementById("closeTasksModal");

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      document.getElementById("tasksModal").classList.remove("active");
    });
  }

  const aboutBtn = document.getElementById("aboutBtn");
  const thanksBtn = document.getElementById("thanksBtn");
  const helpBtn = document.getElementById("helpBtn");

  const aboutModal = document.getElementById("aboutModal");
  const thanksModal = document.getElementById("thanksModal");
  const helpModal = document.getElementById("helpModal");

  aboutBtn.addEventListener("click", () => {
    aboutModal.classList.add("active");
  });

  thanksBtn.addEventListener("click", () => {
    thanksModal.classList.add("active");
  });

  helpBtn.addEventListener("click", () => {
    helpModal.classList.add("active");
  });

  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".info-modal")
        .forEach((m) => m.classList.remove("active"));
    });
  });

  document.querySelectorAll(".info-modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  });

  const mobileBtn = document.getElementById("mobileMenuBtn");

  mobileBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  /* cerrar sidebar al hacer click fuera */
  document.addEventListener("click", (e) => {
    const clickInsideSidebar = sidebar.contains(e.target);
    const clickOnButton = mobileBtn.contains(e.target);

    if (!clickInsideSidebar && !clickOnButton) {
      sidebar.classList.remove("open");
    }
  });

  loadDashboard();
});

function renderUpcomingTasks(tasks) {
  const list = document.getElementById("upcomingTasks");
  const empty = document.getElementById("noUpcomingTasks");
  const viewAllBtn = document.getElementById("viewAllTasks");

  list.innerHTML = "";

  if (tasks.length === 0) {
    list.style.display = "none";
    empty.style.display = "flex";
    viewAllBtn.style.display = "none";
    return;
  }

  empty.style.display = "none";
  list.style.display = "flex";

  const firstThree = tasks.slice(0, 3);

  firstThree.forEach((task) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${task.title}</span>
      <small>${formatDueDate(task.dueDate)}</small>
    `;
    list.appendChild(li);
  });

  if (tasks.length >= 4) {
    viewAllBtn.style.display = "inline-flex";
  } else {
    viewAllBtn.style.display = "none";
  }
}

function renderUrgentTasks(tasks) {
  const urgentList = document.getElementById("urgentTasks");
  const empty = document.getElementById("noUrgentTasks");

  urgentList.innerHTML = "";

  if (tasks.length === 0) {
    urgentList.style.display = "none"; // ← ESTA LÍNEA FALTABA
    empty.style.display = "flex";
    return;
  }

  empty.style.display = "none";
  urgentList.style.display = "flex";

  tasks.forEach((task) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>${task.title}</span>
      <small>${formatDueDate(task.dueDate)}</small>
    `;

    urgentList.appendChild(li);
  });
}

function renderSummary(summary) {
  document.getElementById("totalTasks").textContent = summary.totalTasks || "0";
  document.getElementById("tasksThisWeek").textContent =
    summary.tasksThisWeek || "0";
  document.getElementById("completedTasks").textContent =
    summary.completedTasks || "0";
}

async function loadDashboard() {
  try {
    const token = getToken();

    const [upcomingRes, urgentRes, summaryRes] = await Promise.all([
      fetch(`${API_URL}/api/dashboard/upcoming`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }),
      fetch(`${API_URL}/api/dashboard/urgent`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }),
      fetch(`${API_URL}/api/dashboard/summary`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      }),
    ]);

    if (!upcomingRes.ok || !urgentRes.ok || !summaryRes.ok) {
      throw new Error("Error en el dashboard API");
    }

    const upcomingTasks = await upcomingRes.json();
    const urgentTasks = await urgentRes.json();
    const summary = await summaryRes.json();

    allUpcomingTasks = upcomingTasks;

    renderUpcomingTasks(upcomingTasks);
    renderUrgentTasks(urgentTasks);
    renderSummary(summary);
  } catch (error) {
    console.error("Error cargando dashboard", error);
  }
}

function formatDueDate(date) {
  const today = new Date();
  const due = new Date(date);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff > 1) return `En ${diff} días`;
  if (diff < 0) return "Vencida";

  return due.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}
