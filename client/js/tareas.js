let subjectSelect;
let taskToDelete = null;
let editingTask = null;

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

const notyf = new Notyf({
  duration: 2500,
  dismissible: false,
  position: { x: "right", y: "top" },
  types: [
    { type: "success", background: "#4f7cff", color: "#fff" },
    { type: "error", background: "#ff4d4f", color: "#fff" },
  ],
});

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = "/login";
    return;
  }

  const logoutBtn = document.querySelector(".logout");
  const userName = document.querySelector(".user-info strong");

  if (userName) userName.textContent = user ? user.name : "User";

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  });

  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.querySelector(".toggle-btn");

  toggleBtn?.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");

    const icon = toggleBtn.querySelector("svg");

    if (sidebar.classList.contains("collapsed")) {
      icon.setAttribute("data-lucide", "chevron-right");
    } else {
      icon.setAttribute("data-lucide", "chevron-left");
    }

    lucide.createIcons();
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

  initTabs();
  initTaskActions();
  initDeleteModal();
  initTaskModal();

  loadTasks();
});

/* ===============================
   TABS
================================ */

function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      applyActiveTabFilter();
      updateEmptyState();
    });
  });
}

/* ===============================
   ACCIONES DE TAREAS
================================ */

function initTaskActions() {
  /* COMPLETAR */
  document.addEventListener("click", async (e) => {
    const completeBtn = e.target.closest(".complete-btn");
    if (!completeBtn) return;

    const taskItem = completeBtn.closest(".task-item");
    const taskId = taskItem.dataset.id;

    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) throw new Error();

      taskItem.classList.add("completed");
      taskItem.classList.remove("overdue");

      applyActiveTabFilter();
      updateEmptyState();

      notyf.success("Tarea completada");
    } catch (error) {
      console.error(error);
      notyf.error("Error al actualizar estado");
    }
  });

  /* URGENTE */

  document.addEventListener("click", async (e) => {
    const urgentBtn = e.target.closest(".urgent-btn");
    if (!urgentBtn) return;

    const taskId = urgentBtn.dataset.id;

    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/urgent`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) throw new Error();

      urgentBtn.classList.toggle("active");
    } catch (error) {
      console.error(error);
      notyf.error("Error al marcar urgente");
    }
  });

  /* EDITAR */

  document.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".edit-task");
    if (!editBtn) return;

    closeAllDropdowns();

    const taskItem = editBtn.closest(".task-item");
    editingTask = taskItem;

    const taskModal = document.getElementById("taskModal");

    const title = taskItem.querySelector(".task-title")?.textContent.trim();

    const descriptionElement = taskItem.querySelector(".task-description");

    const descriptionText = descriptionElement
      ? descriptionElement.textContent.replace("•", "").trim()
      : "";

    const rawDate = taskItem.dataset.duedate;
    const subjectId = taskItem.dataset.subjectid;

    await loadSubjectsForSelect();

    document.getElementById("taskTitle").value = title || "";
    document.getElementById("taskDescription").value = descriptionText;

    const dateObj = new Date(rawDate);

    document.getElementById("taskDueDate").value = dateObj
      .toISOString()
      .split("T")[0];

    document.getElementById("taskDueTime").value = dateObj
      .toTimeString()
      .slice(0, 5);

    if (subjectSelect) subjectSelect.setValue(subjectId);

    taskModal.querySelector("h2").textContent = "Editar tarea";
    document.getElementById("saveTask").textContent = "Actualizar";

    taskModal.classList.add("active");
  });
}

/* ===============================
   MODAL ELIMINAR
================================ */

function initDeleteModal() {
  document.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".delete-task");
    if (!deleteBtn) return;

    closeAllDropdowns();

    taskToDelete = deleteBtn.closest(".task-item");

    document.getElementById("deleteModal").classList.add("active");
  });

  document.getElementById("cancelDelete")?.addEventListener("click", () => {
    document.getElementById("deleteModal").classList.remove("active");
    taskToDelete = null;
  });

  document
    .getElementById("confirmDelete")
    ?.addEventListener("click", async () => {
      if (!taskToDelete) return;

      const taskId = taskToDelete.dataset.id;

      try {
        const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (!res.ok) throw new Error();

        document.getElementById("deleteModal").classList.remove("active");

        loadTasks();

        notyf.success("Tarea eliminada");
      } catch (error) {
        console.error(error);
        notyf.error("Error al eliminar tarea");
      }
    });
}

/* ===============================
   MODAL CREAR
================================ */

function initTaskModal() {
  const taskModal = document.getElementById("taskModal");
  const openModalBtn = document.getElementById("openModal");
  const cancelTaskModal = document.getElementById("cancelTaskModal");

  openModalBtn.addEventListener("click", async () => {
    editingTask = null;

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("taskDueDate").min = today;

    await loadSubjectsForSelect();

    taskModal.querySelector("h2").textContent = "Nueva tarea";
    document.getElementById("saveTask").textContent = "Guardar";

    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDescription").value = "";
    document.getElementById("taskDueDate").value = "";
    document.getElementById("taskDueTime").value = "";

    if (subjectSelect) subjectSelect.clear();

    taskModal.classList.add("active");
  });

  cancelTaskModal.addEventListener("click", () => {
    editingTask = null;
    taskModal.classList.remove("active");
  });

  document.getElementById("saveTask").addEventListener("click", async () => {
    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const dueDate = document.getElementById("taskDueDate").value;
    const dueTime = document.getElementById("taskDueTime").value || "23:59";
    const subjectId = subjectSelect.getValue();

    if (!title || !dueDate || !subjectId) {
      notyf.error("Completa los campos obligatorios");
      return;
    }

    const fullDate = new Date(`${dueDate}T${dueTime}`).toISOString();

    try {
      let url = `${API_URL}/api/tasks`;
      let method = "POST";

      if (editingTask) {
        const taskId = editingTask.dataset.id;
        url = `${API_URL}/api/tasks/${taskId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title,
          description,
          dueDate: fullDate,
          subjectId,
        }),
      });

      if (!res.ok) throw new Error();

      taskModal.classList.remove("active");
      editingTask = null;

      loadTasks();

      notyf.success(
        method === "POST"
          ? "Tarea creada correctamente"
          : "Tarea actualizada correctamente",
      );
    } catch (error) {
      console.error(error);
      notyf.error("Error al guardar tarea");
    }
  });
}

