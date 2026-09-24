/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
let state = {};
const OPERATOR_NAME = 'Daniele Ribeiro';

function _initState() {
  const cfg = window.FLOW_CONFIG;
  const fresh = cfg.getInitialState();
  state = {
    currentScreen: 'home',
    currentTaskId: null,
    active: null,
    queue: fresh.queue || [],
    stationed: fresh.stationed || [],
    completed: fresh.completed || [],
    messages: fresh.messages || {},
    notifications: fresh.notifications || [],
    _execProgress: {},
    _execActions: {},
    _execStepExpanded: {},
    _gdocsFiles: {},
    _askClientFiles: [],
    _gdocsSkipped: {},
    _editMode: {},
    _editDraft: {},
    _editLog: {},
  };
}

/* ============================================================
   HELPERS
   ============================================================ */
function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
function refreshIcons() { if (window.lucide) lucide.createIcons(); }

function slaBadge(status, sla) {
  if (status === 'risk') return `<span class="badge badge-warning"><i data-lucide="alert-triangle" class="w-3 h-3"></i> SLA em risco · ${sla}</span>`;
  if (status === 'overdue') return `<span class="badge badge-danger"><i data-lucide="alert-octagon" class="w-3 h-3"></i> SLA estourado</span>`;
  return `<span class="badge badge-neutral"><i data-lucide="clock" class="w-3 h-3"></i> ${sla}</span>`;
}

function deadlineBadge(status, deadline) {
  if (status === 'overdue') return `<span class="badge badge-danger"><i data-lucide="timer-off" class="w-3 h-3"></i> prazo ${deadline}</span>`;
  if (status === 'risk')    return `<span class="badge badge-warning"><i data-lucide="timer" class="w-3 h-3"></i> prazo ${deadline}</span>`;
  return `<span class="badge badge-info"><i data-lucide="timer" class="w-3 h-3"></i> prazo ${deadline}</span>`;
}

function getTaskById(id) {
  if (state.active && state.active.id === id) return state.active;
  return state.queue.find(t => t.id === id) ||
         state.stationed.find(t => t.id === id) ||
         state.completed.find(t => t.id === id);
}

function slaToMinutes(sla) {
  if (!sla) return Infinity;
  let total = 0;
  const hMatch = sla.match(/(\d+)\s*h/i);
  const mMatch = sla.match(/(\d+)\s*min/i);
  if (hMatch) total += parseInt(hMatch[1], 10) * 60;
  if (mMatch) total += parseInt(mMatch[1], 10);
  return total || Infinity;
}

function computeDeadline(receivedAt, sla) {
  if (!receivedAt || !sla) return '—';
  const [h, m] = receivedAt.split(':').map(Number);
  const mins = slaToMinutes(sla);
  if (!isFinite(mins)) return '—';
  const total = h * 60 + m + mins;
  const dh = Math.floor(total / 60) % 24;
  const dm = total % 60;
  return `${String(dh).padStart(2, '0')}:${String(dm).padStart(2, '0')}`;
}

function sortQueueBySLA() {
  state.queue.sort((a, b) => slaToMinutes(a.sla) - slaToMinutes(b.sla));
}

