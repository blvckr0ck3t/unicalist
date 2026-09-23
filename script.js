/* Уникалисты — микро-взаимодействия главной.
   Все эффекты: только transform/opacity, отключаются при reduced-motion и на тач-устройствах. */

(() => {
  const fine = window.matchMedia("(pointer: fine)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1. Появление при скролле (работает и без мыши) ── */

  const revealTargets = document.querySelectorAll(
    ".section-head, .card, .not-for, .list-plain li, .final h2, .final p, .final .btn"
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

/* Мобильное меню */
(() => {
  const btn = document.querySelector(".nav-burger");
  const links = document.getElementById("navLinks");
  if (!btn || !links) return;
  btn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      links.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
})();

/* Hero главной: пиксель выходит из сетки и лесенкой проходит этапы перехода.
   Сетка — фон всего блока, путь рисуется внутри .uhero-art.
   При reduced-motion показываем финальный кадр без анимации. */
(() => {
  const hero = document.querySelector(".uhero");
  const canvas = hero && hero.querySelector(".uhero-canvas");
  const art = hero && hero.querySelector(".uhero-art");
  if (!canvas || !art || !canvas.getContext) return;

  const ctx = canvas.getContext("2d");
  const stageEls = hero.querySelectorAll(".uhero-stages li");
  const stateEl = hero.querySelector(".uhero-state");
  const countEl = hero.querySelector(".uhero-count");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;

  const LIME = "#e8ff2b";
  const OLIVE = "#7a8239";
  const GRAY = "#8e8e8e";
  const LIGHT = "#f0f0f0";
  const CELL = 16; // шаг сетки = 2 модуля по 8px
  const FONT = '10px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
  const STAGES = ["Самоопределение", "Первые деньги", "Продукт", "Система"];
  const STATES = ["◐ Поиск", "◑ В пути", "◑ В пути", "◑ В пути", "● Своё дело"];

  let W = 0, H = 0, cols = 0, rows = 0;
  let base, energy;          // яркость точек сетки: постоянная и «возбуждённая»
  let path = [], nodes = []; // клетки пути и индексы этапов в нём
  let labels = true;
  let ripples = [];
  let cursor = null;

  // таймлайн одной петли
  let phase, phaseT, head, stage, stepT, alpha;

  const px = (c) => c * CELL + CELL / 2;

  function setStage(k) {
    stage = k;
    stageEls.forEach((li, i) => {
      li.classList.toggle("is-active", i === k - 1);
      li.classList.toggle("is-done", i < k - 1);
    });
    if (stateEl) stateEl.textContent = STATES[k];
    if (countEl) countEl.textContent = `Этап ${k}/4`;
  }

  function walk(a, b) {
    // по клетке: сначала по горизонтали, потом по вертикали — пиксельная лесенка
    let [c, r] = path.length ? path[path.length - 1] : a;
    if (!path.length) path.push([c, r]);
    while (c !== b[0]) { c += Math.sign(b[0] - c); path.push([c, r]); }
    while (r !== b[1]) { r += Math.sign(b[1] - r); path.push([c, r]); }
  }

  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const hr = hero.getBoundingClientRect();
    const ar = art.getBoundingClientRect();
    W = hr.width;
    H = hr.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(W / CELL);
    rows = Math.ceil(H / CELL);
    base = new Float32Array(cols * rows);
    energy = new Float32Array(cols * rows);
    for (let i = 0; i < base.length; i++) {
      const r = Math.random();
      base[i] = r < 0.3 ? 0 : r < 0.78 ? 0.16 : r < 0.95 ? 0.26 : 0.45;
    }

    // область пути в клетках
    const c0 = Math.ceil((ar.left - hr.left) / CELL) + 1;
    const c1 = Math.floor((ar.right - hr.left) / CELL) - 2;
    const r0 = Math.ceil((ar.top - hr.top) / CELL) + 1;
    const r1 = Math.floor((ar.bottom - hr.top) / CELL) - 2;
    const sc = c1 - c0, sr = r1 - r0;

    path = [];
    nodes = [];
    if (sc < 10 || sr < 6) return;
    labels = sc >= 22;

    const clampC = (c) => Math.max(c0, Math.min(c1, c));
    const clampR = (r) => Math.max(r0, Math.min(r1, r));
    const at = (fx, fy) => [clampC(c0 + Math.round(sc * fx)), clampR(r1 - Math.round(sr * fy))];

    // этапы — ступени снизу-слева вверх-вправо
    const stops = [at(0.3, 0.2), at(0.52, 0.45), at(0.74, 0.7), at(1, 1)];
    const start = at(0, 0);
    const u = Math.max(1, Math.round(Math.min(sc, sr) / 12));

    // самоопределение: пиксель сначала блуждает — ищет себя
    const wander = [[0, -2], [2, -2], [2, 0], [4, 0], [4, -3], [3, -3], [3, -1], [6, -1]]
      .map(([dc, dr]) => [clampC(start[0] + dc * u), clampR(start[1] + dr * u)]);
    walk(start, start);
    wander.forEach((p) => walk(null, p));
    walk(null, stops[0]);
    nodes.push(path.length - 1);

    // дальше — уверенная лесенка по три ступени между этапами
    for (let s = 1; s < stops.length; s++) {
      const [ac, ar2] = stops[s - 1];
      const [bc, br] = stops[s];
      for (let k = 1; k <= 3; k++) {
        const c = Math.round(ac + ((bc - ac) * k) / 3);
        const r = Math.round(ar2 + ((br - ar2) * k) / 3);
        walk(null, [c, path[path.length - 1][1]]);
        walk(null, [c, r]);
      }
      nodes.push(path.length - 1);
    }
  }

  function reset() {
    phase = "wake";
    phaseT = 0;
    head = 0;
    stepT = 0;
    alpha = 1;
    ripples = [];
    setStage(0);
    if (path.length) ripples.push({ c: path[0][0], r: path[0][1], t: 0 });
  }

  function excite(c, r, v) {
    if (c < 0 || r < 0 || c >= cols || r >= rows) return;
    const i = r * cols + c;
    if (energy[i] < v) energy[i] = v;
  }

  function update(dt) {
    // затухание и редкое мерцание сетки
    const decay = Math.pow(0.9, dt / 16);
    for (let i = 0; i < energy.length; i++) energy[i] *= decay;
    for (let k = 0; k < 2; k++) energy[(Math.random() * energy.length) | 0] = 0.16;

    // волны от ключевых событий
    ripples = ripples.filter((rp) => {
      rp.t += dt;
      const age = rp.t / 1400;
      if (age >= 1) return false;
      const rad = age * 16;
      const R = Math.ceil(rad) + 1;
      for (let r = rp.r - R; r <= rp.r + R; r++) {
        for (let c = rp.c - R; c <= rp.c + R; c++) {
          const d = Math.hypot(c - rp.c, r - rp.r);
          if (Math.abs(d - rad) < 0.8) excite(c, r, 0.55 * (1 - age));
        }
      }
      return true;
    });

    if (cursor) {
      for (let r = cursor.r - 4; r <= cursor.r + 4; r++) {
        for (let c = cursor.c - 4; c <= cursor.c + 4; c++) {
          const d = Math.hypot(c - cursor.c, r - cursor.r);
          if (d < 4) excite(c, r, 0.3 * (1 - d / 4));
        }
      }
    }

    if (!path.length) return;
    phaseT += dt;

    if (phase === "wake") {
      if (phaseT > 1100) { phase = "move"; phaseT = 0; }
    } else if (phase === "move") {
      stepT += dt;
      const speed = stage === 0 ? 105 : 55; // в поиске медленнее, на лесенке увереннее
      while (stepT >= speed && phase === "move") {
        stepT -= speed;
        head++;
        const n = nodes.indexOf(head);
        if (n !== -1) {
          setStage(n + 1);
          ripples.push({ c: path[head][0], r: path[head][1], t: 0 });
          phase = n === nodes.length - 1 ? "hold" : "pause";
          phaseT = 0;
          stepT = 0;
        }
      }
    } else if (phase === "pause") {
      if (phaseT > 650) { phase = "move"; phaseT = 0; }
    } else if (phase === "hold") {
      if (phaseT > 2800) { phase = "fade"; phaseT = 0; }
    } else if (phase === "fade") {
      alpha = Math.max(0, 1 - phaseT / 900);
      if (alpha === 0) reset();
    }

    const [hc, hr] = path[head];
    for (let r = hr - 2; r <= hr + 2; r++) {
      for (let c = hc - 2; c <= hc + 2; c++) excite(c, r, 0.22);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // сетка
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const e = energy ? energy[i] : 0;
        const a = Math.min(1, base[i] + e);
        if (a < 0.03) continue;
        ctx.globalAlpha = a;
        if (e > 0.2) {
          ctx.fillStyle = LIGHT;
          ctx.fillRect(px(c) - 2, px(r) - 2, 4, 4);
        } else {
          ctx.fillStyle = GRAY;
          ctx.fillRect(px(c) - 1, px(r) - 1, 2, 2);
        }
      }
    }

    if (!path.length) { ctx.globalAlpha = 1; return; }

    // след
    ctx.fillStyle = OLIVE;
    for (let i = 0; i < head; i++) {
      ctx.globalAlpha = alpha * (i < nodes[0] ? 0.4 : 0.8);
      ctx.fillRect(px(path[i][0]) - 4, px(path[i][1]) - 4, 8, 8);
    }

    // метка старта
    ctx.font = FONT;
    ctx.textBaseline = "middle";
    const [sc, sr] = path[0];
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = GRAY;
    ctx.textAlign = "left";
    ctx.fillText("ТЫ", px(sc) + 12, px(sr) + 14);

    // этапы
    nodes.forEach((ni, k) => {
      const [c, r] = path[ni];
      const x = px(c), y = px(r);
      const done = stage > k;
      ctx.globalAlpha = alpha * (done ? 1 : 0.4);
      ctx.strokeStyle = done ? LIME : GRAY;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 9.5, y - 9.5, 19, 19);
      if (done) {
        ctx.fillStyle = LIME;
        ctx.fillRect(x - 4, y - 4, 8, 8);
      }
      if (labels || (done && stage === k + 1)) {
        const text = `0${k + 1} ${STAGES[k].toUpperCase()}`;
        ctx.fillStyle = done ? LIGHT : GRAY;
        // подпись слева от узла: справа уходит ступень следа;
        // если слева не помещается — справа, под узлом
        const left = ctx.measureText(text).width + 22 < x;
        ctx.textAlign = left ? "right" : "left";
        ctx.fillText(text, left ? x - 18 : x + 18, left ? y : y + 22);
      }
    });

    // голова: выходит из сетки серой точкой и наливается лаймом
    const [hc, hr] = path[head];
    const grow = phase === "wake" ? Math.min(1, phaseT / 900) : 1;
    const s = 2 + grow * 10;
    ctx.globalAlpha = alpha * 0.18 * grow;
    ctx.fillStyle = LIME;
    ctx.fillRect(px(hc) - 12, px(hr) - 12, 24, 24);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = grow < 0.5 ? GRAY : LIME;
    ctx.fillRect(Math.round(px(hc) - s / 2), Math.round(px(hr) - s / 2), Math.round(s), Math.round(s));
    ctx.globalAlpha = 1;
  }

  function showFinal() {
    build();
    if (path.length) {
      head = path.length - 1;
      phase = "hold";
      alpha = 1;
      setStage(nodes.length);
    }
    draw();
  }

  if (reduced) {
    showFinal();
    let rt;
    new ResizeObserver(() => {
      clearTimeout(rt);
      rt = setTimeout(showFinal, 150);
    }).observe(hero);
    return;
  }

  let visible = true;
  let raf = 0;
  let last = 0;

  const loop = (now) => {
    const dt = Math.min(64, now - (last || now));
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  };

  const run = () => {
    if (raf || !visible || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  build();
  reset();
  draw();

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    visible ? run() : stop();
  }).observe(hero);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : run()));

  // перестраиваем при смене размера блока (шрифты, поворот экрана);
  // мелкие колебания высоты от адресной строки мобильных игнорируем
  let rt;
  let size = [W, H];
  new ResizeObserver(() => {
    const r = hero.getBoundingClientRect();
    if (r.width === size[0] && Math.abs(r.height - size[1]) < CELL) return;
    size = [r.width, r.height];
    clearTimeout(rt);
    rt = setTimeout(() => { build(); reset(); draw(); }, 150);
  }).observe(hero);

  if (fine) {
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      cursor = { c: Math.floor((e.clientX - r.left) / CELL), r: Math.floor((e.clientY - r.top) / CELL) };
    });
    hero.addEventListener("mouseleave", () => { cursor = null; });
  }
})();
