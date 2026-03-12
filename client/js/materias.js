let selectedColor = "#007bff";
let editingSubjectId = null;
let subjectToDelete = null;

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
  loadSubjects();

  const toogleBtn = document.getElementById("toggleSidebar");
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main");
  const token = getToken();
  const logoutBtn = document.querySelector(".logout");
  const user = getUser();
  const userName = document.querySelector(".user-info strong");
  const modal = document.getElementById("subjectModal");
  const openModalBtn = document.getElementById("openModal");
  const cancelModalBtn = document.getElementById("cancelModal");

  userName.textContent = user ? user.name : "User";

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/pages/login";
  });

  if (!token || !user) {
    window.location.href = "/pages/login";
    return;
  }

  openModalBtn.addEventListener("click", () => {
    modal.classList.add("active");
  });

  cancelModalBtn.addEventListener("click", () => {
    modal.classList.remove("active");
    resetModal();
  });

  document.querySelectorAll(".color-circle").forEach((circle) => {
    circle.addEventListener("click", () => {
      // quitar selección anterior
      document
        .querySelectorAll(".color-circle")
        .forEach((c) => c.classList.remove("selected"));

      // marcar el actual
      circle.classList.add("selected");

      // actualizar variable global
      selectedColor = circle.dataset.color;
    });
  });

  // BORRAR MATERIA
  document
    .getElementById("confirmDelete")
    .addEventListener("click", async () => {
      if (!subjectToDelete) return;

      try {
        const res = await fetch(`/api/subjects/${subjectToDelete}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message);
        }

        notyf.success("Materia eliminada correctamente");

        document.getElementById("deleteModal").classList.remove("active");
        subjectToDelete = null;

        loadSubjects();
      } catch (error) {
        notyf.error(error.message || "Error al eliminar la materia");
      }
    });

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
});

document.addEventListener("click", (e) => {
  const menuBtn = e.target.closest(".subject-menu");
  const dropdowns = document.querySelectorAll(".subject-dropdown");

  dropdowns.forEach((d) => d.classList.add("hidden"));

  if (menuBtn) {
    const card = menuBtn.closest(".subject-card");
    const dropdown = card.querySelector(".subject-dropdown");
    dropdown.classList.toggle("hidden");
  }
});

// MODAL EDITAR
document.addEventListener("click", (e) => {
  const editBtn = e.target.closest(".edit-subject");
  if (!editBtn) return;

  const card = editBtn.closest(".subject-card");

  const subjectId = card.dataset.id;
  const subjectName = card.querySelector("h3").textContent;
  const subjectColor = card.style.getPropertyValue("--subject-color");

  editingSubjectId = subjectId;

  document.getElementById("modalTitle").textContent = "Editar materia";
  document.getElementById("saveSubject").textContent = "Actualizar";

  document.getElementById("subjectName").value = subjectName;

  selectedColor = subjectColor || "#007bff";

  document.querySelectorAll(".color-circle").forEach((c) => {
    c.classList.remove("selected");
    if (c.dataset.color === selectedColor) {
      c.classList.add("selected");
    }
  });

  document.getElementById("subjectModal").classList.add("active");
});

// MODAL CREAR MATERIA
document.getElementById("saveSubject").addEventListener("click", async () => {
  const name = document.getElementById("subjectName").value.trim();

  if (!name) {
    notyf.error("El nombre no puede estar vacío");
    return;
  }

  if (editingSubjectId) {
    // 🔥 MODO EDITAR
    await fetch(`/api/subjects/${editingSubjectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ name, color: selectedColor }),
    });
    resetModal();
  } else {
    // 🔥 MODO CREAR
    await fetch("/api/subjects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ name, color: selectedColor }),
    });
    resetModal();
  }

  document.getElementById("subjectModal").classList.remove("active");

  loadSubjects(); // recargar materias
});

// RESETAR MODAL
function resetModal() {
  editingSubjectId = null;
  selectedColor = "#007bff";

  document.getElementById("subjectName").value = "";
  document.getElementById("modalTitle").textContent = "Nueva materia";
  document.getElementById("saveSubject").textContent = "Guardar";

  document
    .querySelectorAll(".color-circle")
    .forEach((c) => c.classList.remove("selected"));
  document.querySelector('[data-color="#007bff"]').classList.add("selected");
}

async function loadSubjects() {
  const token = getToken();
  const emptyState = document.getElementById("emptyState");
  const container = document.getElementById("subjectsContainer");

  const res = await fetch("/api/subjects", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const subjects = await res.json();

  container.innerHTML = ""; // limpiar antes de renderizar

  if (subjects.length === 0) {
    emptyState.style.display = "flex";
    container.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  container.style.display = "grid";

  subjects.forEach((subject) => {
    const card = document.createElement("div");
    card.className = "subject-card";
    card.dataset.id = subject.id;

    // aplicar color dinámico
    card.style.setProperty("--subject-color", subject.color);

    card.innerHTML = `
      <div class="subject-card-top">
        <div class="subject-icon">
          <i data-lucide="book-open"></i>
        </div>

        <div class="subject-menu">
          <i data-lucide="more-vertical"></i>
        </div>

        <div class="subject-dropdown hidden">
          <button class="edit-subject">
            <i data-lucide="pencil"></i>
            Editar
          </button>
          <button class="delete-subject">
              <i data-lucide="trash-2"></i>
              Eliminar
          </button>
        </div>
      </div>

      <div class="subject-info">
        <h3>${subject.name}</h3>
        <p>${subject._count.tasks} tarea(s) pendiente(s)</p>
      </div>

      <div class="subject-footer">
        <span>Creada recientemente</span>
      </div>
    `;

    container.appendChild(card);
  });

  lucide.createIcons(); // volver a activar iconos
}

// MODAL DELETE MATERIA
document.addEventListener("click", (e) => {
  const deleteBtn = e.target.closest(".delete-subject");
  if (!deleteBtn) return;

  const card = deleteBtn.closest(".subject-card");
  subjectToDelete = card.dataset.id;

  document.getElementById("deleteModal").classList.add("active");
});

document.getElementById("cancelDelete").addEventListener("click", () => {
  subjectToDelete = null;
  document.getElementById("deleteModal").classList.remove("active");
});
