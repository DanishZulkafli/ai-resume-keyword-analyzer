const skillKeywords = [
  "html",
  "css",
  "javascript",
  "typescript",
  "react",
  "vue",
  "angular",
  "php",
  "laravel",
  "wordpress",
  "woocommerce",
  "mysql",
  "sql",
  "python",
  "pandas",
  "numpy",
  "machine learning",
  "ai",
  "data analysis",
  "power bi",
  "tableau",
  "api",
  "rest api",
  "git",
  "github",
  "docker",
  "linux",
  "seo",
  "google analytics",
  "figma",
  "ui ux",
  "responsive design",
  "bootstrap",
  "tailwind",
  "node.js",
  "express",
  "mongodb",
  "firebase",
  "aws",
  "deployment",
  "testing",
  "debugging",
  "documentation"
];

function cleanText(text) {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ");
}

function findKeywords(text) {
  const clean = cleanText(text);
  return skillKeywords.filter(keyword => clean.includes(keyword));
}

function analyzeResume() {
  const jobTitle = document.getElementById("jobTitle").value.trim() || "Target Role";
  const resumeText = document.getElementById("resumeText").value.trim();
  const jobDescription = document.getElementById("jobDescription").value.trim();
  const result = document.getElementById("result");

  if (!resumeText || !jobDescription) {
    result.className = "empty";
    result.innerHTML = `
      <h3>Missing information</h3>
      <p>Please paste both your resume text and the job description before analyzing.</p>
    `;
    return;
  }

  const resumeKeywords = findKeywords(resumeText);
  const jobKeywords = findKeywords(jobDescription);

  const matchedKeywords = jobKeywords.filter(keyword => resumeKeywords.includes(keyword));
  const missingKeywords = jobKeywords.filter(keyword => !resumeKeywords.includes(keyword));

  const score = jobKeywords.length === 0
    ? 0
    : Math.round((matchedKeywords.length / jobKeywords.length) * 100);

  let statusClass = "low";
  let statusText = "Needs Improvement";

  if (score >= 75) {
    statusClass = "good";
    statusText = "Strong Match";
  } else if (score >= 45) {
    statusClass = "medium";
    statusText = "Moderate Match";
  }

  const suggestions = generateSuggestions(score, missingKeywords, jobTitle);
  const aiPrompt = generateAIPrompt(jobTitle, matchedKeywords, missingKeywords);

  result.className = "";
  result.innerHTML = `
    <div class="score-box">
      <h3>${jobTitle}</h3>
      <div class="score">${score}%</div>
      <span class="status ${statusClass}">${statusText}</span>
    </div>

    <h3>Matched Keywords</h3>
    <div class="keyword-list">
      ${
        matchedKeywords.length
          ? matchedKeywords.map(keyword => `<span class="keyword matched">${keyword}</span>`).join("")
          : "<p>No strong keyword match found.</p>"
      }
    </div>

    <h3>Missing Keywords</h3>
    <div class="keyword-list">
      ${
        missingKeywords.length
          ? missingKeywords.map(keyword => `<span class="keyword missing">${keyword}</span>`).join("")
          : "<p>No major missing keywords detected.</p>"
      }
    </div>

    <div class="suggestion-box">
      <h3>AI-Style Improvement Suggestions</h3>
      <ul>
        ${suggestions.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>

    <h3>AI Prompt for Resume Improvement</h3>
    <div class="ai-prompt">${aiPrompt}</div>
  `;

  saveHistory(jobTitle, score, matchedKeywords.length, missingKeywords.length);
  displayHistory();
}

function generateSuggestions(score, missingKeywords, jobTitle) {
  const suggestions = [];

  if (score < 45) {
    suggestions.push(`Your resume needs stronger alignment with the ${jobTitle} role.`);
    suggestions.push("Add more relevant technical skills, tools, and project experience.");
  } else if (score < 75) {
    suggestions.push("Your resume has a moderate match, but it can be improved with more targeted keywords.");
    suggestions.push("Add measurable achievements and role-specific project descriptions.");
  } else {
    suggestions.push("Your resume has a strong keyword match for this role.");
    suggestions.push("Improve further by adding measurable outcomes, project impact, and clear responsibilities.");
  }

  if (missingKeywords.length > 0) {
    suggestions.push(`Consider adding relevant experience or learning evidence related to: ${missingKeywords.slice(0, 6).join(", ")}.`);
  }

  suggestions.push("Use action verbs such as developed, implemented, optimized, integrated, automated, and analyzed.");
  suggestions.push("Include project links, GitHub repositories, portfolio website, and measurable achievements where possible.");

  return suggestions;
}

function generateAIPrompt(jobTitle, matchedKeywords, missingKeywords) {
  return `Act as a professional resume reviewer. I am applying for the role of ${jobTitle}. My matched keywords are: ${matchedKeywords.join(", ") || "none"}. My missing keywords are: ${missingKeywords.join(", ") || "none"}. Please rewrite my resume summary, improve my bullet points, and suggest project descriptions that align better with this job role.`;
}

function saveHistory(jobTitle, score, matchedCount, missingCount) {
  const history = JSON.parse(localStorage.getItem("resumeAnalyzerHistory")) || [];

  history.unshift({
    jobTitle,
    score,
    matchedCount,
    missingCount,
    date: new Date().toLocaleString()
  });

  localStorage.setItem("resumeAnalyzerHistory", JSON.stringify(history.slice(0, 5)));
}

function displayHistory() {
  const historyBox = document.getElementById("history");
  const history = JSON.parse(localStorage.getItem("resumeAnalyzerHistory")) || [];

  if (history.length === 0) {
    historyBox.innerHTML = "<p>No analysis history yet.</p>";
    return;
  }

  historyBox.innerHTML = history.map(item => `
    <div class="history-item">
      <strong>${item.jobTitle}</strong>
      <p>Score: ${item.score}% | Matched: ${item.matchedCount} | Missing: ${item.missingCount}</p>
      <small>${item.date}</small>
    </div>
  `).join("");
}

function clearHistory() {
  localStorage.removeItem("resumeAnalyzerHistory");
  displayHistory();
}

function loadDemo() {
  document.getElementById("jobTitle").value = "Web Developer";

  document.getElementById("resumeText").value = `
Web Developer with experience in HTML, CSS, JavaScript, PHP, WordPress, WooCommerce, MySQL, SEO, Google Analytics, GitHub, responsive design, and website deployment. Experienced in building CMS websites, troubleshooting plugin issues, managing hosting, SSL, DNS, and website performance.
  `;

  document.getElementById("jobDescription").value = `
We are looking for a Web Developer with experience in HTML, CSS, JavaScript, PHP, WordPress, WooCommerce, MySQL, Git, GitHub, REST API, SEO, Google Analytics, responsive design, debugging, documentation, deployment, and performance optimization.
  `;
}

displayHistory();
