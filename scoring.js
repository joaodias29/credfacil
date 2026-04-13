// ============================================================
// CREDFÁCIL — SCORING.JS
// Motor de cálculo de crédito baseado nos 5 C's do Crédito
// Alinhado ao Manual de Políticas CredFácil (Março 2026)
// ============================================================

/**
 * Calcula o score de crédito pelos 5 C's do Crédito
 *
 * Pesos por critério (total máximo: 1000 pontos):
 *   C1 Caráter    → até 200 pts  (histórico de inadimplência)
 *   C2 Capacidade → até 250 pts  (renda e comprometimento)
 *   C3 Capital    → até 150 pts  (patrimônio)
 *   C4 Condições  → até 100 pts  (cenário econômico — fixo)
 *   C5 Colateral  → até 100 pts  (garantias)
 *   PJ Bônus      → até  50 pts  (tempo de atividade da empresa)
 *
 * Tabela de risco (Manual CredFácil, seções 3.4 e 4.4):
 *   700–1000 → Baixo  → Analista Sênior
 *   400–699  → Médio  → Gerente de Crédito
 *   0–399    → Alto   → Comitê de Crédito
 *
 * @param {Object} dados
 * @param {string}  dados.nome
 * @param {string}  dados.cpf
 * @param {string}  dados.tipo         - "pf" | "pj"
 * @param {number}  dados.renda        - Renda mensal (PF) ou faturamento médio (PJ)
 * @param {number}  dados.dividas      - Total de compromissos mensais atuais
 * @param {boolean} dados.semRestricao - Sem pendências SPC/Serasa
 * @param {boolean} dados.temPatrimonio- Possui bens/investimentos
 * @param {boolean} dados.temGarantia  - Oferece colateral
 * @param {number}  dados.tempoAtividade - PJ: 0=<6m, 1=6m-1a, 2=1-3a, 3=>3a
 * @returns {Object} Resultado completo da análise
 */
function calcularScore(dados) {
  const comprometimento = dados.renda > 0
    ? dados.dividas / dados.renda
    : 1;

  // ── C1: CARÁTER (0–200) ────────────────────────────────────
  // Histórico de pagamentos e registros de inadimplência
  const pontoCarater = dados.semRestricao ? 200 : 60;

  // ── C2: CAPACIDADE (0–250) ─────────────────────────────────
  // Renda/faturamento e comprometimento financeiro
  let pontoCapacidade = calcularCapacidade(dados.tipo, dados.renda);

  // Penalidade por alto comprometimento de renda
  if (comprometimento > 0.50) {
    pontoCapacidade = Math.round(pontoCapacidade * 0.40);
  } else if (comprometimento > 0.30) {
    pontoCapacidade = Math.round(pontoCapacidade * 0.70);
  }

  // ── C3: CAPITAL (0–150) ────────────────────────────────────
  // Patrimônio líquido, bens e investimentos
  const pontoCapital = dados.temPatrimonio ? 150 : 50;

  // ── C4: CONDIÇÕES (0–100) ──────────────────────────────────
  // Cenário econômico — simulado como neutro-positivo
  const pontoCondicoes = 70;

  // ── C5: COLATERAL (0–100) ──────────────────────────────────
  // Garantias oferecidas (imóveis, veículos, investimentos)
  const pontoColateral = dados.temGarantia ? 100 : 30;

  // ── BÔNUS PJ: Tempo de atividade (0–50) ───────────────────
  const bonusPJ = dados.tipo === 'pj'
    ? [0, 15, 30, 50][dados.tempoAtividade] ?? 0
    : 0;

  // ── SCORE FINAL ────────────────────────────────────────────
  let score = Math.round(
    pontoCarater + pontoCapacidade + pontoCapital +
    pontoCondicoes + pontoColateral + bonusPJ
  );
  score = Math.min(1000, Math.max(0, score));

  // ── CLASSIFICAÇÃO DE RISCO ─────────────────────────────────
  const classificacao = classificarRisco(score, dados.tipo);

  // ── PONTUAÇÕES PERCENTUAIS POR C ───────────────────────────
  const pontuacaoCs = {
    carater:    Math.round((pontoCarater    / 200) * 100),
    capacidade: Math.round((pontoCapacidade / 250) * 100),
    capital:    Math.round((pontoCapital    / 150) * 100),
    condicoes:  Math.round((pontoCondicoes  / 100) * 100),
    colateral:  Math.round((pontoColateral  / 100) * 100),
  };

  // ── RECOMENDAÇÕES PERSONALIZADAS ───────────────────────────
  const recomendacoes = gerarRecomendacoes(dados, comprometimento);

  return {
    score,
    pontuacaoCs,
    recomendacoes,
    dataAnalise: new Date().toLocaleDateString('pt-BR'),
    ...classificacao,
  };
}

