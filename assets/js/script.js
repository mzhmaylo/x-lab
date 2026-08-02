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

// Счётчики в hero (только для чисто числовых показателей)
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Организаторы и заказчики — грузятся из своих data/*.json, рендерятся по-разному
async function loadLogos(jsonPath, gridId, renderItem) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  try {
    const response = await fetch(jsonPath);
    const items = await response.json();

    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = '<p class="logos-empty">Пока никого не добавили.</p>';
      return;
    }

    grid.innerHTML = items.map(renderItem).join("");
  } catch (error) {
    grid.innerHTML = '<p class="logos-empty">Не удалось загрузить логотипы.</p>';
  }
}

function renderOrganizerCard(item) {
  const name = escapeHtml(item.name || "");
  const logo = item.logo || "";
  const description = escapeHtml(item.description || "");
  return `
    <div class="organizer-card">
      <img src="${logo}" alt="${name}" loading="lazy">
      <h3>${name}</h3>
      ${description ? `<p>${description}</p>` : ""}
    </div>
  `;
}

function renderLogoTile(item) {
  const name = escapeHtml(item.name || "");
  const logo = item.logo || "";
  return `<div class="logo-tile"><img src="${logo}" alt="${name}" loading="lazy"></div>`;
}

loadLogos("data/organizers.json", "organizersGrid", renderOrganizerCard);
loadLogos("data/customers.json", "customersGrid", renderLogoTile);

// Карусель логотипов заказчиков
const customersTrack = document.getElementById("customersGrid");
const customersPrev = document.getElementById("customersPrev");
const customersNext = document.getElementById("customersNext");

if (customersTrack && customersPrev && customersNext) {
  customersPrev.addEventListener("click", () => {
    customersTrack.scrollBy({ left: -customersTrack.clientWidth, behavior: "smooth" });
  });
  customersNext.addEventListener("click", () => {
    customersTrack.scrollBy({ left: customersTrack.clientWidth, behavior: "smooth" });
  });
}

// Проекты: загрузка, фильтр по категории и году, сортировка по order, карусель
let allProjects = [];
let activeCategory = "Все";
let activeYear = "Все";

async function loadProjects() {
  const emptyState = document.getElementById("projectsEmpty");
  const categoryRow = document.getElementById("categoryFilterRow");
  const yearRow = document.getElementById("yearFilterRow");
  if (!document.getElementById("projectGrid")) return;

  try {
    const response = await fetch("data/projects.json");
    const projects = await response.json();

    if (!Array.isArray(projects) || projects.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    allProjects = projects
      .map((p, index) => ({ ...p, __index: index }))
      .sort((a, b) => {
        const orderA = typeof a.order === "number" ? a.order : a.__index;
        const orderB = typeof b.order === "number" ? b.order : b.__index;
        return orderA - orderB;
      });

    const categories = ["Все", ...new Set(allProjects.map((p) => p.category).filter(Boolean))];
    const years = ["Все", ...new Set(allProjects.map((p) => p.year).filter(Boolean))].sort((a, b) => {
      if (a === "Все") return -1;
      if (b === "Все") return 1;
      return String(b).localeCompare(String(a));
    });

    buildFilterButtons(categoryRow, categories, (value) => {
      activeCategory = value;
      renderProjects();
    });
    buildFilterButtons(yearRow, years, (value) => {
      activeYear = value;
      renderProjects();
    });

    renderProjects();
  } catch (error) {
    if (emptyState) emptyState.hidden = false;
  }
}

function buildFilterButtons(container, values, onSelect) {
  if (!container) return;
  container.innerHTML = values
    .map((value, i) => `<button class="filter-btn${i === 0 ? " active" : ""}" data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`)
    .join("");
  container.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      onSelect(btn.dataset.value);
    });
  });
}

function renderProjects() {
  const grid = document.getElementById("projectGrid");
  const emptyState = document.getElementById("projectsEmpty");
  if (!grid) return;

  const filtered = allProjects.filter((p) => {
    const matchesCategory = activeCategory === "Все" || p.category === activeCategory;
    const matchesYear = activeYear === "Все" || p.year === activeYear;
    return matchesCategory && matchesYear;
  });

  grid.innerHTML = filtered.map(renderProjectCard).join("");
  grid.scrollTo({ left: 0 });

  if (emptyState) emptyState.hidden = filtered.length > 0;
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

loadProjects();

// Карусель проектов: стрелки листают на ширину видимой области
const carouselTrack = document.getElementById("projectGrid");
const prevBtn = document.getElementById("carouselPrev");
const nextBtn = document.getElementById("carouselNext");

if (carouselTrack && prevBtn && nextBtn) {
  prevBtn.addEventListener("click", () => {
    carouselTrack.scrollBy({ left: -carouselTrack.clientWidth, behavior: "smooth" });
  });
  nextBtn.addEventListener("click", () => {
    carouselTrack.scrollBy({ left: carouselTrack.clientWidth, behavior: "smooth" });
  });
}
