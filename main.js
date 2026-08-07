(function () {
  "use strict";

  const data = window.__BRAND__ || {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const escHTML = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "] failed:", e); }
  }

  /* ---------------- Splash ---------------- */
  function initSplash() {
    const splash = $("[data-splash]");
    if (!splash) return;
    const hide = () => splash.classList.add("is-out");
    if (document.readyState === "complete") setTimeout(hide, 500);
    else window.addEventListener("load", () => setTimeout(hide, 350));
    setTimeout(hide, 3200);
  }

  /* ---------------- Nav ---------------- */
  function initNav() {
    const nav = $("[data-nav]");
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 40) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileNav() {
    const burger = $("[data-nav-burger]");
    const panel = $("[data-nav-mobile]");
    if (!burger || !panel) return;
    function toggle(open) {
      burger.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
      panel.dataset.open = String(open);
      document.body.style.overflow = open ? "hidden" : "";
    }
    burger.addEventListener("click", () => toggle(burger.getAttribute("aria-expanded") !== "true"));
    $$(".nav-mobile-link", panel).forEach(a => a.addEventListener("click", () => toggle(false)));
  }

  /* ---------------- Smooth anchors (native scroll) ---------------- */
  function initSmoothAnchors() {
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const navOffset = 76;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth",
      });
    });
  }

  /* ---------------- Custom cursor ---------------- */
  function initCursor() {
    const root = $("[data-cursor-root]");
    if (!root || !fineHover) return;
    document.documentElement.classList.add("has-cursor");
    const ring = $(".cursor-ring", root);
    const dot = $(".cursor-dot", root);
    let tx = 0, ty = 0, rx = 0, ry = 0, firstMove = false;

    window.addEventListener("mousemove", (e) => {
      tx = e.clientX; ty = e.clientY;
      if (dot) dot.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      if (!firstMove) {
        firstMove = true;
        rx = tx; ry = ty;
        if (ring) ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
        root.classList.add("is-ready");
      }
    }, { passive: true });

    function tick() {
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      if (ring) ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    const HOVERABLES = "a[href], button, .prop-card, .adv-card";
    document.addEventListener("mouseover", e => { if (e.target.closest(HOVERABLES)) root.classList.add("is-interactive"); });
    document.addEventListener("mouseout", e => {
      if (e.target.closest(HOVERABLES) && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(HOVERABLES)))
        root.classList.remove("is-interactive");
    });
  }

  /* ---------------- Magnetic buttons ---------------- */
  function initMagnetic() {
    if (!fineHover) return;
    $$("[data-magnetic]").forEach(el => {
      const strength = parseFloat(el.dataset.magneticStrength || "0.3");
      const inner = document.createElement("span");
      inner.className = "magnetic-inner";
      inner.style.display = "inline-flex";
      inner.style.alignItems = "center";
      inner.style.gap = "inherit";
      inner.style.willChange = "transform";
      inner.style.transition = "transform .8s cubic-bezier(0.25,0.46,0.45,0.94)";
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) - r.width / 2) * strength;
        ty = ((e.clientY - r.top) - r.height / 2) * strength;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener("mouseleave", () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
      function loop() {
        cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
        inner.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ---------------- Tilt + halo on cards ---------------- */
  function initTilt() {
    if (!fineHover) return;
    $$(".adv-card, .prop-card").forEach(card => {
      const MAX = 6;
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      card.classList.add("has-tilt");
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tx = -py * MAX; ty = px * MAX;
        card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
        if (!raf) raf = requestAnimationFrame(loop);
      });
      card.addEventListener("mouseleave", () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
      function loop() {
        cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;
        card.style.setProperty("--rx", cx.toFixed(2) + "deg");
        card.style.setProperty("--ry", cy.toFixed(2) + "deg");
        raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  function initReveals() {
    const els = $$("[data-reveal]");
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(el => io.observe(el));

    setTimeout(() => {
      $$("[data-reveal]:not(.is-revealed)").forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-revealed");
      });
    }, 6000);
  }

  /* ---------------- Split words (preserves <br>/<em>) ---------------- */
  function splitWords(el) {
    el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
    const wrap = text => text.split(/(\s+)/).map(w =>
      /^\s+$/.test(w) ? w : `<span class="split-word" aria-hidden="true">${escHTML(w)}</span>`
    ).join("");
    const html = Array.from(el.childNodes).map(node => {
      if (node.nodeType === 3) return wrap(node.textContent);
      if (node.nodeName === "BR") return "<br>";
      if (node.nodeType === 1) {
        const tag = node.tagName.toLowerCase();
        return `<${tag}>${wrap(node.textContent)}</${tag}>`;
      }
      return "";
    }).join("");
    el.innerHTML = html;
    return $$(".split-word", el);
  }

  function initSplitText() {
    if (!window.gsap) return;
    $$("[data-split]").forEach(el => {
      const parts = splitWords(el);
      if (!parts.length) return;
      gsap.set(parts, { y: 20, opacity: 0, display: "inline-block" });
      gsap.to(parts, {
        y: 0, opacity: 1, duration: 0.9, stagger: 0.035, ease: "expo.out", delay: 0.2,
      });
    });
  }

  /* ---------------- Count up ---------------- */
  function initCountUp() {
    $$("[data-count-to]").forEach(el => {
      const target = parseFloat(el.dataset.countTo);
      const decimals = (el.dataset.countTo.split(".")[1] || "").length;
      const trigger = () => {
        if (window.gsap) {
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target, duration: 1.6, ease: "power2.out",
            onUpdate: () => { el.textContent = obj.v.toFixed(decimals); },
          });
        } else {
          el.textContent = target.toFixed(decimals);
        }
      };
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { trigger(); io.unobserve(e.target); } });
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }

  /* ---------------- Pinned horizontal showcase ---------------- */
  function initShowcasePinned() {
    if (!window.gsap || !window.ScrollTrigger) return;
    const sec = $(".showcase");
    const track = $("[data-showcase]");
    if (!sec || !track) return;

    const setup = () => {
      ScrollTrigger.getAll().forEach(s => { if (s.vars.id === "showcase-pin") s.kill(); });
      const isDesktop = window.innerWidth >= 1024;
      sec.classList.toggle("is-pinned", isDesktop);
      if (!isDesktop) return;
      const trackRect = track.getBoundingClientRect();
      const distance = track.scrollWidth - window.innerWidth + trackRect.left + 40;
      if (distance <= 0) return;

      gsap.to(track, {
        x: () => -distance, ease: "none",
        scrollTrigger: {
          id: "showcase-pin",
          trigger: sec, start: "top top+=76",
          end: () => "+=" + (distance + window.innerHeight * 0.4),
          pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        }
      });
    };

    setup();
    let to;
    window.addEventListener("resize", () => {
      clearTimeout(to);
      to = setTimeout(() => { ScrollTrigger.refresh(); setup(); }, 250);
    });
  }

  /* ---------------- Testimonial rotator ---------------- */
  function initTestimonials() {
    const stage = $("[data-testi]");
    if (!stage) return;
    const slides = $$(".testi-slide", stage);
    const dots = $$("[data-testi-dot]");
    if (!slides.length) return;
    let idx = 0;
    let timer = null;

    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === idx));
      dots.forEach((d, n) => d.classList.toggle("is-active", n === idx));
    }
    function next() { show(idx + 1); }
    function startAuto() {
      if (reduced) return;
      stop();
      timer = setInterval(next, 6500);
    }
    function stop() { if (timer) clearInterval(timer); }

    dots.forEach(d => d.addEventListener("click", () => { show(parseInt(d.dataset.testiDot, 10)); startAuto(); }));
    stage.addEventListener("mouseover", stop);
    stage.addEventListener("mouseout", e => { if (!stage.contains(e.relatedTarget)) startAuto(); });

    show(0);
    startAuto();
  }

  /* ---------------- Contact form ---------------- */
  function setupContactForm() {
    const form = $("[data-contact-form]");
    const success = $("[data-contact-success]");
    if (!form || !success) return;
    const submitBtn = $("[type=submit]", form);
    const msg = $("[data-contact-success-msg]");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.classList.contains("is-sending")) return;
      if (!form.reportValidity()) return;

      form.classList.add("is-sending");
      if (submitBtn) submitBtn.disabled = true;

      await new Promise(r => setTimeout(r, 700 + Math.random() * 500));

      const rawName = form.elements.name.value.trim().split(/\s+/)[0] || "";
      if (msg) msg.textContent = `${rawName ? rawName + ", te" : "Te"} escribiremos en menos de 24 horas laborables.`;

      form.classList.add("is-sent", "is-sent-icon");
      success.setAttribute("aria-hidden", "false");
      success.classList.add("is-visible");
    });
  }

  /* ---------------- Footer year ---------------- */
  function initFooterYear() {
    const el = $("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initMobileNav, "initMobileNav");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initCursor, "initCursor");
    safe(initMagnetic, "initMagnetic");
    safe(initTilt, "initTilt");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");
    safe(initTestimonials, "initTestimonials");
    safe(setupContactForm, "setupContactForm");
    safe(initFooterYear, "initFooterYear");

    if (window.gsap) {
      safe(initSplitText, "initSplitText");
    }
    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initShowcasePinned, "initShowcasePinned");
    }

    document.documentElement.classList.remove("has-js-pending");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
