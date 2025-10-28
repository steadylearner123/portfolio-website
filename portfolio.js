// script.js - unified behaviors: year, enhanced smooth scroll, active nav, Formspree handler
document.addEventListener('DOMContentLoaded', () => {
  // --- 1) Set current year in footer ---
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- 2) Enhanced smooth scrolling for internal links (accounts for sticky header) ---
  function getHeaderHeight() {
    const header = document.querySelector('header');
    return header ? header.offsetHeight : 0;
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      // compute scroll position considering header
      const headerHeight = getHeaderHeight();
      const extra = 12; // breathing room in px
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - extra;

      window.scrollTo({ top, behavior: 'smooth' });

      // update active class immediately
      document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
      if (a.classList) a.classList.add('active');
    });
  });

  // --- 3) Update active nav link on scroll ---
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const sections = navLinks.map(link => {
    try {
      return document.querySelector(link.getAttribute('href'));
    } catch {
      return null;
    }
  });

  function updateActive() {
    if (!navLinks.length) return;
    const headerHeight = getHeaderHeight();
    const scrollPos = window.scrollY + headerHeight + 20; // slightly below header
    let currentIndex = 0;

    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      if (!s) continue;
      // take element top relative to document
      const top = s.offsetTop;
      if (top <= scrollPos) currentIndex = i;
    }

    navLinks.forEach((l, idx) => l.classList.toggle('active', idx === currentIndex));
  }

  // run once and on scroll/resize (resize can change header height)
  updateActive();
  window.addEventListener('scroll', updateActive);
  window.addEventListener('resize', updateActive);

  // --- 4) Formspree contact form handler (no keys/secrets) ---
  // Assumes <form id="contact-form" action="https://formspree.io/f/XXX" method="POST">
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('contact-feedback');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // show immediate sending feedback
      if (feedback) {
        feedback.style.color = '#94a3b8';
        feedback.textContent = 'Sending…';
      }

      // Honeypot anti-spam: if filled, treat as spam and return fake success
      const honeypot = form.querySelector('input[name="website"]');
      if (honeypot && honeypot.value) {
        if (feedback) {
          feedback.style.color = '#94a3b8';
          feedback.textContent = 'Thanks — message received.';
        }
        form.reset();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : 'Send';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      const data = new FormData(form);

      try {
        const res = await fetch(form.action, {
          method: form.method || 'POST',
          headers: { 'Accept': 'application/json' },
          body: data
        });

        if (res.ok) {
          if (feedback) {
            feedback.style.color = '#7ee787'; // soft green
            feedback.textContent = '✅ Thanks — your message was sent. I will reply as soon as I can.';
          }
          form.reset();
        } else {
          let json = null;
          try { json = await res.json(); } catch (err) { /* ignore */ }
          console.error('Formspree returned an error:', json);
          if (feedback) {
            feedback.style.color = '#ffb4b4';
            feedback.textContent = '⚠️ Oops — something went wrong. Please try again or email chyrilworks@gmail.com';
          }
        }
      } catch (err) {
        console.error('Network error while sending form:', err);
        if (feedback) {
          feedback.style.color = '#ffb4b4';
          feedback.textContent = '❌ Network error — please try again later or email chyrilworks@gmail.com';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      }
    });
  }
});
