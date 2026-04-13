// ============================================================
// CREDFÁCIL — UTILS.JS
// Funções utilitárias compartilhadas entre todas as páginas
// ============================================================

/**
 * Formata um valor numérico como moeda BRL
 * @param {number} value
 * @returns {string} Ex: "R$ 5.000,00"
 */
function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata número com separador de milhar
 * @param {number} value
 * @returns {string} Ex: "25.000"
 */
function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Aplica máscara de CPF
 * @param {string} value
 * @returns {string} Ex: "000.000.000-00"
 */
function maskCPF(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Aplica máscara de CNPJ
 * @param {string} value
 * @returns {string} Ex: "00.000.000/0000-00"
 */
function maskCNPJ(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Valida CPF com algoritmo oficial
 * @param {string} cpf
 * @returns {boolean}
 */
function validateCPF(cpf) {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11) return false;
  if (/^(\d)\1+$/.test(nums)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i);
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(nums[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i);
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === parseInt(nums[10]);
}

/**
 * Valida CNPJ com algoritmo oficial
 * @param {string} cnpj
 * @returns {boolean}
 */
function validateCNPJ(cnpj) {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14) return false;
  if (/^(\d)\1+$/.test(nums)) return false;

  const calcDigit = (nums, len) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(nums[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };

  return (
    calcDigit(nums, 12) === parseInt(nums[12]) &&
    calcDigit(nums, 13) === parseInt(nums[13])
  );
}

/**
 * Anima um elemento contando de 0 até o valor alvo
 * @param {HTMLElement} el
 * @param {number} target
 * @param {number} duration - ms
 */
function animateCounter(el, target, duration = 2000) {
  const fps = 60;
  const inc = target / (duration / (1000 / fps));
  let current = 0;

  const timer = setInterval(() => {
    current = Math.min(current + inc, target);
    el.textContent = formatNumber(Math.round(current));
    if (current >= target) clearInterval(timer);
  }, 1000 / fps);
}

/**
 * Inicia animação de contadores quando entram na viewport
 * Seleciona todos os elementos com atributo [data-target]
 */
function initCounterObserver() {
  const elements = document.querySelectorAll('[data-target]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.target);
        animateCounter(entry.target, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  elements.forEach(el => observer.observe(el));
}

/**
 * Ativa scroll suave para links âncora internos (#)
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/**
 * Debounce — limita a frequência de chamadas de uma função
 * @param {Function} func
 * @param {number} wait - ms
 * @returns {Function}
 */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
