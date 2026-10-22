/* ============================================================
   NAVEGAÇÃO
   ============================================================ */
function showScreen(name) {
  qsa('.screen').forEach(s => s.classList.add('hidden'));
  qs('#screen-' + name).classList.remove('hidden');
  state.currentScreen = name;
  // No Processamento, o breadcrumb NÃO tem "voltar" nos fluxos do Autopilot.
  // HUB: o operador processa por passos, pode voltar ao cockpit ou à validação.
  // Autopilot: a tarefa foi devolvida ao motor; a única saída é o botão de baixo
  // ("Voltar para minhas tarefas"), liberado ao fim do reprocessamento — deixar um
  // "voltar" no topo daria uma saída paralela indevida. Ver autopilot.md.
  if (name === 'execution') {
    const t = getTaskById(state.currentTaskId);
    const backs = qs('#exec-bc-backs');
    if (backs) backs.style.display = (t && t.origin === 'autopilot') ? 'none' : 'contents';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  refreshIcons();
  if (typeof _syncAcompanhamentoBtn === 'function') _syncAcompanhamentoBtn();
}

function _checkEditGuard(onProceed) {
  const taskId = state.currentTaskId;
  if (!taskId || !state._editMode[taskId]) { onProceed(); return; }
  showConfirmModal({
    title: 'Modificações não salvas',
    message: 'Sair agora vai descartar as alterações feitas no formulário. Deseja continuar?',
    confirmLabel: 'Sair sem salvar',
    danger: true,
    onConfirm: onProceed,
  });
}

function goHome() {
  _checkEditGuard(() => {
    if (state.currentTaskId) { state._editMode[state.currentTaskId] = false; delete state._editDraft[state.currentTaskId]; }
    state.currentTaskId = null;
    renderHome();
    showScreen('home');
  });
}

/* ============================================================
   RENDER: HOME
   ============================================================ */
/* ============================================================
   LISTA DO OPERADOR — módulo compartilhado (home dos fluxos + hub)
   FONTE ÚNICA: editar aqui reflete nos 11 fluxos E no lista-operador.html.
   Recebe dados (array flat com `status`) + um handler de clique.
   ============================================================ */

// typeCode → arquivo do fluxo (navegação, path B). Cobre vocabulário fino
// (lista-operador) e grosso (mocks dos fluxos).
const OL_FLOW_HREF = {
  admissao_clt: 'admissao-clt.html', admissao_rpa: 'admissao-rpa.html',
  admissao_estagiario: 'admissao-estagiario.html', admissao_rpa_planilha: 'admissao-rpa-planilha.html',
  ferias: 'ferias-aviso-previo.html', ferias_aviso_previo: 'ferias-aviso-previo.html', ferias_calculo: 'ferias-calculo.html',
  rescisao: 'rescisao-calculo.html', rescisao_aviso_previo: 'rescisao-aviso-previo.html', rescisao_calculo: 'rescisao-calculo.html',
  afastamento: 'afastamento.html', afastamento_empregado: 'afastamento.html',
  apontamentos: 'apontamentos.html', apontamentos_folha: 'apontamentos.html',
  geral: 'solicitacao-geral.html', solicitacao_geral: 'solicitacao-geral.html',
};
function olFlowHref(t) { return (t && (t.flowHref || OL_FLOW_HREF[t.typeCode])) || null; }
function olFamily(typeCode) {
  const c = String(typeCode || '');
  if (c.indexOf('admissao') === 0) return 'admissao';
  if (c.indexOf('ferias') === 0) return 'ferias';
  if (c.indexOf('rescisao') === 0) return 'rescisao';
  if (c.indexOf('afastamento') === 0) return 'afastamento';
  if (c.indexOf('apontamentos') === 0) return 'apontamentos';
  return 'geral';
}

const _ol = { tarefas: [], onOpenTask: null, filtros: { cliente: null, tipo: null, estado: null }, openFlt: null, atribuidasOpen: true, entregues: 0, page: 1 };

// Navegação padrão (path B): abre o fluxo certo daquela tarefa.
function _olNavigate(id) {
  const t = _ol.tarefas.find(x => x.id === id), href = olFlowHref(t);
  if (href) window.location.href = `${href}?ref=lista&taskId=${encodeURIComponent(id)}`;
}
function olOpenTask(id) { (_ol.onOpenTask || _olNavigate)(id); }
// Clique na linha → sempre espiar (mesmo gesto do olho), qualquer estado. Entrar
// na tarefa é só pelo botão do modal. Padronizado em todo o projeto. (modal-espiada.md)
function olRowClick(id) { olVerDetalhes(id); }

function olMount(containerEl, opts) {
  if (!containerEl) return;
  opts = opts || {};
  _ol.tarefas = opts.tarefas || [];
  _ol.onOpenTask = opts.onOpenTask || _olNavigate;
  _ol.filtros = { cliente: null, origem: null, tipo: null, estado: null };
  _ol.openFlt = null;
  _ol.atribuidasOpen = true;
  _ol.entregues = opts.entregues || 0;
  _ol.page = 1;
  containerEl.innerHTML = `
    <div class="container-wide" style="min-width: 800px;">
      <div class="home-top-grid" style="grid-template-columns: 1fr;">
        <div class="section-card" id="ol-header" style="margin-bottom: 0;"></div>
        <!-- COCKPIT-957: card de stats da fila ocultado (foco/enxugar; SLA em risco já aparece por linha). Ocultar ≠ remover — pode voltar. -->
        <!-- <div class="section-card" id="ol-stats" style="margin-bottom: 0; padding: 0;"></div> -->
      </div>
      <div class="flt-bar"><div class="pp-wrap" id="ol-period"></div><div id="ol-filtros" style="display:contents;"></div></div>
      <div id="ol-atribuidas"></div>
      <div class="section-head" id="ol-list-head"></div>
      <div id="ol-list"></div>
      <div style="text-align:center; font-size:12px; color:var(--text-tertiary); padding:16px 0;">
        <i data-lucide="info" class="w-3 h-3" style="display:inline; vertical-align:-2px;"></i>
        Os filtros valem para as duas listas. Ordenadas por data de recebimento, mais novas no topo.
      </div>
    </div>`;
  // Filtro "Solicitado em" — mesmo módulo de calendário do acompanhamento (ppCreate).
  // Default sem filtro (mostra tudo); recorta por data de recebimento quando escolhido.
  ppCreate('ol', {
    mount: 'ol-period', emptyLabel: 'Solicitado em', allowEmpty: true, initialRange: null,
    onChange: () => { _ol.page = 1; olRenderAtribuidas(); olRenderList(); },
    onOpen: () => { if (_ol.openFlt) { _ol.openFlt = null; olRenderFiltros(); } },
  });
  olRenderHeader(); olRenderStats(); olRenderFiltros(); olRenderAtribuidas(); olRenderList(); ppRender('ol');
  refreshIcons();
  if (typeof _syncAcompanhamentoBtn === 'function') _syncAcompanhamentoBtn();
}

// --- derivações ---
function olEstadoDe(t) {
  // Cliente respondeu deixou de ser estado (COCKPIT-959): a tarefa volta a
  // contar como "Em execução", então o filtro de Estado a pega como ativa.
  if (t.status === 'active' || (t.status === 'stationed' && t.clientResponded)) return 'active';
  if (t.status === 'stationed') return 'espera';
  return 'fila';
}
function olGetAtiva() { return _ol.tarefas.find(t => t.status === 'active') || null; }
function olGetProxima() {
  const w = _ol.tarefas.filter(t => t.status === 'queue');
  w.sort((a, b) => slaToMinutes(a.sla) - slaToMinutes(b.sla));
  return w[0] || null;
}
// Atribuídas a mim = TODAS as tarefas do operador, em qualquer status aberto
// (em execução — incluindo as cujo cliente respondeu — e aguardando cliente).
// O status vira pill na linha e é filtrável pelo filtro "Estado". Ordenação por
// data de recebimento, mais nova no topo (sortByRecebimento) — sem pins.
function olGetAtribuidas() {
  return sortByRecebimento(_ol.tarefas.filter(t => t.status === 'active' || t.status === 'stationed'));
}
// Fila geral = tarefas não atribuídas a ninguém (status 'queue').
function olBaseList() {
  return sortByRecebimento(_ol.tarefas.filter(t => t.status === 'queue'));
}
const OL_PAGE_SIZE = 20;
const OL_ESTADO_OPTS = [{ v: 'active', label: 'Em execução' }, { v: 'espera', label: 'Em espera' }, { v: 'fila', label: 'Na fila' }];
// Opções de Cliente/Tipo cobrem as DUAS listas (atribuídas + fila geral),
// já que os filtros do topo valem para ambas.
function olClienteOpts() {
  const seen = new Set(), out = [];
  _ol.tarefas.forEach(t => { if (!seen.has(t.cnpj)) { seen.add(t.cnpj); out.push({ v: t.cnpj, label: t.clientName, cnpj: t.cnpj }); } });
  return out.sort((a, b) => a.label.localeCompare(b.label));
}
function olTipoOpts() {
  const seen = new Set(), out = [];
  _ol.tarefas.forEach(t => { if (!seen.has(t.typeCode)) { seen.add(t.typeCode); out.push({ v: t.typeCode, label: t.type }); } });
  return out.sort((a, b) => a.label.localeCompare(b.label));
}
// Origem: lista COMPLETA das origens da BHub (não só as presentes na fila) — no
// protótipo, o pool de origens reais (ORIGEM_POOL); na produção, o cadastro de
// parceiros de origem. Dedupe + ordem A→Z. (COCKPIT-1005)
function olOrigemOpts() {
  return [...new Set(ORIGEM_POOL)].sort((a, b) => a.localeCompare(b)).map(o => ({ v: o, label: o }));
}
function olTemFiltro() { return Object.values(_ol.filtros).some(Boolean) || !!ppGetRange('ol'); }
function olPassa(t) {
  const f = _ol.filtros;
  if (f.cliente && t.cnpj !== f.cliente) return false;
  // Origem é dado POR CLIENTE (resolveClientOps), não fica na tarefa — mesmo dado
  // que a coluna Cliente exibe (COCKPIT-685).
  if (f.origem && resolveClientOps(t).origem !== f.origem) return false;
  if (f.tipo && t.typeCode !== f.tipo) return false;
  if (f.estado && olEstadoDe(t) !== f.estado) return false;
  if (!ppInRange('ol', t)) return false; // filtro "Solicitado em" (data de recebimento)
  return true;
}

// --- render ---
function olRenderHeader() {
  const el = document.getElementById('ol-header'); if (!el) return;
  const ativa = olGetAtiva(), proxima = olGetProxima(), alvo = ativa || proxima, cont = !!ativa;
  let btn;
  if (alvo) {
    const ic = cont ? 'arrow-right' : 'play', lb = cont ? 'Continuar tarefa atual' : 'Pegar próxima tarefa';
    btn = `<button class="btn btn-primary btn-lg" onclick="olOpenTask('${alvo.id}')"><i data-lucide="${ic}" class="w-4 h-4"></i>${lb}</button>`;
  } else {
    btn = `<button class="btn btn-primary btn-lg" disabled title="Nada na fila pra pegar agora" style="opacity:0.5;cursor:not-allowed;"><i data-lucide="play" class="w-4 h-4"></i>Pegar próxima tarefa</button>`;
  }
  let prev = '';
  if (alvo) {
    prev = `<div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
      <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">${cont ? 'Em execução' : 'Próxima'}</div>
      <div style="font-size:13.5px;color:var(--text-primary);font-weight:600;line-height:1.3;">${esc(alvo.clientName)}</div>
      <div style="font-size:12px;color:var(--text-secondary);">${esc(alvo.type)} · Solicitado em ${esc(solicitadoEmLabel(alvo))}</div></div>`;
  }
  el.innerHTML = `<div>
    <div style="font-size:12px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.08em;font-weight:500;margin-bottom:6px;">Operação DP</div>
    <h1 style="font-size:24px;font-weight:700;margin-bottom:6px;">Olá, Daniele</h1>
    <p style="color:var(--text-secondary);font-size:14px;">Sua fila do dia. Deixe o sistema pegar a próxima pela prioridade ou escolha manualmente na lista.</p>
    <div style="margin-top:16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">${btn}${prev}</div></div>`;
}
function olRenderStats() {
  const el = document.getElementById('ol-stats'); if (!el) return;
  const ts = _ol.tarefas;
  const fila = ts.filter(t => t.status === 'active' || t.status === 'queue').length;
  const risco = ts.filter(t => (t.status === 'active' || t.status === 'queue') && (t.slaStatus === 'risk' || t.slaStatus === 'overdue')).length;
  const espera = ts.filter(t => t.status === 'stationed').length;
  const resp = ts.filter(t => t.status === 'stationed' && t.clientResponded).length;
  const entregues = _ol.entregues || 0;
  const row = (label, sub, val, cls) => `<div class="stats-row"><div><div class="stats-row-label">${label}</div><div class="stats-row-sublabel">${sub}</div></div><div class="stats-row-value ${cls || ''}">${val}</div></div>`;
  // Total na fila e Entregues sempre; SLA em risco e Em espera só quando > 0.
  let html = row('Total na fila', 'ativa + próximas', fila);
  if (risco > 0) html += row('SLA em risco', 'priorize estas', risco, 'warning');
  if (espera > 0) html += row('Em espera', resp > 0 ? `${resp} já com resposta` : 'aguardando cliente', espera);
  html += row('Entregues', 'concluídas hoje', entregues, 'brand');
  el.innerHTML = html;
}
// Bloco "Atribuídas a mim" — componente recolhível (.espera-wrap, reaproveitado
// do antigo bloco de espera). Nasce expandido: é o conjunto de trabalho do
// operador, pra ele transitar entre as próprias tarefas. Clique na linha abre
// a tarefa no ponto/etapa em que ela está (olOpenTask). Respeita os filtros do
// topo (olPassa), que valem para as duas listas.
function olRenderAtribuidas() {
  const el = document.getElementById('ol-atribuidas'); if (!el) return;
  const ts = olGetAtribuidas().filter(olPassa);
  if (!ts.length) { el.innerHTML = ''; return; }
  // Olho E clique → sempre espiar (olVerDetalhes, aba Resumo). Igual à fila e ao
  // acompanhamento: o gesto de espiar é o mesmo em todo o projeto. Entrar na tarefa
  // é só pelo botão do modal. (COCKPIT-956 — modal-espiada.md)
  const rows = ts.map(t => _renderTaskRow(t, { clickable: true, onClick: `olVerDetalhes('${t.id}')`, withEye: true })).join('');
  el.innerHTML = `<div class="section-head"><div class="sh-text"><div class="sh-title">Atribuídas a mim (${ts.length})</div><div class="sh-sub">Suas tarefas em andamento, aguardando cliente ou já respondidas · ordenadas por data de recebimento</div></div></div>
    <div class="lo-table-wrap">${_taskTableHead()}${rows}</div>`;
  refreshIcons();
}

// Olho → resumo da tarefa (contexto + mensagem do cliente), sem entrar.
function olVerDetalhes(id) {
  const t = _ol.tarefas.find(x => x.id === id);
  if (!t) return;
  const isQueue = t.status === 'queue';
  // Resumo da tarefa unificado (3 abas) — fonte única, mesmo modal do painel.
  taskSummaryModal(t, { context: 'fila', primary: { label: isQueue ? 'Atribuir a mim e executar' : 'Abrir tarefa', icon: isQueue ? 'play' : 'arrow-right', onClick: `closeTaskSummary(); olOpenTask('${id}')` } });
}

// Clique numa atribuída EM ESPERA → modal com a conversa com o cliente (mesmo
// modelo de chat dos fluxos: history-list + renderHistoryMessage). Como o hub
// não roda o state de um fluxo, a conversa vem de state.messages (se houver) ou
// é montada a partir da clientMessage da tarefa.
function olAbrirConversa(id) {
  const t = _ol.tarefas.find(x => x.id === id);
  if (!t) return;
  // Atribuída → mesmo modal de resumo, abrindo já na aba Conversa.
  taskSummaryModal(t, { context: 'atribuida', tab: 'conversa', primary: { label: 'Abrir tarefa', icon: 'arrow-right', onClick: `closeTaskSummary(); _olNavigate('${id}')` } });
}

