// ============================================================
// CREDFÁCIL — ANALISE.JS
// Lógica da página de simulação (analise.html)
// Depende de: utils.js, scoring.js
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  initMascaras();
  initSliders();
});

// ============================================================
// TIPO PF / PJ
// ============================================================

let currentTipo = 'pf';

/**
 * Alterna entre Pessoa Física e Pessoa Jurídica
 * @param {string} tipo - "pf" | "pj"
 */
function setTipo(tipo) {
  currentTipo = tipo;

  // Ativa aba correta
  document.getElementById('tabPF').className = 'step-tab' + (tipo === 'pf' ? ' active' : '');
  document.getElementById('tabPJ').className = 'step-tab' + (tipo === 'pj' ? ' active' : '');

  // Mostra/oculta campos exclusivos de PJ
  document.getElementById('pjExtra').style.display = tipo === 'pj' ? 'block' : 'none';

  // Ajusta labels
  document.getElementById('docLabel').textContent =
    tipo === 'pj' ? 'CPF do responsável' : 'CPF';
  document.getElementById('rendaLabel').textContent =
    tipo === 'pj' ? 'Faturamento médio mensal' : 'Renda mensal';

  // Ajusta escala do slider de renda
  const slider = document.getElementById('rendaSlider');
  slider.max  = tipo === 'pj' ? '500000' : '50000';
  slider.step = tipo === 'pj' ? '5000'   : '500';
  slider.value = tipo === 'pj' ? '50000' : '5000';
  atualizarSlider(slider, 'rendaDisplay', 'renda');
}

// ============================================================
// SLIDERS
// ============================================================

/**
 * Inicializa estado visual dos sliders ao carregar a página
 */
function initSliders() {
  const rendaSlider  = document.getElementById('rendaSlider');
  const dividasSlider = document.getElementById('dividasSlider');

  if (rendaSlider)   atualizarSlider(rendaSlider,  'rendaDisplay',  'renda');
  if (dividasSlider) atualizarSlider(dividasSlider, 'dividasDisplay', 'dividas');
}

/**
 * Atualiza o display e input hidden de um slider
 * @param {HTMLInputElement} el
 * @param {string} displayId - ID do elemento que mostra o valor formatado
 * @param {string} inputId   - ID do input hidden que guarda o valor numérico
 */
function atualizarSlider(el, displayId, inputId) {
  const val = parseInt(el.value);
  document.getElementById(displayId).textContent = formatBRL(val);
  if (inputId) document.getElementById(inputId).value = val;

  // Preenche a trilha do slider com gradiente laranja
  const pct = ((val - el.min) / (el.max - el.min)) * 100;
  el.style.background =
    `linear-gradient(to right, #FF7E2B ${pct}%, rgba(255,255,255,0.08) ${pct}%)`;
}

// ============================================================
// MÁSCARAS DE INPUT
// ============================================================

function initMascaras() {
  const cpfInput  = document.getElementById('cpf');
  const cnpjInput = document.getElementById('cnpj');

  if (cpfInput) {
    cpfInput.addEventListener('input', function () {
      this.value = maskCPF(this.value);
    });
  }
  if (cnpjInput) {
    cnpjInput.addEventListener('input', function () {
      this.value = maskCNPJ(this.value);
    });
  }
}

// ============================================================
// CHECKBOX DOS 5 C's
// ============================================================

/**
 * Adiciona/remove classe visual ao marcar/desmarcar checkbox
 * @param {HTMLInputElement} input
 * @param {string} cardId - ID do elemento .c-check pai
 */
function toggleCheck(input, cardId) {
  document.getElementById(cardId).classList.toggle('checked', input.checked);
}

// ============================================================
// SUBMIT DO FORMULÁRIO
// ============================================================

/**
 * Intercepta o submit e inicia o fluxo de análise
 * @param {Event} e
 */
