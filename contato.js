// ============================================================
// CREDFÁCIL — CONTATO.JS
// Lógica da página de Contato (contato.html)
// Depende de: utils.js
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  initFAQ();
  initContactForm();
  initPhoneMask();
});

// ============================================================
// FAQ ACCORDION
// ============================================================

/**
 * Inicializa o accordion de perguntas frequentes
 */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Fecha todos
      items.forEach(i => i.classList.remove('open'));
      // Abre o clicado (se estava fechado)
      if (!isOpen) item.classList.add('open');
    });
  });
}

// ============================================================
// FORMULÁRIO DE CONTATO
// ============================================================

/**
 * Trata o envio do formulário com simulação de envio
 * @param {Event} e
 */
function handleContactSubmit(e) {
  e.preventDefault();

  const btn = document.getElementById('btnEnviar');
  const feedback = document.getElementById('formFeedback');

  // Validação simples
  const nome    = document.getElementById('ctNome').value.trim();
  const email   = document.getElementById('ctEmail').value.trim();
  const assunto = document.getElementById('ctAssunto').value;
  const msg     = document.getElementById('ctMensagem').value.trim();

  if (!nome || !email || !assunto || !msg) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }
  if (!email.includes('@')) {
    alert('Por favor, insira um e-mail válido.');
    return;
  }

  // Estado de loading
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Enviando…';

  // Simula requisição (1.5s)
  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-check"></i> Mensagem enviada!';
    feedback.classList.add('visible');

    // Reset após 4s
    setTimeout(() => {
      document.getElementById('contactForm').reset();
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar mensagem';
      feedback.classList.remove('visible');
    }, 4000);
  }, 1500);
}

/**
 * Inicializa o formulário de contato
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', handleContactSubmit);
}

// ============================================================
// MÁSCARA DE TELEFONE
// ============================================================

/**
 * Aplica máscara de telefone brasileiro
 */
function initPhoneMask() {
  const tel = document.getElementById('ctTelefone');
  if (!tel) return;

  tel.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) {
      v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (v.length > 6) {
      v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (v.length > 2) {
      v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    } else if (v.length > 0) {
      v = v.replace(/(\d{0,2})/, '($1');
    }
    this.value = v;
  });
}