const STORAGE_KEY = "finditLostFoundReports";

function getReports() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalize(text)
    .split(" ")
    .filter(word => word.length > 2);
}

function scrollToForm() {
  document.getElementById("reportForm").scrollIntoView({
    behavior: "smooth"
  });
}

function addReport() {
  const type = document.getElementById("type").value;
  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value;
  const location = document.getElementById("location").value.trim();
  const date = document.getElementById("date").value;
  const contact = document.getElementById("contact").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!title || !location || !date || !contact || !description) {
    alert("Please fill in all fields before submitting.");
    return;
  }

  const reports = getReports();

  const newReport = {
    id: Date.now(),
    type,
    title,
    category,
    location,
    date,
    contact,
    description,
    status: "Open",
    createdAt: new Date().toISOString()
  };

  reports.unshift(newReport);
  saveReports(reports);

  document.getElementById("title").value = "";
  document.getElementById("location").value = "";
  document.getElementById("date").value = "";
  document.getElementById("contact").value = "";
  document.getElementById("description").value = "";

  renderApp();
}

function deleteReport(id) {
  const confirmed = confirm("Delete this report?");

  if (!confirmed) return;

  const reports = getReports().filter(report => report.id !== id);
  saveReports(reports);
  renderApp();
}

function toggleStatus(id) {
  const reports = getReports().map(report => {
    if (report.id === id) {
      return {
        ...report,
        status: report.status === "Open" ? "Resolved" : "Open"
      };
    }

    return report;
  });

  saveReports(reports);
  renderApp();
}

function calculateMatchScore(lostItem, foundItem) {
  let score = 0;
  const reasons = [];

  if (lostItem.category === foundItem.category) {
    score += 35;
    reasons.push("Same category");
  }

  const lostTitleTokens = tokenize(lostItem.title);
  const foundTitleTokens = tokenize(foundItem.title);
  const titleMatches = lostTitleTokens.filter(word => foundTitleTokens.includes(word));

  if (titleMatches.length > 0) {
    score += Math.min(25, titleMatches.length * 12);
    reasons.push(`Similar item name: ${titleMatches.join(", ")}`);
  }

  const lostLocationTokens = tokenize(lostItem.location);
  const foundLocationTokens = tokenize(foundItem.location);
  const locationMatches = lostLocationTokens.filter(word => foundLocationTokens.includes(word));

  if (locationMatches.length > 0) {
    score += 15;
    reasons.push("Similar location");
  }

  const lostDescriptionTokens = tokenize(lostItem.description);
  const foundDescriptionTokens = tokenize(foundItem.description);
  const descriptionMatches = lostDescriptionTokens.filter(word => foundDescriptionTokens.includes(word));

  if (descriptionMatches.length > 0) {
    score += Math.min(25, descriptionMatches.length * 5);
    reasons.push(`Matching keywords: ${descriptionMatches.slice(0, 5).join(", ")}`);
  }

  if (lostItem.date && foundItem.date) {
    const lostDate = new Date(lostItem.date);
    const foundDate = new Date(foundItem.date);
    const daysDifference = Math.abs((foundDate - lostDate) / (1000 * 60 * 60 * 24));

    if (daysDifference <= 3) {
      score += 10;
      reasons.push("Close date range");
    }
  }

  return {
    score: Math.min(score, 100),
    reasons
  };
}

function getMatches(reports) {
  const lostItems = reports.filter(report => report.type === "Lost" && report.status === "Open");
  const foundItems = reports.filter(report => report.type === "Found" && report.status === "Open");

  const matches = [];

  lostItems.forEach(lostItem => {
    foundItems.forEach(foundItem => {
      const result = calculateMatchScore(lostItem, foundItem);

      if (result.score >= 35) {
        matches.push({
          lostItem,
          foundItem,
          score: result.score,
          reasons: result.reasons
        });
      }
    });
  });

  return matches.sort((a, b) => b.score - a.score);
}

function renderStats(reports, matches) {
  const lostCount = reports.filter(report => report.type === "Lost").length;
  const foundCount = reports.filter(report => report.type === "Found").length;

  document.getElementById("totalReports").textContent = reports.length;
  document.getElementById("lostCount").textContent = lostCount;
  document.getElementById("foundCount").textContent = foundCount;
  document.getElementById("matchCount").textContent = matches.length;
}