function handleSubmit(e) {
  e.preventDefault();

  const nome  = document.getElementById('nome').value.trim();
  const cpf   = document.getElementById('cpf').value.trim();
  const renda  = parseInt(document.getElementById('renda').value)  || 0;
  const dividas = parseInt(document.getElementById('dividas').value) || 0;

  // Validação básica
  if (!nome || !cpf) {
    alert('Por favor, preencha nome e CPF.');
    return;
  }

  const dados = {
    nome,
    cpf,
    renda,
    dividas,
    tipo: currentTipo,
    tempoAtividade: parseInt(document.getElementById('tempoAtividade')?.value ?? '0'),
    semRestricao:   document.getElementById('semRestrição').checked,
    temPatrimonio:  document.getElementById('temPatrimonio').checked,
    temGarantia:    document.getElementById('temGarantia').checked,
  };

  mostrarLoading();

  // Simula latência do processamento (1.8s)
  setTimeout(() => {
    const resultado = calcularScore(dados);
    renderResultado(resultado, dados);
  }, 1800);
}

// ============================================================
// LOADING
// ============================================================

/**
 * Exibe tela de carregamento com passos animados
 */
function mostrarLoading() {
  const msgs = [
    'Validando CPF na Receita Federal…',
    'Consultando bureaus de crédito…',
    'Calculando score pelos 5 C\'s…',
    'Gerando análise de risco…',
  ];

  let html = `<div class="loading-state">
    <div class="loading-ring"></div>
    <div class="loading-steps">`;

  msgs.forEach((msg, i) => {
    html += `<div class="loading-step" style="animation-delay:${i * 0.3}s">
      <span class="dot"></span>${msg}
    </div>`;
  });

  html += `</div></div>`;
  document.getElementById('resultContent').innerHTML = html;
}

// ============================================================
// RENDER DO RESULTADO
// ============================================================

/**
 * Renderiza o resultado completo da análise
 * @param {Object} r   - Resultado de calcularScore()
 * @param {Object} dados - Dados originais do formulário
 */
