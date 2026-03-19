function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function getUser() {
  return (
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"))
  );
}

const API_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://taskly-c6ba.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const toggleBtn = document.getElementById("toggleSidebar");
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main");
  const logoutBtn = document.querySelector(".logout");
  const user = getUser();
  const token = getToken();
  const userName = document.querySelector(".user-info strong");

  if (!token || !user) {
    window.location.href = "/pages/login";
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
    window.location.href = "/pages/login";
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

  loadStats();
});

async function loadStats() {
  try {
    const res = await fetch(`${API_URL}/api/stats`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!res.ok) throw new Error("Error al cargar estadísticas");

    const data = await res.json();

    renderSummary(data.summary);
    renderStreak(data.streak);
    renderSubjectsChart(data.subjects);
    renderProductivityChart(data.productivity);
  } catch (error) {
    console.error(error);
  }
}

// CARDS
function renderSummary(summary) {
  document.getElementById("totalTasks").textContent = summary.total;
  document.getElementById("completedTasks").textContent = summary.completed;
  document.getElementById("pendingTasks").textContent = summary.pending;
  document.getElementById("overdueTasks").textContent = summary.overdue;
}

// RACHA
function renderStreak(streak) {
  document.getElementById("streakDays").textContent = `${streak.current} días`;

  document.getElementById("bestStreak").textContent = streak.best;
  document.getElementById("onTimeRate").textContent = `${streak.onTimeRate}%`;
  document.getElementById("monthOverdue").textContent = streak.monthOverdue;
}

// GRAFICAS
function renderProductivityChart(data) {
  const ctx = document.getElementById("productivityChart");

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completadas", "Pendientes", "Vencidas"],
      datasets: [
        {
          data: [data.completed, data.pending, data.overdue],
          backgroundColor: ["#22c55e", "#3b82f6", "#ff4d4f"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

function renderSubjectsChart(subjects) {
  const ctx = document.getElementById("subjectsChart");

  const labels = subjects.map((s) => s.name);
  const data = subjects.map((s) => s.count);
  const colors = subjects.map((s) => s.color);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Tareas",
          data,
          backgroundColor: colors,
          borderRadius: 6,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}
