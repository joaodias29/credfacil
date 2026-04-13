// ============================================================
// CREDFÁCIL — COMO-FUNCIONA.JS
// Lógica da página "Como Funciona" (como-funciona.html)
// Depende de: utils.js
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  initCounterObserver();
  initStepAnimations();
});

/**
 * Anima as etapas da timeline ao entrar na viewport
 */
function initStepAnimations() {
  const steps = document.querySelectorAll('.timeline-step');
  if (!steps.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.animation = `fadeInUp 0.5s ease ${i * 0.1}s both`;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  steps.forEach(step => {
    step.style.opacity = '0';
    observer.observe(step);
  });
}