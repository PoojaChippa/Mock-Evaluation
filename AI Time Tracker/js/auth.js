// js/auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

import { auth, googleProvider } from "./firebaseConfig.js";

// Helper: map Firebase error codes to friendly messages
function getAuthErrorMessage(err, mode) {
  if (!err || !err.code) return "Authentication failed. Please try again.";

  switch (err.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Invalid email or password. Double-check your credentials.";

    case "auth/user-not-found":
      return mode === "login"
        ? "No account found with this email. Try signing up first."
        : "User not found.";

    case "auth/email-already-in-use":
      return mode === "signup"
        ? "This email is already registered. Try logging in instead."
        : "Email already in use.";

    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";

    case "auth/invalid-email":
      return "The email address is not valid.";

    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in Firebase Console.";

    case "auth/popup-blocked":
      return "Popup was blocked by the browser. Allow popups and try again.";

    case "auth/popup-closed-by-user":
      return "Google sign-in popup was closed before completing. Try again.";

    default:
      return `${err.code}: ${err.message || "Authentication failed."}`;
  }
}

/**
 * Auth logic for index.html (login/signup + redirect if already logged in)
 */
export function initAuthForIndex() {
  const authForm = document.getElementById("auth-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const authError = document.getElementById("auth-error");
  const submitBtn = document.getElementById("submit-btn");
  const googleBtn = document.getElementById("google-btn");
  const tabButtons = document.querySelectorAll(".tab-button");

  let mode = "login"; // 'login' or 'signup'

  // Switch Login / Signup tabs
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      mode = btn.dataset.mode;
      submitBtn.textContent = mode === "login" ? "Login" : "Sign up";
      authError.textContent = "";
    });
  });

  // Email/password submit (single, clean handler)
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authError.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      authError.textContent = "Email and password are required.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent =
      mode === "login" ? "Logging in..." : "Creating account...";

    try {
      if (mode === "login") {
        // Login existing user
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Sign up new user
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // onAuthStateChanged below will handle redirect to app.html
    } catch (err) {
      console.error("Auth error (form submit):", err.code, err.message);
      authError.textContent = getAuthErrorMessage(err, mode);
      submitBtn.disabled = false;
      submitBtn.textContent = mode === "login" ? "Login" : "Sign up";
    }
  });

  // Google Sign-In (no weird extra form handler)
  googleBtn.addEventListener("click", async () => {
    authError.textContent = "";
    googleBtn.disabled = true;
    googleBtn.textContent = "Connecting...";

    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged below will handle redirect to app.html
    } catch (err) {
      console.error("Google sign-in error:", err.code, err.message);
      authError.textContent = getAuthErrorMessage(err, "login");
      googleBtn.disabled = false;
      googleBtn.textContent = "🔐 Continue with Google";
    }
  });

  // If already logged in, go to app.html
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is logged in → go to dashboard
      window.location.href = "app.html";
    }
  });
}

/**
 * Auth logic for app.html (protect page + show user + logout)
 */
export function initAuthForApp() {
  const userEmailEl = document.getElementById("user-email");
  const logoutBtn = document.getElementById("logout-btn");

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Not logged in → back to login
      window.location.href = "index.html";
      return;
    }
    userEmailEl.textContent = user.email || "Signed in";
  });

  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}