function renderResultado(r, dados) {
  const statusIcone = r.cor === 'low'  ? 'check-circle'
    : r.cor === 'mid' ? 'exclamation-circle'
    : 'times-circle';

  // Calcula parâmetros do arco SVG
  const radius = 54, cx = 70, cy = 70;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (r.score / 1000) * circ;
  const arcColor = r.cor === 'low' ? '#00D68F'
    : r.cor === 'mid' ? '#F5C842'
    : '#FF4D6A';

  // ── Barras dos 5 C's ───────────────────────────────────────
  const csLabels = {
    carater:    'Caráter',
    capacidade: 'Capacidade',
    capital:    'Capital',
    condicoes:  'Condições',
    colateral:  'Colateral',
  };

  const csBarsHtml = Object.entries(r.pontuacaoCs)
    .map(([key, pct]) => {
      const cls = pct >= 70 ? 'good' : pct >= 40 ? 'warn' : 'bad';
      return `<div class="cs-bar-item">
        <div class="cs-bar-header">
          <span class="cs-bar-name">${csLabels[key]}</span>
          <span class="cs-bar-pct">${pct}%</span>
        </div>
        <div class="cs-bar-track">
          <div class="cs-bar-fill ${cls}" style="width:0%" data-width="${pct}%"></div>
        </div>
      </div>`;
    })
    .join('');

  // ── Recomendações ─────────────────────────────────────────
  const recsHtml = r.recomendacoes.length
    ? `<div class="recomendacoes">
        <div class="recomendacoes-title">
          <i class="fas fa-lightbulb" style="margin-right:5px"></i>Recomendações
        </div>
        ${r.recomendacoes
          .map(rec => `<div class="rec-item"><span class="rec-dot"></span>${rec}</div>`)
          .join('')}
      </div>`
    : '';

  // ── HTML principal ────────────────────────────────────────
  document.getElementById('resultContent').innerHTML = `
    <div class="result-content">

      <!-- Cabeçalho com nome e score -->
      <div class="result-header">
        <div class="result-name">
          <i class="fas fa-user-circle" style="margin-right:5px;color:var(--text-muted)"></i>
          ${dados.nome}
        </div>

        <div class="score-display">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <!-- Trilha de fundo -->
            <circle cx="${cx}" cy="${cy}" r="${radius}"
              fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="9"/>
            <!-- Arco de progresso -->
            <circle cx="${cx}" cy="${cy}" r="${radius}"
              fill="none" stroke="${arcColor}" stroke-width="9"
              stroke-linecap="round"
              stroke-dasharray="${circ}"
              stroke-dashoffset="${circ}"
              id="scoreArc"
              transform="rotate(-90 ${cx} ${cy})"
              style="transition:stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1);
                     filter:drop-shadow(0 0 8px ${arcColor}55)"/>
            <!-- Número do score -->
            <text x="${cx}" y="${cy - 4}" text-anchor="middle"
              font-family="Syne,sans-serif" font-weight="800"
              font-size="26" fill="${arcColor}" id="scoreNumSvg">0</text>
            <text x="${cx}" y="${cy + 16}" text-anchor="middle"
              font-family="DM Sans,sans-serif" font-size="11"
              fill="rgba(200,190,220,0.6)">/1000</text>
          </svg>
        </div>

        <div>
          <span class="status-badge status-${r.cor}">
            <i class="fas fa-${statusIcone}"></i> ${r.status}
          </span>
        </div>
      </div>

      <!-- Barras dos 5 C's -->
      <div class="cs-result">
        <div class="cs-result-title">Pontuação por critério</div>
        <div class="cs-bar-list">${csBarsHtml}</div>
      </div>

      <!-- Detalhes do resultado -->
      <div class="detail-grid">
        <div class="detail-item">
          <div class="d-label">Nível de risco</div>
          <div class="d-value">${r.nivel}</div>
        </div>
        <div class="detail-item">
          <div class="d-label">Limite sugerido</div>
          <div class="d-value">${formatBRL(r.limite)}</div>
        </div>
        <div class="detail-item">
          <div class="d-label">Taxa de juros</div>
          <div class="d-value">${r.taxa}</div>
        </div>
        <div class="detail-item">
          <div class="d-label">Alçada de aprovação</div>
          <div class="d-value" style="font-size:0.8rem">${r.alcada}</div>
        </div>
        <div class="detail-item">
          <div class="d-label">Data da análise</div>
          <div class="d-value" style="font-size:0.8rem">${r.dataAnalise}</div>
        </div>
        <div class="detail-item">
          <div class="d-label">Tipo</div>
          <div class="d-value">${dados.tipo.toUpperCase()}</div>
        </div>
      </div>

      ${recsHtml}

      <!-- Ações -->
      <button class="btn-reset" onclick="window.print()">
        <i class="fas fa-download" style="margin-right:6px"></i>
        Baixar relatório completo
      </button>

    </div>`;

  // ── Animações pós-render ───────────────────────────────────
  setTimeout(() => {
    // Anima arco SVG
    const arc = document.getElementById('scoreArc');
    if (arc) arc.style.strokeDashoffset = offset;

    // Conta o número animado
    const txt = document.getElementById('scoreNumSvg');
    if (txt) {
      let current = 0;
      const steps = 60;
      const inc = r.score / steps;
      const timer = setInterval(() => {
        current = Math.min(current + inc, r.score);
        txt.textContent = Math.round(current);
        if (current >= r.score) clearInterval(timer);
      }, 1200 / steps);
    }

    // Anima barras dos C's
    document.querySelectorAll('.cs-bar-fill').forEach(el => {
      setTimeout(() => { el.style.width = el.dataset.width; }, 200);
    });
  }, 80);
}

// ============================================================
// RESET DO FORMULÁRIO
// ============================================================

/**
 * Reseta o formulário e volta ao estado inicial do resultado
 */
function resetForm() {
  document.getElementById('creditForm').reset();
  document.getElementById('pjExtra').style.display = 'none';

  // Remove classes dos checkboxes
  ['check-carater', 'check-capital', 'check-colateral'].forEach(id => {
    document.getElementById(id).classList.remove('checked');
  });

  // Reinicia sliders
  const rendaSlider = document.getElementById('rendaSlider');
  rendaSlider.value = 5000;
  atualizarSlider(rendaSlider, 'rendaDisplay', 'renda');

  const dividasSlider = document.getElementById('dividasSlider');
  dividasSlider.value = 0;
  atualizarSlider(dividasSlider, 'dividasDisplay', 'dividas');

  // Volta ao estado vazio do resultado
  document.getElementById('resultContent').innerHTML = `
    <div class="result-empty">
      <div class="empty-icon">
        <i class="fas fa-file-invoice-dollar"></i>
      </div>
      <p>Preencha o formulário ao lado para ver seu score de crédito</p>
    </div>`;
}
