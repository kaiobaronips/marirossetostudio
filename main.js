/**
 * Mari Rosseto Studio — main.js
 * Compiled from main.ts — ES2017 target.
 */

"use strict";

// ─── Utilities ────────────────────────────────────────────────────────────────

const qs = (selector, root = document) => root.querySelector(selector);
const qsAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isPointerFine = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// ─── Page Loader ──────────────────────────────────────────────────────────────

function initLoader() {
  const loader = qs("#loader");
  const loaderLine = qs("#loader-line");
  if (!loader) return;

  // Start the sweep line
  requestAnimationFrame(() => {
    if (loaderLine) loaderLine.style.width = "100%";
  });

  const hide = () => {
    loader.classList.add("hidden");
    loader.addEventListener("transitionend", () => loader.remove(), { once: true });
  };

  if (document.readyState === "complete") {
    setTimeout(hide, 2500);
  } else {
    window.addEventListener("load", () => setTimeout(hide, 1800), { once: true });
  }
}

// ─── Scroll Progress Bar ──────────────────────────────────────────────────────

function initScrollProgress() {
  const bar = qs("#scroll-progress");
  if (!bar) return;

  let ticking = false;

  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${progress}%`;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

// ─── Custom Cursor ────────────────────────────────────────────────────────────

function initCursor() {
  if (!isPointerFine() || prefersReducedMotion()) return;

  const dot = qs("#cursor");
  const ring = qs("#cursor-ring");
  if (!dot || !ring) return;

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;
  const lerpFactor = 0.12;
  const hoverTargets = "a, button, [role='button'], input, textarea, select, label, .project-card, .t-dot";

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = `${mouseX}px`;
    dot.style.top = `${mouseY}px`;
  }, { passive: true });

  // Smooth ring follow
  const animateRing = () => {
    ringX += (mouseX - ringX) * lerpFactor;
    ringY += (mouseY - ringY) * lerpFactor;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    requestAnimationFrame(animateRing);
  };
  animateRing();

  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(hoverTargets)) {
      dot.classList.add("is-hovering");
      ring.classList.add("is-hovering");
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(hoverTargets)) {
      dot.classList.remove("is-hovering");
      ring.classList.remove("is-hovering");
    }
  });

  document.addEventListener("mousedown", () => { dot.classList.add("is-clicking"); ring.classList.add("is-clicking"); });
  document.addEventListener("mouseup", () => { dot.classList.remove("is-clicking"); ring.classList.remove("is-clicking"); });
  document.addEventListener("mouseleave", () => { dot.style.opacity = "0"; ring.style.opacity = "0"; });
  document.addEventListener("mouseenter", () => { dot.style.opacity = ""; ring.style.opacity = ""; });
}

// ─── Navigation: Scroll Effect + Active Section ───────────────────────────────

function initNavigation() {
  const navbar = qs("#navbar");
  const navLinks = qsAll(".nav-links a");
  if (!navbar) return;

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 80);
  }, { passive: true });

  const sectionIds = navLinks
    .map(a => a.getAttribute("href")?.replace("#", ""))
    .filter(Boolean);

  const sectionEls = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (sectionEls.length === 0) return;

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach(link => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      }
    });
  }, { threshold: 0.35 });

  sectionEls.forEach(el => sectionObserver.observe(el));
}

// ─── Mobile Menu ──────────────────────────────────────────────────────────────

function initMobileMenu() {
  const hamburger = qs("#hamburger");
  const overlay = qs("#mobile-overlay");
  const mobileLinks = qsAll("#mobile-overlay a");

  if (!hamburger || !overlay) return;

  const toggle = (open) => {
    hamburger.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };

  hamburger.addEventListener("click", () => toggle(!overlay.classList.contains("open")));
  mobileLinks.forEach(link => link.addEventListener("click", () => toggle(false)));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) toggle(false);
  });
}

// ─── Reveal Animations ────────────────────────────────────────────────────────

function initReveal() {
  if (prefersReducedMotion()) {
    qsAll(".reveal").forEach(el => el.classList.add("active"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -48px 0px" });

  qsAll(".reveal").forEach(el => observer.observe(el));
}

// ─── Parallax ─────────────────────────────────────────────────────────────────

function initParallax() {
  if (prefersReducedMotion()) return;

  const heroImage = qs(".hero-image");
  if (!heroImage) return;

  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        if (scrolled < window.innerHeight * 1.5) {
          heroImage.style.transform = `scale(1.1) translateY(${scrolled * 0.3}px)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ─── Testimonial Slider ───────────────────────────────────────────────────────

function initTestimonials() {
  const slides = qsAll(".testimonial-slide");
  const dotsContainer = qs("#testimonial-dots");
  const prevBtn = qs("#prev-slide");
  const nextBtn = qs("#next-slide");
  const sliderEl = qs(".testimonial-slider");

  if (slides.length === 0) return;

  let current = 0;
  let autoTimer = null;
  let dots = [];

  // Build dots
  if (dotsContainer) {
    slides.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.className = `t-dot${i === 0 ? " active" : ""}`;
      dot.addEventListener("click", () => goTo(i));
      dotsContainer.appendChild(dot);
    });
    dots = qsAll(".t-dot", dotsContainer);
  }

  const goTo = (index) => {
    slides[current].classList.remove("active");
    if (dots[current]) dots[current].classList.remove("active");
    current = ((index % slides.length) + slides.length) % slides.length;
    slides[current].classList.add("active");
    if (dots[current]) dots[current].classList.add("active");
  };

  prevBtn?.addEventListener("click", () => { goTo(current - 1); resetTimer(); });
  nextBtn?.addEventListener("click", () => { goTo(current + 1); resetTimer(); });

  document.addEventListener("keydown", (e) => {
    if (!sliderEl) return;
    const rect = sliderEl.getBoundingClientRect();
    if (rect.top >= window.innerHeight || rect.bottom <= 0) return;
    if (e.key === "ArrowLeft") { goTo(current - 1); resetTimer(); }
    if (e.key === "ArrowRight") { goTo(current + 1); resetTimer(); }
  });

  const startTimer = () => { autoTimer = setInterval(() => goTo(current + 1), 6000); };
  const resetTimer = () => { clearInterval(autoTimer); startTimer(); };

  sliderEl?.addEventListener("mouseenter", () => clearInterval(autoTimer));
  sliderEl?.addEventListener("mouseleave", startTimer);

  startTimer();
}

