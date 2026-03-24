/* ─── Nav scroll shadow ─── */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

/* ─── Scroll-reveal for sections ─── */
const revealEls = document.querySelectorAll(
  '.about-grid, .about-card-inner, .exp-card, .project-card, .skill-group, .contact-inner'
);

revealEls.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger cards in a grid
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

// Add stagger delays to grid children
document.querySelectorAll('.projects-grid .project-card').forEach((el, i) => {
  el.dataset.delay = i * 120;
});
document.querySelectorAll('.experience-list .exp-card').forEach((el, i) => {
  el.dataset.delay = i * 80;
});
document.querySelectorAll('.skills-grid .skill-group').forEach((el, i) => {
  el.dataset.delay = i * 100;
});

revealEls.forEach(el => observer.observe(el));

/* ─── Smooth active nav link highlighting ─── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.style.color = 'var(--pink-600)';
          }
        });
      }
    });
  },
  { rootMargin: '-40% 0px -40% 0px' }
);

sections.forEach(sec => sectionObserver.observe(sec));
