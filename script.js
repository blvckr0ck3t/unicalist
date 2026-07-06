/* Уникалисты — микро-взаимодействия главной.
   Все эффекты: только transform/opacity, отключаются при reduced-motion и на тач-устройствах. */

(() => {
  const fine = window.matchMedia("(pointer: fine)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1. Появление при скролле (работает и без мыши) ── */

  const revealTargets = document.querySelectorAll(
    ".section-head, .card, .not-for, .no-promises p, .list-plain li, .final h2, .final p, .final .btn"
  );

  if (!reduced) {
    // группируем по родителю, чтобы дать стаггер соседям
    const groups = new Map();
    revealTargets.forEach((el) => {
      const key = el.parentElement;
      if (!groups.has(key)) groups.set(key, 0);
      el.style.transitionDelay = `${groups.get(key) * 70}ms`;
      groups.set(key, groups.get(key) + 1);
      el.classList.add("reveal");
    });

    const pending = new Set(revealTargets);
    let ticking = false;

    const checkReveals = () => {
      const limit = window.innerHeight - 40;
      pending.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < limit && r.bottom > 0) {
          el.classList.add("in");
          pending.delete(el);
        }
      });
      if (!pending.size) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        checkReveals();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    checkReveals();
  }

  if (!fine || reduced) return; // дальше — только мышь

  /* ── 2. Пиксельный след за курсором ── */

  const PX = 8;
  let lastX = -100;
  let lastY = -100;
  let dots = 0;

  document.addEventListener("mousemove", (e) => {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (dx * dx + dy * dy < 28 * 28 || dots > 24) return;
    lastX = e.clientX;
    lastY = e.clientY;

    const dot = document.createElement("div");
    dot.className = "pixel-dot";
    dot.style.left = `${Math.round((e.clientX + window.scrollX) / PX) * PX}px`;
    dot.style.top = `${Math.round((e.clientY + window.scrollY) / PX) * PX}px`;
    if (Math.random() < 0.18) dot.classList.add("pixel-dot--olive");
    document.body.appendChild(dot);
    dots++;
    dot.addEventListener("animationend", () => {
      dot.remove();
      dots--;
    });
  });

  /* ── 3. Spotlight на карточках ── */

  document.querySelectorAll(".card, .not-for").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ── 4. Магнитные кнопки ── */

  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      btn.style.transform = `translate(${x * 5}px, ${y * 4}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });

  /* ── 5. Параллакс в hero ── */

  const wordmark = document.querySelector(".hero-wordmark");
  const stairs = document.querySelector(".pixel-stairs");
  const hero = document.querySelector(".hero");

  if (hero && wordmark) {
    hero.addEventListener("mousemove", (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      wordmark.style.transform = `translate(${x * -8}px, ${y * -5}px)`;
      if (stairs) stairs.style.transform = `translate(${x * 14}px, ${y * 10}px)`;
    });
    hero.addEventListener("mouseleave", () => {
      wordmark.style.transform = "";
      if (stairs) stairs.style.transform = "";
    });
  }
})();
