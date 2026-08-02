// Мобильное меню
const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.getElementById("mainNav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Загрузка проектов прошлых лет из data/projects.json
async function loadProjects() {
  const grid = document.getElementById("projectGrid");
  const emptyState = document.getElementById("projectsEmpty");
  if (!grid) return;

  try {
    const response = await fetch("data/projects.json");
    const projects = await response.json();

    if (!Array.isArray(projects) || projects.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    grid.innerHTML = projects.map(renderProjectCard).join("");
  } catch (error) {
    if (emptyState) emptyState.hidden = false;
  }
}

function renderProjectCard(project) {
  const title = escapeHtml(project.title || "Проект");
  const year = escapeHtml(project.year || "");
  const category = escapeHtml(project.category || "");
  const description = escapeHtml(project.description || "");
  const image = project.image || "assets/img/projects/placeholder-1.svg";

  return `
    <article class="project-card">
      <img src="${image}" alt="${title}" loading="lazy">
      <div class="body">
        ${year ? `<div class="year">${year}</div>` : ""}
        <h3>${title}</h3>
        ${category ? `<p class="category">${category}</p>` : ""}
        ${description ? `<p class="description">${description}</p>` : ""}
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

loadProjects();
