const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- Menú móvil ----------
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu-main');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

// ---------- Año del footer ----------
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

// ---------- Formularios ----------
// Por ahora abren el correo del visitante con el mensaje armado.
// PENDIENTE: conectar a Formspree o al CRM cuando Pily lo decida.
const CONTACT_EMAIL = 'contactopilymodrono@gmail.com';
document.querySelectorAll('form[data-mailto]').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const body = [...data.entries()]
      .filter(([, v]) => String(v).trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(form.dataset.mailto)}&body=${encodeURIComponent(body)}`;
  });
});

// ---------- Contadores ----------
function runCounter(el) {
  const target = Number(el.dataset.count);
  const prefix = el.dataset.prefix || '';
  if (reduceMotion) { el.textContent = prefix + target.toLocaleString('es-VE'); return; }
  const dur = 1600, start = performance.now();
  const step = now => {
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = prefix + Math.round(target * eased).toLocaleString('es-VE');
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- Entradas al hacer scroll ----------
const REVEAL = [
  'main h2', 'main .eyebrow', 'main .lead', '.card', '.stat', '.pillar', '.level', 'article.post',
  '.quote-card', '.book-cover', '.portrait', '.modules li', '.check li', '.creds li',
  'form.contact', '.tl-item', '.btns'
].join(',');

if (!reduceMotion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js');
  const items = [...document.querySelectorAll(REVEAL)].filter(el => !el.closest('.hero h1'));
  items.forEach(el => {
    // Escalonado entre hermanos del mismo tipo (tarjetas, pasos, etc.)
    const sibs = [...el.parentElement.children].filter(s => s.matches(REVEAL));
    el.style.setProperty('--i', Math.min(sibs.indexOf(el), 6));
    el.setAttribute('data-reveal', '');
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('in');
      io.unobserve(el);
      el.querySelectorAll('[data-count]').forEach(runCounter);
      if (el.matches('[data-count]')) runCounter(el);
      // Al terminar, se suelta el control para que el hover (inclinación) funcione
      setTimeout(() => el.removeAttribute('data-reveal'), 1400);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => io.observe(el));
} else {
  document.querySelectorAll('[data-count]').forEach(runCounter);
  document.querySelectorAll('.tl-item').forEach(el => el.classList.add('in'));
}

// ---------- Inclinación de tarjetas y del libro ----------
if (finePointer && !reduceMotion) {
  const tilt = (el, max) => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--ry');
      el.style.removeProperty('--rx');
    });
  };
  document.querySelectorAll('.card').forEach(el => tilt(el, 6));
  const book = document.querySelector('.book-cover');
  if (book) tilt(book, 28);
}

// ---------- Scroll: parallax del fondo y líneas que se llenan ----------
if (!reduceMotion) {
  const patterns = [...document.querySelectorAll('.pattern')];
  const levels = document.querySelector('.levels');
  let ticking = false;
  const onScroll = () => {
    const vh = window.innerHeight;
    patterns.forEach(p => {
      const r = p.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      p.style.setProperty('--py', `${(r.top * -0.18).toFixed(1)}px`);
    });
    if (levels) {
      const r = levels.getBoundingClientRect();
      const p = Math.min(Math.max((vh * .75 - r.top) / r.height, 0), 1);
      levels.style.setProperty('--p', p.toFixed(3));
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();
}