/**
 * Calcula pontuação de Capacidade conforme tipo (PF ou PJ)
 * @param {string} tipo
 * @param {number} renda
 * @returns {number}
 */
function calcularCapacidade(tipo, renda) {
  if (tipo === 'pf') {
    if (renda >= 10000) return 250;
    if (renda >= 5000)  return 200;
    if (renda >= 3000)  return 150;
    if (renda >= 1500)  return 90;
    return 40;
  }

  // PJ — baseado em faturamento
  if (renda >= 100000) return 250;
  if (renda >= 50000)  return 210;
  if (renda >= 20000)  return 170;
  if (renda >= 10000)  return 120;
  return 50;
}

/**
 * Classifica o risco e retorna condições conforme Manual CredFácil
 * @param {number} score
 * @param {string} tipo
 * @returns {Object}
 */
function classificarRisco(score, tipo) {
  // Tabela: Manual CredFácil — seções 3.4 (PF) e 4.4 (PJ)
  if (score >= 700) {
    return {
      nivel:  'Baixo',
      status: 'APROVADO',
      cor:    'low',
      limite: tipo === 'pf' ? 20000 : 200000,
      taxa:   '1,5% a.m.',
      alcada: 'Analista Sênior',
    };
  }

  if (score >= 400) {
    return {
      nivel:  'Médio',
      status: 'RISCO MÉDIO',
      cor:    'mid',
      limite: tipo === 'pf' ? 10000 : 100000,
      taxa:   '2,8% a.m.',
      alcada: 'Gerente de Crédito',
    };
  }

  return {
    nivel:  'Alto',
    status: 'NEGADO',
    cor:    'high',
    limite: tipo === 'pf' ? 5000 : 30000,
    taxa:   '4,5% a.m.',
    alcada: 'Comitê de Crédito',
  };
}

/**
 * Gera lista de recomendações personalizadas com base nos pontos fracos
 * @param {Object} dados
 * @param {number} comprometimento
 * @returns {string[]}
 */
function gerarRecomendacoes(dados, comprometimento) {
  const recs = [];

  if (!dados.semRestricao) {
    recs.push('Quite pendências no SPC/Serasa para melhorar o critério Caráter');
  }
  if (comprometimento > 0.30) {
    recs.push(`Seu comprometimento de renda está em ${Math.round(comprometimento * 100)}% — reduza para abaixo de 30%`);
  }
  if (dados.tipo === 'pf' && dados.renda < 3000) {
    recs.push('Aumentar a renda comprovável melhora significativamente o critério Capacidade');
  }
  if (dados.tipo === 'pj' && dados.renda < 20000) {
    recs.push('Faturamento abaixo de R$ 20.000 limita o critério Capacidade para PJ');
  }
  if (!dados.temPatrimonio) {
    recs.push('Acumular patrimônio (imóvel, investimentos) fortalece o critério Capital');
  }
  if (!dados.temGarantia) {
    recs.push('Oferecer um bem como garantia pode desbloquear melhores condições de crédito');
  }
  if (dados.tipo === 'pj' && dados.tempoAtividade < 2) {
    recs.push('Empresas com mais de 1 ano de atividade têm avaliação mais favorável');
  }

  return recs;
}
