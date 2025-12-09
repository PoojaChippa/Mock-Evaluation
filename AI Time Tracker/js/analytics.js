// js/analytics.js

let categoryChart = null;
let activityChart = null;

export function initAnalytics() {
  // Nothing heavy here yet – ready for future extensions if needed.
}

/**
 * Render all analytics based on activities for a selected date.
 * @param {Array<{id:string, name:string, category:string, duration:number}>} activities
 * @param {string} date
 */
export function renderAnalytics(activities, date) {
  const summaryTextEl = document.getElementById("summary-text");
  const categoryListEl = document.getElementById("category-list");
  const noDataCard = document.getElementById("no-data-state");
  const analyticsContent = document.getElementById("analytics-content");

  // If there are no activities, show "No data" state (toggle handled in activities.js)
  if (!activities || activities.length === 0) {
    // Destroy charts if they exist
    if (categoryChart) {
      categoryChart.destroy();
      categoryChart = null;
    }
    if (activityChart) {
      activityChart.destroy();
      activityChart = null;
    }
    summaryTextEl.textContent = "";
    categoryListEl.innerHTML = "";
    return;
  }

  const totalMinutes = activities.reduce(
    (sum, a) => sum + (a.duration || 0),
    0
  );
  const totalHours = (totalMinutes / 60).toFixed(2);

  summaryTextEl.textContent = `You logged ${totalMinutes} minutes (${totalHours} hours) across ${
    activities.length
  } activit${activities.length === 1 ? "y" : "ies"} on ${date}.`;

  // Group by category
  const categoryMap = {};
  activities.forEach((a) => {
    const key = a.category || "Other";
    categoryMap[key] = (categoryMap[key] || 0) + (a.duration || 0);
  });

  const categoryNames = Object.keys(categoryMap);
  const categoryMinutes = categoryNames.map((c) => categoryMap[c]);

  // Render category list
  categoryListEl.innerHTML = "";
  categoryNames.forEach((cat, i) => {
    const li = document.createElement("li");
    const nameSpan = document.createElement("span");
    const valueSpan = document.createElement("span");
    nameSpan.textContent = cat;
    valueSpan.textContent = `${categoryMinutes[i]} min`;
    li.appendChild(nameSpan);
    li.appendChild(valueSpan);
    categoryListEl.appendChild(li);
  });

  // Show analytics content, hide no-data (also handled in activities.js)
  noDataCard.classList.add("hidden");
  analyticsContent.classList.remove("hidden");

  // ----- Charts -----
  const categoryCtx = document.getElementById("categoryChart");
  const activityCtx = document.getElementById("activityChart");

  // Destroy previous instances if needed
  if (categoryChart) categoryChart.destroy();
  if (activityChart) activityChart.destroy();

  // Pie chart: time per category
  categoryChart = new Chart(categoryCtx, {
    type: "pie",
    data: {
      labels: categoryNames,
      datasets: [
        {
          data: categoryMinutes,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb",
            font: {
              size: 11,
            },
          },
        },
      },
    },
  });

  // Bar chart: each activity
  const activityLabels = activities.map((a) => a.name);
  const activityDurations = activities.map((a) => a.duration);

  activityChart = new Chart(activityCtx, {
    type: "bar",
    data: {
      labels: activityLabels,
      datasets: [
        {
          data: activityDurations,
        },
      ],
    },
    options: {
      indexAxis: "y",
      scales: {
        x: {
          ticks: {
            color: "#e5e7eb",
            font: {
              size: 10,
            },
          },
          grid: {
            color: "rgba(55, 65, 81, 0.5)",
          },
        },
        y: {
          ticks: {
            color: "#e5e7eb",
            font: {
              size: 10,
            },
          },
          grid: {
            color: "rgba(55, 65, 81, 0.4)",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}