// Ordenação padrão das listas (regra fechada): por data de recebimento, mais nova
// no topo. createdDaysAgo ascendente (0 = hoje = mais recente); desempate pela hora
// de recebimento (receivedAt) mais tarde primeiro. Fonte única — usada pela fila do
// operador e pelo painel de acompanhamento. Sem pins (nada forçado no topo).
function _receivedMinutes(t) {
  const m = String(t.receivedAt || '').match(/(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0;
}
function sortByRecebimento(list) {
  return list.sort((a, b) =>
    (a.createdDaysAgo || 0) - (b.createdDaysAgo || 0) || _receivedMinutes(b) - _receivedMinutes(a));
}

function getTypeMeta(typeCode) {
  const meta = window.FLOW_CONFIG.TYPE_METADATA;
  return (meta && meta[typeCode]) || { icon: 'file-text', label: 'Solicitação', desc: '—', color: '#64748b' };
}

/* ---- Helpers da tabela densa V1 (compartilhados com lista-operador / gerente) ---- */
const TYPE_ICONS = {
  admissao_clt:          'user-plus',
  admissao_rpa:          'briefcase',
  admissao_estagiario:   'graduation-cap',
  admissao_rpa_planilha: 'clipboard-list',
  ferias:                'calendar-check',
  ferias_aviso_previo:   'calendar-check',
  ferias_calculo:        'calculator',
  rescisao:              'receipt',
  rescisao_aviso_previo: 'calendar-x',
  rescisao_calculo:      'receipt',
  afastamento_empregado: 'user-x',
  apontamentos_folha:    'file-spreadsheet',
  solicitacao_geral:     'inbox',
};
function getTypeIcon(typeCode) { return TYPE_ICONS[typeCode] || 'file-text'; }

function esc(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// "Hoje" do protótipo (data fixa pra demos consistentes)
const MOCK_TODAY = { dia: 14, mes: 5, ano: 2026 };

function _pad2(n) { return String(n).padStart(2, '0'); }

function computePrazo(t) {
  const [rh, rm] = (t.receivedAt || '09:00').split(':').map(Number);
  const slaMin = slaToMinutes(t.sla) || 0;
  let dia = MOCK_TODAY.dia, mes = MOCK_TODAY.mes, ano = MOCK_TODAY.ano;
  let totalMin = rh * 60 + rm + slaMin;
  if (totalMin >= 24 * 60) { totalMin -= 24 * 60; dia += 1; }
  if (t.slaStatus === 'overdue') { dia -= 1; if (dia < 1) { dia = 30; mes -= 1; } }
  const dh = Math.floor(totalMin / 60) % 24;
  const dm = totalMin % 60;
  return { dateStr: `${_pad2(dia)}/${_pad2(mes)}/${ano}`, timeStr: `${_pad2(dh)}:${_pad2(dm)}`, status: t.slaStatus || 'normal' };
}

// Data dd/mm/aa a partir de "quantos dias atrás", relativo a MOCK_TODAY. Rollback
// simples de mês (protótipo: no máx. 1 dia atrás nos mocks).
function _dmyFromDaysAgo(daysAgo) {
  let dia = MOCK_TODAY.dia - (daysAgo || 0), mes = MOCK_TODAY.mes, ano = MOCK_TODAY.ano;
  while (dia < 1) { mes -= 1; if (mes < 1) { mes = 12; ano -= 1; } dia += 30; }
  return `${_pad2(dia)}/${_pad2(mes)}/${String(ano).slice(-2)}`;
}
// Header: "Solicitado em dd/mm/aa hh:mm" (data derivada de createdDaysAgo + receivedAt).
function solicitadoEmLabel(t) {
  return `${_dmyFromDaysAgo(t.createdDaysAgo)} ${t.receivedAt || ''}`.trim();
}
// Header (concluída): "Concluído em dd/mm/aa hh:mm" (data de finishedDaysAgo, hora extraída de finishedAt).
function concluidoEmLabel(t) {
  const hora = String(t.finishedAt || '').match(/\d{1,2}:\d{2}/);
  return `${_dmyFromDaysAgo(t.finishedDaysAgo)}${hora ? ' ' + hora[0] : ''}`;
}
// Célula "Solicitado em" das TABELAS de lista: data em cima, horário embaixo (2 linhas,
// coluna estreita). Fonte única — fila do operador e painel de acompanhamento.
function solicitadoEmCellHtml(t) {
  const data = _dmyFromDaysAgo(t.createdDaysAgo);
  const hora = t.receivedAt || '';
  return `<div class="prazo-cell"><div class="prazo-when">${esc(data)}</div>${hora ? `<div class="prazo-when" style="color:var(--text-secondary);font-weight:400;">${esc(hora)}</div>` : ''}</div>`;
}

/* ============================================================
   Seletor de período (presets + calendário de range) — MÓDULO
   COMPARTILHADO. Fonte única: usado pelo painel de acompanhamento e
   pela fila do operador (filtro "Solicitado em"). Mudou aqui, muda nos
   dois. Cada tela cria uma instância (ppCreate) com seu estado/callback.
   "Hoje" gira em torno do MOCK_TODAY do protótipo.
   ============================================================ */
const PP_MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PP_DOWS = ['S','T','Q','Q','S','S','D']; // semana começa na segunda
function ppToday() { return new Date(MOCK_TODAY.ano, MOCK_TODAY.mes - 1, MOCK_TODAY.dia); }
function _ppStrip(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function _ppAddDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function _ppDaysAgo(n) { return _ppAddDays(ppToday(), -(n || 0)); }
function _ppSameDay(a, b) { return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function _ppFmt(d) { return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); }
const PP_PRESETS = [
  { id:'hoje', label:'Hoje', range:() => ({ from:ppToday(), to:ppToday() }) },
  { id:'ontem', label:'Ontem', range:() => ({ from:_ppDaysAgo(1), to:_ppDaysAgo(1) }) },
  { id:'7d', label:'Últimos 7 dias', range:() => ({ from:_ppDaysAgo(6), to:ppToday() }) },
  { id:'30d', label:'Últimos 30 dias', range:() => ({ from:_ppDaysAgo(29), to:ppToday() }) },
  { id:'mes', label:'Este mês', range:() => ({ from:new Date(MOCK_TODAY.ano, MOCK_TODAY.mes - 1, 1), to:ppToday() }) },
  { id:'mespassado', label:'Mês passado', range:() => ({ from:new Date(MOCK_TODAY.ano, MOCK_TODAY.mes - 2, 1), to:new Date(MOCK_TODAY.ano, MOCK_TODAY.mes - 1, 0) }) },
];

const _pp = {}; // registry: id -> instância
function ppCreate(id, cfg) {
  const init = cfg.initialRange || null;
  const base = (init ? init.to : ppToday());
  _pp[id] = {
    mount: cfg.mount, range: init, calMonth: new Date(base.getFullYear(), base.getMonth(), 1),
    calPick: null, open: false, onChange: cfg.onChange || function () {}, onOpen: cfg.onOpen || null,
    emptyLabel: cfg.emptyLabel || 'Período', allowEmpty: cfg.allowEmpty !== false,
  };
  return _pp[id];
}
function ppGetRange(id) { return _pp[id] ? _pp[id].range : null; }
function ppLabel(inst) {
  const r = inst.range;
  if (!r) return inst.emptyLabel;
  for (const p of PP_PRESETS) { const pr = p.range(); if (_ppSameDay(pr.from, r.from) && _ppSameDay(pr.to, r.to)) return p.label; }
  return _ppSameDay(r.from, r.to) ? _ppFmt(r.from) : `${_ppFmt(r.from)} – ${_ppFmt(r.to)}`;
}
function ppRender(id) {
  const inst = _pp[id]; if (!inst) return;
  const el = document.getElementById(inst.mount); if (!el) return;
  // "Ver todos" (só quando o filtro pode ficar vazio, ex.: fila) — 1º da lista e
  // destacado quando não há período aplicado; clicar volta a mostrar tudo.
  const verTodos = inst.allowEmpty ? `<button class="pp-preset ${!inst.range ? 'active' : ''}" onclick="event.stopPropagation(); ppClear('${id}')">Ver todos</button>` : '';
  const presets = PP_PRESETS.map(p => {
    const pr = p.range();
    const active = inst.range && !inst.calPick && _ppSameDay(pr.from, inst.range.from) && _ppSameDay(pr.to, inst.range.to);
    return `<button class="pp-preset ${active ? 'active' : ''}" onclick="event.stopPropagation(); ppApplyPreset('${id}','${p.id}')">${p.label}</button>`;
  }).join('');
  const pop = inst.open
    ? `<div class="pp-pop"><div class="pp-presets">${verTodos}${presets}</div><div class="pp-cal">${_ppCalHtml(id)}<div class="pp-cal-hint">${inst.calPick ? 'Escolha a data final' : 'Clique pra escolher um intervalo'}</div></div></div>`
    : '';
  el.innerHTML = `<button class="pp-btn ${inst.open ? 'open' : ''} ${inst.range ? 'has-val' : ''}" onclick="event.stopPropagation(); ppToggle('${id}')"><i data-lucide="calendar" style="width:15px;height:15px;"></i><span>${esc(ppLabel(inst))}</span><i data-lucide="chevron-down" style="width:15px;height:15px;"></i></button>${pop}`;
  refreshIcons();
}
function _ppCalHtml(id) {
  const inst = _pp[id], m = inst.calMonth, y = m.getFullYear(), mo = m.getMonth();
  const startDow = (new Date(y, mo, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const from = inst.range ? _ppStrip(inst.range.from) : null, to = inst.range ? _ppStrip(inst.range.to) : null, pick = inst.calPick ? _ppStrip(inst.calPick) : null;
  let cells = '';
  for (let i = 0; i < startDow; i++) cells += `<div class="pp-cal-day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = new Date(y, mo, d); let cls = '';
    if (pick) { if (_ppSameDay(ds, pick)) cls = 'picked'; }
    else if (from && to) { if (ds >= from && ds <= to) cls = 'in-range'; if (_ppSameDay(ds, from)) cls += ' range-start'; if (_ppSameDay(ds, to)) cls += ' range-end'; }
    if (_ppSameDay(ds, ppToday())) cls += ' today';
    cells += `<div class="pp-cal-day ${cls}" onclick="event.stopPropagation(); ppCalPick('${id}',${y},${mo},${d})">${d}</div>`;
  }
  return `<div class="pp-cal-head"><button onclick="event.stopPropagation(); ppCalNav('${id}',-1)"><i data-lucide="chevron-left" style="width:16px;height:16px;"></i></button><span>${PP_MONTHS[mo]} ${y}</span><button onclick="event.stopPropagation(); ppCalNav('${id}',1)"><i data-lucide="chevron-right" style="width:16px;height:16px;"></i></button></div><div class="pp-cal-grid">${PP_DOWS.map(d => `<div class="pp-cal-dow">${d}</div>`).join('')}${cells}</div>`;
}
function ppToggle(id) {
  const inst = _pp[id]; if (!inst) return;
  inst.open = !inst.open; inst.calPick = null;
  if (inst.open) { const b = inst.range ? inst.range.to : ppToday(); inst.calMonth = new Date(b.getFullYear(), b.getMonth(), 1); if (inst.onOpen) inst.onOpen(); }
  ppRender(id);
}
function ppApplyPreset(id, pid) {
  const inst = _pp[id], p = PP_PRESETS.find(x => x.id === pid); if (!inst || !p) return;
  inst.range = p.range(); inst.calPick = null; inst.open = false; inst.onChange(); ppRender(id);
}
function ppClear(id) {
  const inst = _pp[id]; if (!inst) return;
  inst.range = null; inst.calPick = null; inst.open = false; inst.onChange(); ppRender(id);
}
function ppCalNav(id, delta) {
  const inst = _pp[id]; if (!inst) return;
  inst.calMonth = new Date(inst.calMonth.getFullYear(), inst.calMonth.getMonth() + delta, 1); ppRender(id);
}
function ppCalPick(id, y, mo, d) {
  const inst = _pp[id]; if (!inst) return;
  const date = new Date(y, mo, d);
  if (!inst.calPick) { inst.calPick = date; ppRender(id); return; }
  let from = inst.calPick, to = date; if (to < from) { const tmp = from; from = to; to = tmp; }
  inst.range = { from, to }; inst.calPick = null; inst.open = false; inst.onChange(); ppRender(id);
}
function ppCloseIfOutside(id, target, selector) {
  const inst = _pp[id];
  if (inst && inst.open && !target.closest(selector)) { inst.open = false; inst.calPick = null; ppRender(id); }
}
// Filtro: a data de recebimento da tarefa (createdDaysAgo) cai no range da instância?
function ppInRange(id, t) {
  const r = ppGetRange(id); if (!r) return true;
  const d = _ppStrip(_ppDaysAgo(t.createdDaysAgo));
  return d >= _ppStrip(r.from) && d <= _ppStrip(r.to);
}

function prazoCellHtml(t) {
  if (t.status === 'completed') return `<div class="prazo-cell"><div class="prazo-when" style="color:var(--success);font-weight:600;">Entregue</div>${t.finishedAt?`<div class="client-cnpj">${esc(t.finishedAt)}</div>`:''}</div>`;
  if (t.status === 'cancelled') return `<div class="prazo-cell"><div class="prazo-when" style="color:var(--danger);font-weight:600;">Cancelada</div>${t.cancelledAt?`<div class="client-cnpj">${esc(t.cancelledAt)}</div>`:''}</div>`;
  const p = computePrazo(t);
  let tag = '';
  if (p.status === 'risk') {
    tag = `<span class="prazo-tag risk"><i data-lucide="alert-triangle" class="w-3 h-3"></i>Em risco</span>`;
  } else if (p.status === 'overdue') {
    tag = `<span class="prazo-tag overdue"><i data-lucide="alert-octagon" class="w-3 h-3"></i>Estourado</span>`;
  }
  const whenCls = p.status === 'overdue' ? 'prazo-when overdue' : 'prazo-when';
  return `<div class="prazo-cell"><div class="${whenCls}">${p.dateStr}<span class="sep">·</span>${p.timeStr}</div>${tag}</div>`;
}

// ── ERP operado + Origem: FONTE ÚNICA pra TODOS os protótipos ───────────────
// São dados POR CLIENTE (não por tarefa). Os protótipos são mocks, então
// simulamos com valores REAIS do Cockpit: ERP de silver_customers_customer.operations_erp
// e origem de silver_customers_origin.name.
// resolveClientOps(): se a tarefa já traz erpOperado/origem (clientes curados da
// lista), usa esses; senão gera um par real ESTÁVEL por CNPJ a partir dos pools.
// Assim qualquer protótipo — atual ou novo — já mostra dado coerente sem editar
// tarefa por tarefa. Mudou aqui (pools), mudou em todos os protótipos.
const ERP_POOL = ['DOMINIO_141935','DOMINIO_141935','DOMINIO_111057','DOMINIO_85223','DOMINIO_115398','DOMINIO_143257','DOMINIO_95072','DOMINIO_165133','DOMINIO_178895','OUTROS_ERP_PARCEIRO','TOTVS_PROPRIO','NA'];
const ORIGEM_POOL = ['ContJet','Efforts','Partwork','BR Experts','BHub','CTZ','São Lucas','Quality','Accord','Carnevale','SERAC','Valor'];
// Clientes curados (por CNPJ) — garante que o MESMO cliente mostre o MESMO ERP/origem
// em qualquer protótipo (lista, fluxos…). Licença 141935 repetida = mesmo login.
const CLIENT_OPS_OVERRIDE = {
  '18452771000109': { erpOperado: 'DOMINIO_141935',     origem: 'ContJet' },    // Padaria Bom Dia ME
  '40221099000144': { erpOperado: 'DOMINIO_111057',     origem: 'Efforts' },    // Tech Studio Criativo
  '12998301000122': { erpOperado: 'DOMINIO_141935',     origem: 'ContJet' },    // Mercearia Central
  '07119554000187': { erpOperado: 'DOMINIO_143257',     origem: 'Partwork' },   // Construtora Solo Firme
  '23880041000112': { erpOperado: 'DOMINIO_115398',     origem: 'BR Experts' }, // Restaurante Bella Vista
  '55401778000150': { erpOperado: 'DOMINIO_141935',     origem: 'ContJet' },    // Logística Express
  '60118220000109': { erpOperado: 'OUTROS_ERP_PARCEIRO',origem: 'Quality' },    // Doce Lar Confeitaria
  '88553107000167': { erpOperado: 'DOMINIO_85223',      origem: 'BHub' },       // Auto Center Roda Solta
  '15220881000130': { erpOperado: 'DOMINIO_95072',      origem: 'CTZ' },        // Café da Esquina
  '33011997000155': { erpOperado: 'DOMINIO_165133',     origem: 'São Lucas' },  // Salão Beleza Pura
  '21448770000115': { erpOperado: 'NA',                 origem: 'BHub' },       // Padaria São Pedro (ERP vazio → "-")
  '07882115000109': { erpOperado: 'TOTVS_PROPRIO',      origem: 'Efforts' },    // Indústria Alfa
};
function cnpjDigits(c) { return (c || '').replace(/\D/g, ''); }
function resolveClientOps(task) {
  const d = cnpjDigits(task && task.cnpj);
  if (CLIENT_OPS_OVERRIDE[d]) return CLIENT_OPS_OVERRIDE[d];
  if (task && (task.erpOperado || task.origem)) {
    return { erpOperado: task.erpOperado || '', origem: task.origem || '' };
  }
  let h = 0; for (let i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) >>> 0;
  return { erpOperado: ERP_POOL[h % ERP_POOL.length], origem: ORIGEM_POOL[Math.floor(h / 7) % ORIGEM_POOL.length] };
}

// Deixa o ERP operado legível, no MESMO texto que o Cockpit mostra. O valor cru
// vem do Cockpit (cockpit.silver_customers_customer.operations_erp), ex.:
// "DOMINIO_141935" → "Domínio - Licença 141935". Vazio/NA → "-".
// A licença (nº) é o eixo de agrupamento: mesma licença Domínio = mesmo login.
function formatErp(raw) {
  if (!raw || raw === 'NA' || raw === 'PENDENTE_TOMBAMENTO' || raw === 'NAO_TOMBADO_CONTRATO_ENCERRADO') return '-';
  const m = raw.match(/^DOMINIO_(\d+)$/);
  if (m) return 'Domínio - Licença ' + m[1];
  const map = {
    DOMINIO_PARCEIRO: 'Domínio - Parceiro',
    DOMINIO_FRANQUEADO: 'Domínio - Franqueado',
    OUTROS_ERP_PARCEIRO: "Outros ERP's do Parceiro",
    TOTVS_PROPRIO: 'TOTVS Próprio',
    BPO_FINANCEIRO_SEM_ERP: 'BPO Financeiro (sem ERP)',
    SENIOR: 'Senior',
  };
  return map[raw] || raw;
}

// ERP operado e Origem, no padrão de texto do Cockpit (rótulo neutro + valor em
// destaque). Reaproveitado na lista e no header da tarefa. ERP sempre aparece
// (mostra "-" quando não há), igual ao Cockpit.
function domMetaParts(t) {
  const ops = resolveClientOps(t);
  // ERP e Origem SEMPRE aparecem; vazio vira "-" (igual ao Cockpit).
  const erp = `<span class="dom-meta"><span class="dom-k">ERP operado:</span> <span class="dom-v">${esc(formatErp(ops.erpOperado))}</span></span>`;
  const origem = `<span class="dom-meta"><span class="dom-k">Origem:</span> <span class="dom-v">${esc(ops.origem || '-')}</span></span>`;
  return { erp, origem };
}

// Colaborador da solicitação: na tarefa (lista) ou no formData (fluxos).
// Só aparece em processos que têm o campo de EMPREGADO (nome + CPF no início do
// form): admissão CLT/estagiário, férias, rescisão, afastamento. Ficam de fora:
// RPA (é prestador, não empregado), apontamentos em folha (vários, sem nome único)
// e solicitação geral (sem vínculo a 1 colaborador). Ver handoff colaborador-origem-erp.md.
const TIPOS_SEM_COLABORADOR = ['admissao_rpa', 'admissao_rpa_planilha', 'apontamentos_folha', 'solicitacao_geral'];
function taskColaborador(t) {
  if (!t || TIPOS_SEM_COLABORADOR.includes(t.typeCode)) return '';
  return t.colaborador || (t.formData && t.formData.colaborador && t.formData.colaborador.nome) || '';
}

function statePillHtml(t, opts) {
  opts = opts || {};
  // Concluída / Cancelada não aparecem na fila, mas aparecem no painel de
  // acompanhamento (mesma fonte de linha). Additivo — não muda a fila.
  if (t.status === 'completed') return `<span class="state-pill" style="color:var(--success);border-color:var(--success);"><i data-lucide="check-circle-2" class="w-3 h-3"></i>Concluída</span>`;
  if (t.status === 'cancelled') return `<span class="state-pill" style="color:var(--danger);border-color:var(--danger);"><i data-lucide="x-circle" class="w-3 h-3"></i>Cancelada</span>`;
  let cls, icon, label;
  // Tarefa cujo cliente já respondeu volta a ser uma atribuída normal: exibe
  // "Em execução" como qualquer ativa (COCKPIT-959). O sinal de que o cliente
  // respondeu deixa de ser estado e passa pra tarja dentro da tarefa / bolinha.
  if (t.status === 'processing') { cls = 'em-processamento'; icon = 'refresh-cw'; label = 'Em processamento'; }
  else if (t.status === 'active' || (t.status === 'stationed' && t.clientResponded)) { cls = 'em-execucao'; icon = 'play-circle'; label = 'Em execução'; }
  else if (t.status === 'stationed') { cls = 'em-espera'; icon = 'pause-circle'; label = 'Em espera'; }
  else if (opts.isNext) { cls = 'proxima'; icon = 'play-circle'; label = 'Próxima'; }
  else { cls = 'na-fila'; icon = 'list'; label = 'Na fila'; }
  return `<span class="state-pill ${cls}"><i data-lucide="${icon}" class="w-3 h-3"></i>${label}</span>`;
}

function _taskTableHead() {
  return `
    <div class="lo-table-head">
      <div></div>
      <div class="lo-dot-cell"></div>
      <div class="h-cell">Cliente</div>
      <div class="h-cell">Processo</div>
      <div class="h-cell">Estado</div>
      <div class="h-cell">Solicitado em</div>
      <div></div>
    </div>
  `;
}

function _renderTaskRow(t, opts) {
  opts = opts || {};
  const isNext = !!opts.isNext;
  const clickable = !!opts.clickable;
  const withEye = !!opts.withEye;
  const onClick = opts.onClick || '';

  let cls = 'lo-row';
  if (clickable) cls += ' clickable';
  if (t.status === 'active' || (t.status === 'stationed' && t.clientResponded)) cls += ' execucao';
  else if (t.status === 'stationed') cls += ' stationed-row';
  else if (isNext) cls += ' next-up';

  const eyeAction = opts.eyeClick || onClick;
  const eyeBtn = withEye && eyeAction
    ? `<button class="icon-btn" title="Ver detalhes" onclick="event.stopPropagation(); ${eyeAction}"><i data-lucide="eye" class="w-3.5 h-3.5"></i></button>`
    : '';

  const onClickAttr = clickable && onClick ? ` onclick="${onClick}"` : '';

  return `
    <div class="${cls}"${onClickAttr}>
      <div class="type-icon" title="${esc(t.type || '')}"><i data-lucide="${getTypeIcon(t.typeCode)}" class="w-4 h-4"></i></div>
      <div class="lo-dot-cell">${(t.status === 'stationed' && t.clientResponded) ? '<span class="update-dot" title="Cliente respondeu — você ainda não abriu"></span>' : ''}</div>
      <div class="lo-solic">
        <span class="client-name">${esc(t.clientName || '')}</span>
        ${(() => { const m = domMetaParts(t); return `<span style="display:flex;flex-wrap:wrap;align-items:center;gap:0 6px;"><span class="client-cnpj">${esc(t.cnpj || '')}</span>${m.origem ? `<span class="dom-sep" style="margin:0;">·</span>${m.origem}` : ''}</span>${m.erp}`; })()}
      </div>
      <div class="lo-tipo">${t.origin === 'autopilot' ? '<div class="lo-proc-top"><span class="tag-autopilot">HITL</span></div>' : ''}<span class="lo-proc">${esc(t.type || '')}</span>${(() => { const c = taskColaborador(t); return c ? `<span class="lo-colab">${esc(c)}</span>` : ''; })()}</div>
      <div>${statePillHtml(t, { isNext })}</div>
      <div>${solicitadoEmCellHtml(t)}</div>
      <div style="display: flex; justify-content: flex-end;">${eyeBtn}</div>
    </div>
  `;
}