/* ===============================
   CARGAR TAREAS
================================ */

async function loadTasks() {
  try {
    const res = await fetch(`${API_URL}/api/tasks`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    const tasks = await res.json();

    const container = document.getElementById("tasksContainer");
    container.innerHTML = "";

    tasks.forEach(addTaskToDOM);

    applyActiveTabFilter();
    updateEmptyState();
  } catch (error) {
    console.error("Error cargando tareas:", error);
  }
}

/* ===============================
   RENDER
================================ */

function addTaskToDOM(task) {
  const container = document.getElementById("tasksContainer");

  const formattedDate = new Date(task.dueDate).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const taskElement = document.createElement("div");

  taskElement.className = "task-item";

  taskElement.dataset.id = task.id;
  taskElement.dataset.duedate = task.dueDate;
  taskElement.dataset.description = task.description ?? "";
  taskElement.dataset.subjectid = task.subjectId;

  const now = Date.now();
  const dueDate = new Date(task.dueDate).getTime();

  const isOverdue = !task.completed && dueDate < now;

  if (isOverdue) taskElement.classList.add("overdue");
  if (task.completed) taskElement.classList.add("completed");

  let cleanTitle = task.title.replace("• Sin descripción", "").trim();

  taskElement.innerHTML = `
<div class="task-left">
<button class="complete-btn">
<i data-lucide="check"></i>
Completar
</button>
</div>

<div class="task-content">

<h3 class="task-title">
${cleanTitle}
</h3>

${
  task.description
    ? `<span class="task-description">• ${task.description}</span>`
    : `<span class="task-description">• Sin descripción</span>`
}

<div class="task-meta">

<span class="task-subject" style="--subject-color:${task.subject.color}">
${task.subject.name}
</span>

<span class="task-date">${formattedDate}</span>

</div>

</div>

<div class="task-actions">

<button class="urgent-btn ${task.urgent ? "active" : ""}" data-id="${task.id}">
<i data-lucide="flame"></i>
</button>

<div class="task-menu">
<i data-lucide="more-vertical"></i>

<div class="task-dropdown hidden">

<button class="edit-task ${isOverdue ? "disabled" : ""}">
<i data-lucide="pencil"></i>
Editar
</button>

<button class="delete-task">
<i data-lucide="trash-2"></i>
Eliminar
</button>

</div>
</div>
</div>
`;

  container.prepend(taskElement);

  lucide.createIcons();
}

/* ===============================
   FILTROS
================================ */

function applyActiveTabFilter() {
  const activeTab = document.querySelector(".tab-btn.active").dataset.tab;

  document.querySelectorAll(".task-item").forEach((task) => {
    const isCompleted = task.classList.contains("completed");
    const isOverdue = task.classList.contains("overdue");

    const completeBtn = task.querySelector(".complete-btn");
    const urgentBtn = task.querySelector(".urgent-btn");
    const editBtn = task.querySelector(".edit-task");

    /* FILTRO DE TAREAS */

    if (activeTab === "pending") {
      task.style.display = !isCompleted && !isOverdue ? "flex" : "none";
    }

    if (activeTab === "completed") {
      task.style.display = isCompleted ? "flex" : "none";
    }

    if (activeTab === "defeated") {
      task.style.display = isOverdue ? "flex" : "none";
    }

    /* CONTROL DE BOTONES */

    if (activeTab === "completed") {
      if (completeBtn) completeBtn.style.display = "none";
      if (urgentBtn) urgentBtn.style.display = "none";
      if (editBtn) editBtn.style.display = "none";
    }

    if (activeTab === "defeated") {
      if (completeBtn) completeBtn.style.display = "inline-flex";
      if (urgentBtn) urgentBtn.style.display = "none";
      if (editBtn) editBtn.style.display = "none";
    }

    if (activeTab === "pending") {
      if (completeBtn) completeBtn.style.display = "inline-flex";
      if (urgentBtn) urgentBtn.style.display = "inline-flex";
      if (editBtn) editBtn.style.display = "flex";
    }
  });
}

/* ===============================
   EMPTY STATE
================================ */

function updateEmptyState() {
  const emptyState = document.getElementById("emptyState");
  if (!emptyState) return;

  const activeTab = document.querySelector(".tab-btn.active").dataset.tab;

  const title = emptyState.querySelector("h2");
  const text = emptyState.querySelector("p");

  let visibleCount = 0;

  document.querySelectorAll(".task-item").forEach((task) => {
    if (task.style.display !== "none") visibleCount++;
  });

  if (visibleCount === 0) {
    emptyState.style.display = "flex";

    if (activeTab === "pending") {
      title.textContent = "No hay tareas pendientes";
      text.textContent = "Crea tu primera tarea y comienza a organizar tu día";
    }

    if (activeTab === "completed") {
      title.textContent = "No hay tareas completadas";
      text.textContent = "Cuando completes tareas aparecerán aquí";
    }

    if (activeTab === "defeated") {
      title.textContent = "No hay tareas vencidas";
      text.textContent = "¡Vas al día con todas tus tareas!";
    }
  } else {
    emptyState.style.display = "none";
  }
}

/* ===============================
   DROPDOWN
================================ */

document.addEventListener("click", (e) => {
  const menuBtn = e.target.closest(".task-menu");

  document
    .querySelectorAll(".task-dropdown")
    .forEach((d) => d.classList.add("hidden"));

  if (menuBtn) {
    const dropdown = menuBtn.querySelector(".task-dropdown");
    dropdown.classList.toggle("hidden");
  }
});

function closeAllDropdowns() {
  document
    .querySelectorAll(".task-dropdown")
    .forEach((d) => d.classList.add("hidden"));
}

/* ===============================
   CARGAR MATERIAS
================================ */

async function loadSubjectsForSelect() {
  const res = await fetch(`${API_URL}/api/subjects`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const subjects = await res.json();

  const select = document.getElementById("taskSubject");

  select.innerHTML = `<option value="">Selecciona una materia</option>`;

  subjects.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.name;
    select.appendChild(option);
  });

  if (subjectSelect) subjectSelect.destroy();

  subjectSelect = new TomSelect("#taskSubject", {
    create: false,
    searchField: [],
  });
}
