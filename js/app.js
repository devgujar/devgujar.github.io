/* ============================================================
   Portfolio interactivity — Devanand Gujar
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Mobile nav toggle ---------- */
    const navToggle = document.getElementById('navToggle');
    const nav = document.getElementById('primaryNav');

    if (navToggle && nav) {
      navToggle.addEventListener('click', function () {
        const open = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      // Close on nav-link click (mobile)
      nav.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
          nav.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    /* ---------- Header shadow + back-to-top + scroll-spy ---------- */
    const header = document.getElementById('siteHeader');
    const backToTop = document.getElementById('backToTop');
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));

    function updateActiveLink() {
      const scrollPos = window.scrollY + 120;
      let currentId = sections.length ? sections[0].id : '';
      for (const sec of sections) {
        if (sec.offsetTop <= scrollPos) currentId = sec.id;
      }
      navLinks.forEach(function (link) {
        const target = link.getAttribute('href').replace('#', '');
        link.classList.toggle('active', target === currentId);
      });
    }

    function onScroll() {
      const y = window.scrollY;
      if (header) header.classList.toggle('scrolled', y > 10);
      if (backToTop) backToTop.classList.toggle('show', y > 400);
      updateActiveLink();
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- Reveal-on-scroll ---------- */
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('visible'); });
    }

    /* ---------- Typed effect for hero role ---------- */
    const typed = document.getElementById('typed');
    if (typed) {
      const roles = [
        'AI-Driven Quality Engineering Leader',
        'Automation Framework Architect',
        'GitHub Copilot (GH-300) Certified',
        'ISTQB® Foundation . ISTQB® Advanced Test Analyst',
        'Java · Selenium · Playwright · TestNG Specialist',
        'DevSecOps & CI/CD Practitioner'
      ];
      let ri = 0, ci = 0, deleting = false;

      function tick() {
        const word = roles[ri];
        typed.textContent = word.substring(0, ci);
        if (!deleting && ci < word.length) { ci++; setTimeout(tick, 70); }
        else if (deleting && ci > 0)        { ci--; setTimeout(tick, 35); }
        else {
          if (!deleting) { deleting = true; setTimeout(tick, 1400); }
          else           { deleting = false; ri = (ri + 1) % roles.length; setTimeout(tick, 250); }
        }
      }
      setTimeout(tick, 600);
    }

    /* ---------- Footer year ---------- */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- Contact form ---------- */
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');

    if (form) {
      const submitBtn = form.querySelector('[type="submit"]');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const message = form.message.value.trim();

        if (!name || !email || !message) {
          status.textContent = 'Please fill in all fields.';
          status.className = 'form-status error';
          return;
        }
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(email)) {
          status.textContent = 'Please enter a valid email address.';
          status.className = 'form-status error';
          return;
        }

        const originalBtnText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending…';
        }
        status.textContent = 'Sending your message…';
        status.className = 'form-status';

        fetch('https://emailapi.devgujar.workers.dev/api/sendemail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, email: email, message: message })
        })
          .then(function (res) {
            if (!res.ok) throw new Error('Request failed with status ' + res.status);
            status.textContent = 'Thanks for reaching out! Your message has been sent.';
            status.className = 'form-status success';
            form.reset();
          })
          .catch(function () {
            status.textContent = 'Sorry, something went wrong. Please try again later.';
            status.className = 'form-status error';
          })
          .finally(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalBtnText;
            }
          });
      });
    }

    /* ---------- Default to About section on load ---------- */
    if (!window.location.hash) {
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        window.scrollTo({ top: aboutSection.offsetTop, behavior: 'auto' });
      }
    }

    // Initial paint
    onScroll();
  });
})();