// ─── Smooth Scroll ────────────────────────────────────────────────────────────

function initSmoothScroll() {
  qsAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const href = anchor.getAttribute("href");
      if (!href || href === "#") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      const target = qs(href);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// ─── Contact Form Validation ──────────────────────────────────────────────────

function initForm() {
  const form = qs("#contact-form");
  const successEl = qs("#form-success");
  if (!form) return;

  const validate = (inputId, errId, checkEmail = false) => {
    const input = qs(`#${inputId}`, form);
    const errMsg = qs(`#${errId}`, form);
    if (!input || !errMsg) return true;
    const val = input.value.trim();
    const valid = val !== "" && (!checkEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
    input.classList.toggle("error", !valid);
    errMsg.classList.toggle("visible", !valid);
    return valid;
  };

  // Clear on input
  ["field-name", "field-email", "field-message"].forEach(id => {
    qs(`#${id}`, form)?.addEventListener("input", () => {
      const errId = id.replace("field-", "err-");
      qs(`#${errId}`, form)?.classList.remove("visible");
      qs(`#${id}`, form)?.classList.remove("error");
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameOk = validate("field-name", "err-name");
    const emailOk = validate("field-email", "err-email", true);
    const msgOk = validate("field-message", "err-message");
    if (!nameOk || !emailOk || !msgOk) return;

    // Show success
    qsAll(".form-group, .submit-btn", form).forEach(el => (el.style.display = "none"));
    if (successEl) {
      successEl.style.display = "block";
      requestAnimationFrame(() => successEl.classList.add("visible"));
    }
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initScrollProgress();
  initCursor();
  initNavigation();
  initMobileMenu();
  initReveal();
  initParallax();
  initTestimonials();
  initSmoothScroll();
  initForm();
});