function renderMatches(matches) {
  const box = document.getElementById("matchesList");

  if (matches.length === 0) {
    box.innerHTML = `
      <div class="empty">
        No possible matches yet. Add both lost and found reports to generate suggestions.
      </div>
    `;
    return;
  }

  box.innerHTML = matches
    .map(match => `
      <div class="match-card">
        <div class="score">${match.score}% Match</div>

        <p class="muted">
          ${match.reasons.length ? match.reasons.join(" • ") : "General similarity detected"}
        </p>

        <div class="match-grid">
          <div class="mini-card">
            <span class="badge lost">Lost</span>
            <h3>${match.lostItem.title}</h3>
            <p><strong>Category:</strong> ${match.lostItem.category}</p>
            <p><strong>Location:</strong> ${match.lostItem.location}</p>
            <p><strong>Date:</strong> ${match.lostItem.date}</p>
            <p><strong>Contact:</strong> ${match.lostItem.contact}</p>
          </div>

          <div class="mini-card">
            <span class="badge found">Found</span>
            <h3>${match.foundItem.title}</h3>
            <p><strong>Category:</strong> ${match.foundItem.category}</p>
            <p><strong>Location:</strong> ${match.foundItem.location}</p>
            <p><strong>Date:</strong> ${match.foundItem.date}</p>
            <p><strong>Contact:</strong> ${match.foundItem.contact}</p>
          </div>
        </div>
      </div>
    `)
    .join("");
}

function renderReports(reports) {
  const list = document.getElementById("reportsList");
  const search = normalize(document.getElementById("searchInput").value);
  const filterType = document.getElementById("filterType").value;
  const filterCategory = document.getElementById("filterCategory").value;

  let filtered = reports;

  if (filterType !== "All") {
    filtered = filtered.filter(report => report.type === filterType);
  }

  if (filterCategory !== "All") {
    filtered = filtered.filter(report => report.category === filterCategory);
  }

  if (search) {
    filtered = filtered.filter(report => {
      const combined = normalize(`${report.title} ${report.category} ${report.location} ${report.description} ${report.contact}`);
      return combined.includes(search);
    });
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty">No reports found.</div>`;
    return;
  }

  list.innerHTML = filtered
    .map(report => `
      <div class="report-card ${report.type.toLowerCase()}">
        <span class="badge ${report.type.toLowerCase()}">${report.type}</span>
        <span class="badge category">${report.category}</span>
        <span class="badge status">${report.status}</span>

        <h3>${report.title}</h3>

        <p><strong>Location:</strong> ${report.location}</p>
        <p><strong>Date:</strong> ${report.date}</p>
        <p><strong>Contact:</strong> ${report.contact}</p>
        <p>${report.description}</p>

        <div class="action-row">
          <button class="dark" onclick="toggleStatus(${report.id})">
            ${report.status === "Open" ? "Mark Resolved" : "Reopen"}
          </button>
          <button class="danger" onclick="deleteReport(${report.id})">Delete</button>
        </div>
      </div>
    `)
    .join("");
}

function exportJSON() {
  const reports = getReports();

  if (reports.length === 0) {
    alert("No data to export.");
    return;
  }

  const blob = new Blob([JSON.stringify(reports, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "findit-lost-found-data.json";
  link.click();

  URL.revokeObjectURL(url);
}

function resetData() {
  const confirmed = confirm("Are you sure you want to delete all reports?");

  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  renderApp();
}

function loadSampleData() {
  const sampleReports = [
    {
      id: Date.now() + 1,
      type: "Lost",
      title: "Black Wallet",
      category: "Wallet / Money",
      location: "Library Level 2",
      date: "2026-05-20",
      contact: "studentA@email.com",
      description: "Black leather wallet with student card and bank card inside",
      status: "Open",
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 2,
      type: "Found",
      title: "Leather Wallet",
      category: "Wallet / Money",
      location: "Library",
      date: "2026-05-21",
      contact: "security counter",
      description: "Found black leather wallet near study table with cards inside",
      status: "Open",
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 3,
      type: "Lost",
      title: "Student ID Card",
      category: "ID / Card",
      location: "Cafeteria",
      date: "2026-05-22",
      contact: "0123456789",
      description: "Lost student ID card with blue lanyard",
      status: "Open",
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 4,
      type: "Found",
      title: "Blue Lanyard ID",
      category: "ID / Card",
      location: "Cafeteria entrance",
      date: "2026-05-22",
      contact: "admin office",
      description: "Found ID card attached to blue lanyard",
      status: "Open",
      createdAt: new Date().toISOString()
    }
  ];

  saveReports(sampleReports);
  renderApp();
}

function renderApp() {
  const reports = getReports();
  const matches = getMatches(reports);

  renderStats(reports, matches);
  renderMatches(matches);
  renderReports(reports);
}

document.getElementById("date").valueAsDate = new Date();

renderApp();
