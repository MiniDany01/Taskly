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

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://taskly-c6ba.onrender.com";

function tooglePassword() {
  const passwordInput = document.getElementById("password");
  const eyeIcon = document.querySelector(".eye-icon");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off-icon lucide-eye-off"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>`;
  } else {
    passwordInput.type = "password";
    eyeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const eyeIcon = document.querySelector(".eye-icon");
  eyeIcon.addEventListener("click", tooglePassword);

  document.querySelector(".form-box").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const rememberMe = document.getElementById("remember-me-checkbox").checked;

    if (!email || !password) {
      return notyf.error("Todos los campos son obligatorios");
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return notyf.error(data.message || "Error al iniciar sesión");
      }

      if (rememberMe) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }

      notyf.success("Inicio de sesión exitoso");
      // email.value = ""
      // password.value = ""

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error) {
      notyf.error("Error al conectar con el servidor");
    }
  });
});
