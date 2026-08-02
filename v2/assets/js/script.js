// Помечаем, что JS есть и может снять анимацию появления (см. .js-ready в CSS)
document.documentElement.classList.add("js-ready");

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

// Полоса прогресса прокрутки
const progressBar = document.getElementById("progressBar");
function updateProgressBar() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (progressBar) progressBar.style.width = percent + "%";
}
window.addEventListener("scroll", updateProgressBar, { passive: true });
updateProgressBar();

// Подсветка активного пункта меню при скролле
const navLinks = Array.from(document.querySelectorAll(".nav a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const link = navLinks.find((a) => a.getAttribute("href") === "#" + entry.target.id);
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach((a) => a.classList.remove("active"));
        link.classList.add("active");
      }
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
sections.forEach((section) => sectionObserver.observe(section));

// Появление блоков при скролле
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal, .timeline-step").forEach((el, index) => {
  el.style.transitionDelay = (index % 6) * 60 + "ms";
  revealObserver.observe(el);
});

// Счётчики в hero
const countEls = document.querySelectorAll(".count");
const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10) || 0;
      const duration = 900;
      el.textContent = "0";
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(progress * target);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  },
  { threshold: 0.6 }
);
countEls.forEach((el) => countObserver.observe(el));

// Кнопка "наверх"
const toTopBtn = document.getElementById("toTop");
if (toTopBtn) {
  window.addEventListener(
    "scroll",
    () => {
      toTopBtn.classList.toggle("visible", window.scrollY > 600);
    },
    { passive: true }
  );
  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Бегущая строка партнёров
const partners = [
  "СПбПУ Петра Великого",
  "ПИШ «Цифровой инжиниринг»",
  "CML CompMechLab",
  "FORMA Industrial Design",
  "Физическая реабилитация",
  "Фонд инициатив Санкт-Петербурга",
  "СПбГМУ им. акад. И. П. Павлова",
  "Robowizard",
];

const ticker = document.getElementById("ticker");
if (ticker) {
  const items = [...partners, ...partners]
    .map((name) => `<span class="ticker-item">${escapeHtml(name)}</span>`)
    .join("");
  ticker.innerHTML = items;
}

// Проекты: загрузка, рендер, фильтр по категориям
let allProjects = [];

async function loadProjects() {
  const grid = document.getElementById("projectGrid");
  const emptyState = document.getElementById("projectsEmpty");
  const filterRow = document.getElementById("filterRow");
  if (!grid) return;

  try {
    const response = await fetch("data/projects.json");
    const projects = await response.json();

    if (!Array.isArray(projects) || projects.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    allProjects = projects;
    const categories = ["Все", ...new Set(projects.map((p) => p.category).filter(Boolean))];
    if (filterRow) {
      filterRow.innerHTML = categories
        .map(
          (cat, i) =>
            `<button class="filter-btn${i === 0 ? " active" : ""}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
        )
        .join("");
      filterRow.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          filterRow.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          renderProjects(btn.dataset.category);
        });
      });
    }

    renderProjects("Все");
  } catch (error) {
    if (emptyState) emptyState.hidden = false;
  }
}

function renderProjects(category) {
  const grid = document.getElementById("projectGrid");
  if (!grid) return;
  const filtered =
    category && category !== "Все" ? allProjects.filter((p) => p.category === category) : allProjects;
  grid.innerHTML = filtered.map(renderProjectCard).join("");
}

function renderProjectCard(project) {
  const title = escapeHtml(project.title || "Проект");
  const year = escapeHtml(project.year || "");
  const category = escapeHtml(project.category || "");
  const description = escapeHtml(project.description || "");
  const image = project.image || "assets/img/projects/placeholder-1.svg";

  return `
    <article class="project-card">
      <div class="thumb"><img src="${image}" alt="${title}" loading="lazy"></div>
      <div class="body">
        ${year ? `<div class="year">${year}</div>` : ""}
        <h3>${title}</h3>
        ${category ? `<span class="category">${category}</span>` : ""}
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
