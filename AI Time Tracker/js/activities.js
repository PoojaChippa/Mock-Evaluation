// js/activities.js
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

import { auth, db } from "./firebaseConfig.js";
import { renderAnalytics } from "./analytics.js";

let currentDate = null;
let currentUser = null;
let activities = []; // local cache [{ id, name, category, duration }]
let editingActivityId = null;

const MAX_MINUTES = 1440;

export function initActivities() {
  const datePicker = document.getElementById("date-picker");
  const activityForm = document.getElementById("activity-form");
  const activityName = document.getElementById("activity-name");
  const activityCategory = document.getElementById("activity-category");
  const activityDuration = document.getElementById("activity-duration");
  const activityError = document.getElementById("activity-error");
  const activitySubmitBtn = document.getElementById("activity-submit-btn");
  const activityList = document.getElementById("activity-list");
  const analyseBtn = document.getElementById("analyse-btn");
  const noDataCta = document.getElementById("no-data-cta");

  const totalMinutesEl = document.getElementById("total-minutes");
  const remainingMinutesEl = document.getElementById("remaining-minutes");
  const activityCountEl = document.getElementById("activity-count");
  const analyticsDateLabel = document.getElementById("analytics-date-label");

  // Helper: get today's date in YYYY-MM-DD
  const todayStr = () => {
    const d = new Date();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  };

  // Initialize date picker with today's date
  currentDate = todayStr();
  datePicker.value = currentDate;
  analyticsDateLabel.textContent = currentDate;

  // Watch auth to know user ID for Firestore
  const unsub = auth.onAuthStateChanged((user) => {
    if (!user) return;
    currentUser = user;
    loadActivitiesForDate(currentDate);
  });

  datePicker.addEventListener("change", () => {
    currentDate = datePicker.value;
    analyticsDateLabel.textContent = currentDate || "";
    if (currentUser && currentDate) {
      loadActivitiesForDate(currentDate);
    }
  });

  // Form submit: add or update activity
  activityForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser || !currentDate) return;

    activityError.textContent = "";

    const name = activityName.value.trim();
    const category = activityCategory.value || "Other";
    const duration = Number(activityDuration.value);

    if (!name || !duration || duration <= 0) {
      activityError.textContent =
        "Activity name and positive minutes are required.";
      return;
    }

    // Check 1440 rule
    const total = calculateTotalMinutes();
    if (!editingActivityId) {
      // Adding new activity
      if (total + duration > MAX_MINUTES) {
        activityError.textContent = `Total minutes cannot exceed ${MAX_MINUTES}. You have ${
          MAX_MINUTES - total
        } minutes left.`;
        return;
      }
    } else {
      // Editing existing: replace old duration
      const existing = activities.find((a) => a.id === editingActivityId);
      const totalWithoutOld = total - (existing ? existing.duration : 0);
      if (totalWithoutOld + duration > MAX_MINUTES) {
        activityError.textContent = `Total minutes cannot exceed ${MAX_MINUTES}. You have ${
          MAX_MINUTES - totalWithoutOld
        } minutes left.`;
        return;
      }
    }

    activitySubmitBtn.disabled = true;
    activitySubmitBtn.textContent = editingActivityId
      ? "Updating..."
      : "Adding...";

    try {
      if (!editingActivityId) {
        // Create
        const colRef = collection(
          db,
          "users",
          currentUser.uid,
          "days",
          currentDate,
          "activities"
        );
        const docRef = await addDoc(colRef, {
          name,
          category,
          duration,
          createdAt: serverTimestamp(),
        });
        activities.push({
          id: docRef.id,
          name,
          category,
          duration,
        });
      } else {
        // Update
        const docRef = doc(
          db,
          "users",
          currentUser.uid,
          "days",
          currentDate,
          "activities",
          editingActivityId
        );
        await updateDoc(docRef, { name, category, duration });

        const idx = activities.findIndex((a) => a.id === editingActivityId);
        if (idx !== -1) {
          activities[idx] = { ...activities[idx], name, category, duration };
        }
      }

      // Reset form
      editingActivityId = null;
      activitySubmitBtn.textContent = "Add Activity";
      activitySubmitBtn.disabled = false;
      activityForm.reset();
      activityCategory.value = "Work";

      renderActivityTable();
      updateSummary();
      renderAnalytics(activities, currentDate);
    } catch (err) {
      console.error(err);
      activityError.textContent = "Failed to save activity.";
      activitySubmitBtn.disabled = false;
      activitySubmitBtn.textContent = editingActivityId
        ? "Update Activity"
        : "Add Activity";
    }
  });

  // "Analyse" button scrolls to analytics section
  analyseBtn.addEventListener("click", () => {
    const analyticsSection = document.getElementById("analytics-section");
    if (analyticsSection) {
      analyticsSection.scrollIntoView({ behavior: "smooth" });
    }
  });

  // No-data CTA scrolls back to form
  noDataCta.addEventListener("click", () => {
    activityName.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Helpers

  function calculateTotalMinutes() {
    return activities.reduce((sum, a) => sum + (a.duration || 0), 0);
  }

  function updateSummary() {
    const total = calculateTotalMinutes();
    const remaining = Math.max(0, MAX_MINUTES - total);
    const count = activities.length;

    totalMinutesEl.textContent = total;
    remainingMinutesEl.textContent = remaining;
    activityCountEl.textContent = count;

    const analyseBtn = document.getElementById("analyse-btn");
    analyseBtn.disabled = count === 0;

    const noDataCard = document.getElementById("no-data-state");
    const analyticsContent = document.getElementById("analytics-content");

    if (count === 0) {
      noDataCard.classList.remove("hidden");
      analyticsContent.classList.add("hidden");
    } else {
      noDataCard.classList.add("hidden");
      analyticsContent.classList.remove("hidden");
    }
  }

  function renderActivityTable() {
    activityList.innerHTML = "";

    if (activities.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.textContent = "No activities logged for this date.";
      cell.style.textAlign = "center";
      cell.style.color = "#9ca3af";
      row.appendChild(cell);
      activityList.appendChild(row);
      return;
    }

    activities.forEach((activity) => {
      const tr = document.createElement("tr");

      const nameTd = document.createElement("td");
      nameTd.textContent = activity.name;

      const catTd = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = activity.category;
      catTd.appendChild(badge);

      const durTd = document.createElement("td");
      durTd.textContent = `${activity.duration} min`;

      const actionsTd = document.createElement("td");
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "table-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn-ghost-small";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        editingActivityId = activity.id;
        activityName.value = activity.name;
        activityCategory.value = activity.category;
        activityDuration.value = activity.duration;
        activitySubmitBtn.textContent = "Update Activity";
        activityName.focus();
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-ghost-small";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => handleDelete(activity.id));

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);
      actionsTd.appendChild(actionsDiv);

      tr.appendChild(nameTd);
      tr.appendChild(catTd);
      tr.appendChild(durTd);
      tr.appendChild(actionsTd);

      activityList.appendChild(tr);
    });
  }

  async function handleDelete(id) {
    if (!currentUser || !currentDate) return;
    const confirmDelete = confirm("Delete this activity?");
    if (!confirmDelete) return;

    try {
      const docRef = doc(
        db,
        "users",
        currentUser.uid,
        "days",
        currentDate,
        "activities",
        id
      );
      await deleteDoc(docRef);
      activities = activities.filter((a) => a.id !== id);
      renderActivityTable();
      updateSummary();
      renderAnalytics(activities, currentDate);
    } catch (err) {
      console.error(err);
      alert("Failed to delete activity.");
    }
  }

  async function loadActivitiesForDate(date) {
    if (!currentUser || !date) return;

    const colRef = collection(
      db,
      "users",
      currentUser.uid,
      "days",
      date,
      "activities"
    );

    const q = query(colRef, orderBy("createdAt", "asc"));
    const snap = await getDocs(q);

    activities = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      activities.push({
        id: docSnap.id,
        name: data.name,
        category: data.category,
        duration: data.duration,
      });
    });

    editingActivityId = null;
    activitySubmitBtn.textContent = "Add Activity";
    renderActivityTable();
    updateSummary();
    renderAnalytics(activities, currentDate);
  }
}
