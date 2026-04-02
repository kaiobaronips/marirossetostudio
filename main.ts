/**
 * Mari Rosseto Studio — main.ts
 * TypeScript source for all site interactions.
 * Compile: tsc main.ts --target ES2017 --lib ES2017,DOM --outFile main.js
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface CursorState {
  x: number;
  y: number;
  ringX: number;
  ringY: number;
  isHovering: boolean;
  isClicking: boolean;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const qs = <T extends Element>(selector: string, root: ParentNode = document): T | null =>
  root.querySelector<T>(selector);

const qsAll = <T extends Element>(selector: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(selector));

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isPointerFine = (): boolean =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// ─── Page Loader ──────────────────────────────────────────────────────────────

function initLoader(): void {
  const loader = qs<HTMLElement>("#loader");
  const loaderLine = qs<HTMLElement>("#loader-line");
  if (!loader) return;

  // Start the sweep line
  requestAnimationFrame(() => {
    if (loaderLine) loaderLine.style.width = "100%";
  });

  const hide = (): void => {
    loader.classList.add("hidden");
    // Remove from DOM after transition
    loader.addEventListener("transitionend", () => loader.remove(), { once: true });
  };

  if (document.readyState === "complete") {
    setTimeout(hide, 2500);
  } else {
    window.addEventListener("load", () => setTimeout(hide, 1800), { once: true });
  }
}

// ─── Scroll Progress Bar ──────────────────────────────────────────────────────

function initScrollProgress(): void {
  const bar = qs<HTMLElement>("#scroll-progress");
  if (!bar) return;

  let ticking = false;

  const update = (): void => {
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

function initCursor(): void {
  if (!isPointerFine() || prefersReducedMotion()) return;

  const dot = qs<HTMLElement>("#cursor");
  const ring = qs<HTMLElement>("#cursor-ring");
  if (!dot || !ring) return;

  const state: CursorState = { x: -100, y: -100, ringX: -100, ringY: -100, isHovering: false, isClicking: false };
  const lerpFactor = 0.12; // ring lag factor

  const hoverTargets = "a, button, [role='button'], input, textarea, select, label, .project-card, .t-dot";

  document.addEventListener("mousemove", (e: MouseEvent) => {
    state.x = e.clientX;
    state.y = e.clientY;
    dot.style.left = `${state.x}px`;
    dot.style.top = `${state.y}px`;
  }, { passive: true });

  // Smooth ring follow via RAF
  const animateRing = (): void => {
    state.ringX += (state.x - state.ringX) * lerpFactor;
    state.ringY += (state.y - state.ringY) * lerpFactor;
    ring.style.left = `${state.ringX}px`;
    ring.style.top = `${state.ringY}px`;
    requestAnimationFrame(animateRing);
  };
  animateRing();

  // Hover state
  document.addEventListener("mouseover", (e: MouseEvent) => {
    if ((e.target as Element).closest(hoverTargets)) {
      dot.classList.add("is-hovering");
      ring.classList.add("is-hovering");
    }
  });
  document.addEventListener("mouseout", (e: MouseEvent) => {
    if ((e.target as Element).closest(hoverTargets)) {
      dot.classList.remove("is-hovering");
      ring.classList.remove("is-hovering");
    }
  });

  // Click state
  document.addEventListener("mousedown", () => { dot.classList.add("is-clicking"); ring.classList.add("is-clicking"); });
  document.addEventListener("mouseup", () => { dot.classList.remove("is-clicking"); ring.classList.remove("is-clicking"); });

  // Hide when leaving window
  document.addEventListener("mouseleave", () => { dot.style.opacity = "0"; ring.style.opacity = "0"; });
  document.addEventListener("mouseenter", () => { dot.style.opacity = ""; ring.style.opacity = ""; });
}

// ─── Navigation: Scroll Effect + Active Section ───────────────────────────────

function initNavigation(): void {
  const navbar = qs<HTMLElement>("#navbar");
  const navLinks = qsAll<HTMLAnchorElement>(".nav-links a");
  const sections = qsAll<HTMLElement>("section[id], div[id]");

  if (!navbar) return;

  // Scroll → navbar style
  let lastScroll = 0;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (y > 80) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
    lastScroll = y;
  }, { passive: true });

  // Active section via IntersectionObserver
  const sectionIds = navLinks
    .map(a => a.getAttribute("href")?.replace("#", ""))
    .filter(Boolean) as string[];

  const sectionEls = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean) as HTMLElement[];

  if (sectionEls.length === 0) return;

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach(link => {
            const isActive = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("active", isActive);
          });
        }
      });
    },
    { threshold: 0.35 }
  );

  sectionEls.forEach(el => sectionObserver.observe(el));
}

// ─── Mobile Menu ──────────────────────────────────────────────────────────────

function initMobileMenu(): void {
  const hamburger = qs<HTMLButtonElement>("#hamburger");
  const overlay = qs<HTMLElement>("#mobile-overlay");
  const mobileLinks = qsAll<HTMLAnchorElement>("#mobile-overlay a");

  if (!hamburger || !overlay) return;

  const toggle = (open: boolean): void => {
    hamburger.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };

  hamburger.addEventListener("click", () => {
    const isOpen = overlay.classList.contains("open");
    toggle(!isOpen);
  });

  mobileLinks.forEach(link => {
    link.addEventListener("click", () => toggle(false));
  });

  // Close on Escape
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) {
      toggle(false);
    }
  });
}

// ─── Reveal Animations ────────────────────────────────────────────────────────

function initReveal(): void {
  if (prefersReducedMotion()) {
    qsAll(".reveal").forEach(el => el.classList.add("active"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -48px 0px" }
  );

  qsAll(".reveal").forEach(el => observer.observe(el));
}

// ─── Parallax ─────────────────────────────────────────────────────────────────

function initParallax(): void {
  if (prefersReducedMotion()) return;

  const heroImage = qs<HTMLElement>(".hero-image");
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

function initTestimonials(): void {
  const slides = qsAll<HTMLElement>(".testimonial-slide");
  const dotsContainer = qs<HTMLElement>("#testimonial-dots");
  const prevBtn = qs<HTMLButtonElement>("#prev-slide");
  const nextBtn = qs<HTMLButtonElement>("#next-slide");
  const sliderEl = qs<HTMLElement>(".testimonial-slider");

  if (slides.length === 0) return;

  let current = 0;
  let autoTimer: ReturnType<typeof setInterval> | null = null;
  let dots: HTMLElement[] = [];

  // Build dots
  if (dotsContainer) {
    slides.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.className = `t-dot${i === 0 ? " active" : ""}`;
      dot.addEventListener("click", () => goTo(i));
      dotsContainer.appendChild(dot);
    });
    dots = qsAll<HTMLElement>(".t-dot", dotsContainer);
  }

  const goTo = (index: number): void => {
    slides[current].classList.remove("active");
    if (dots[current]) dots[current].classList.remove("active");

    current = (index + slides.length) % slides.length;

    slides[current].classList.add("active");
    if (dots[current]) dots[current].classList.add("active");
  };

  prevBtn?.addEventListener("click", () => { goTo(current - 1); resetTimer(); });
  nextBtn?.addEventListener("click", () => { goTo(current + 1); resetTimer(); });

  // Keyboard support
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (!sliderEl) return;
    const rect = sliderEl.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;
    if (e.key === "ArrowLeft") { goTo(current - 1); resetTimer(); }
    if (e.key === "ArrowRight") { goTo(current + 1); resetTimer(); }
  });

  // Auto-advance, pause on hover
  const startTimer = (): void => {
    autoTimer = setInterval(() => goTo(current + 1), 6000);
  };
  const resetTimer = (): void => {
    if (autoTimer) clearInterval(autoTimer);
    startTimer();
  };

  sliderEl?.addEventListener("mouseenter", () => { if (autoTimer) clearInterval(autoTimer); });
  sliderEl?.addEventListener("mouseleave", startTimer);

  startTimer();
}

// ─── Smooth Scroll ────────────────────────────────────────────────────────────

function initSmoothScroll(): void {
  qsAll<HTMLAnchorElement>('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", (e: Event) => {
      e.preventDefault();
      const href = anchor.getAttribute("href");
      if (!href || href === "#") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      const target = qs<HTMLElement>(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

// ─── Contact Form Validation ──────────────────────────────────────────────────

function initForm(): void {
  const form = qs<HTMLFormElement>("#contact-form");
  const successEl = qs<HTMLElement>("#form-success");
  if (!form) return;

  const showError = (inputId: string, errId: string): boolean => {
    const input = qs<HTMLInputElement | HTMLTextAreaElement>(`#${inputId}`, form);
    const errMsg = qs<HTMLElement>(`#${errId}`, form);
    if (!input || !errMsg) return false;
    const valid = input.value.trim() !== "" && (inputId !== "field-email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
    input.classList.toggle("error", !valid);
    errMsg.classList.toggle("visible", !valid);
    return valid;
  };

  // Clear error on input
  ["field-name", "field-email", "field-message"].forEach(id => {
    qs<HTMLInputElement>(`#${id}`, form)?.addEventListener("input", () => {
      const errId = id.replace("field-", "err-");
      qs<HTMLElement>(`#${errId}`, form)?.classList.remove("visible");
      qs<HTMLElement>(`#${id}`, form)?.classList.remove("error");
    });
  });

  form.addEventListener("submit", (e: Event) => {
    e.preventDefault();

    const nameOk = showError("field-name", "err-name");
    const emailOk = showError("field-email", "err-email");
    const msgOk = showError("field-message", "err-message");

    if (!nameOk || !emailOk || !msgOk) return;

    // Success state
    qsAll<HTMLElement>(".form-group, .submit-btn", form).forEach(el => {
      (el as HTMLElement).style.display = "none";
    });

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
