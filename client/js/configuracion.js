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

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  loadProfile();

  const toggleBtn = document.getElementById("toggleSidebar");
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main");
  const logoutBtn = document.querySelector(".logout");
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const userName = document.querySelector(".user-info strong");

  const toggle2FA = document.getElementById("toggle2FA");
  const modal = document.getElementById("twofaModal");
  const qrImage = document.getElementById("qrImage");
  const verifyBtn = document.getElementById("verify2FA");
  const closeBtn = document.getElementById("close2FA");

  if (!token || !user) {
    window.location.href = "/pages/login";
    return;
  }

  userName.textContent = user.name;

  /* =========================
     SIDEBAR
  ========================= */
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

  /* =========================
     LOGOUT
  ========================= */
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/pages/login";
  });

  document
    .getElementById("saveNotifications")
    .addEventListener("click", async () => {
      const reminder = document.getElementById("taskReminder").value;

      const res = await fetch("/api/users/reminder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          taskReminder: reminder === "" ? null : parseInt(reminder),
        }),
      });

      if (res.ok) {
        notyf.success("Preferencias guardadas");
      }
    });

  /* =========================
     CAMBIAR CONTRASEÑA
  ========================= */
  document
    .getElementById("changePassword")
    .addEventListener("click", async () => {
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      try {
        const res = await fetch("/api/users/me/password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";

        notyf.success("Contraseña actualizada correctamente");
      } catch (error) {
        notyf.error(error.message || "Error al cambiar contraseña");
      }
    });

  /* =========================
     ACTUALIZAR NOMBRE
  ========================= */
  document.getElementById("saveProfile").addEventListener("click", async () => {
    const name = document.getElementById("profileName").value.trim();

    if (!name) {
      notyf.error("El nombre no puede estar vacío");
      return;
    }

    try {
      const res = await fetch("/api/users/me/name", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const updatedUser = await res.json();
      if (!res.ok) throw new Error(updatedUser.message);

      document.querySelector(".user-info strong").textContent =
        updatedUser.name;

      const storedUser = JSON.parse(localStorage.getItem("user"));
      storedUser.name = updatedUser.name;
      localStorage.setItem("user", JSON.stringify(storedUser));

      notyf.success("Nombre actualizado correctamente");
    } catch (error) {
      notyf.error("Error al actualizar nombre");
    }
  });

  /* =========================
     GENERAR QR 2FA
  ========================= */
  toggle2FA.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/users/me/2fa/setup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      qrImage.src = data.qrCode;
      modal.classList.add("active");
    } catch {
      notyf.error("Error generando 2FA");
    }
  });

  /* =========================
     VERIFICAR 2FA
  ========================= */
  verifyBtn.addEventListener("click", async () => {
    const code = document.getElementById("twofaCodeInput").value.trim();

    if (!code) {
      notyf.error("Ingresa el código");
      return;
    }

    try {
      const res = await fetch("/api/users/me/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      notyf.success("2FA activado correctamente");
      modal.classList.remove("active");

      activate2FAUI();
    } catch (error) {
      notyf.error(error.message || "Código inválido");
    }
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  const mobileBtn = document.getElementById("mobileMenuBtn");

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

  setupPasswordToggles();
  loadUserData();
});

/* =========================
   CARGAR DATOS USUARIO
========================= */
async function loadUserData() {
  try {
    const res = await fetch("/api/users/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const user = await res.json();
    if (!res.ok) throw new Error();

    document.getElementById("profileName").value = user.name;
    document.getElementById("profileEmail").value = user.email;

    const formattedDate = new Date(user.createdAt).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    document.getElementById("profileCreatedAt").value = formattedDate;

    if (user.twoFactorEnabled) {
      activate2FAUI();
    }
  } catch (error) {
    console.error("Error cargando usuario:", error);
  }
}

/* =========================
   ACTIVAR UI VERDE 2FA
========================= */
function activate2FAUI() {
  const statusBox = document.getElementById("twofaStatus");
  const badge = statusBox.querySelector(".status-badge");
  const message = statusBox.querySelector("p");
  const toggle2FA = document.getElementById("toggle2FA");

  statusBox.classList.add("active");

  badge.textContent = "Activado";
  badge.classList.remove("inactive");
  badge.classList.add("active");

  message.textContent =
    "La verificación en dos pasos está activa y protege tu cuenta contra accesos no autorizados.";

  toggle2FA.style.display = "none";
}

/* =========================
   TOGGLE PASSWORD
========================= */
function setupPasswordToggles() {
  document.querySelectorAll(".password-wrapper").forEach((wrapper) => {
    const input = wrapper.querySelector("input");
    const icon = wrapper.querySelector(".toggle-password");

    icon.addEventListener("click", () => {
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";

      icon.innerHTML = hidden
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19
            10.94 10.94 0 0 1 2.06 12
            10.94 10.94 0 0 1 4.22 7.22"/>
            <path d="M1 1l22 22"/>
          </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.062 12.348a1 1 0 0 1 0-.696
            10.75 10.75 0 0 1 19.876 0
            1 1 0 0 1 0 .696
            10.75 10.75 0 0 1-19.876 0"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>`;
    });
  });
}

async function loadProfile() {
  const res = await fetch("/api/users/me", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const user = await res.json();

  document.getElementById("profileName").value = user.name;
  document.getElementById("profileEmail").value = user.email;

  const reminderSelect = document.getElementById("taskReminder");

  if (user.taskReminder === null) {
    reminderSelect.value = "";
  } else {
    reminderSelect.value = user.taskReminder.toString();
  }
}
