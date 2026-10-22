/* ============================================================
   MODAL ÚNICO "RESUMO DA TAREFA" (3 abas) — FONTE ÚNICA
   Reusado na fila do operador E no painel de acompanhamento. É o resumo
   da tarefa que qualquer pessoa (gestor) ou o próprio operador consulta.
   Abas: Resumo · Conversa · O que foi feito. (COCKPIT-179 / COCKPIT-956)
   opts: { context, tab, primary:{label,icon,onClick}|null }
   ============================================================ */
let _tsmTask = null;

// Normaliza os dados da solicitação em seções colapsáveis {titulo, campos:[{l,v,changed}]}.
// Campos por PROCESSO (definidos uma vez, valem pra toda tarefa daquele tipo —
// igual o que a Admissão CLT já fazia, estendido aos demais). No real, é onde o
// modal lê os campos do formulário daquele processo. Mesmas seções/subseções do form.
function secoesPorTipo(t) {
  const colab = t.colaborador || '—';
  const S = (titulo, campos) => ({ titulo, campos });
  const MAP = {
    admissao_clt: [
      { titulo: '1. Geral', subsecoes: [
        S('Dados básicos', { 'Nome': colab, 'Nome social': '—', 'CPF': '123.456.789-00', 'Cargo': 'Analista', 'Matrícula': '0318', 'Serviço (sede onde ficará alocado)': 'Matriz', 'Departamento': 'Administrativo', 'Centro de custo': 'CC 01 — Matriz', 'Sindicato': 'Sindicato dos Comerciários' }),
        S('Admissão', { 'Primeiro Emprego': 'NÃO', 'Categoria': 'Mensalista', 'Vínculo Empregatício': 'Celetista', 'Data da admissão': '15/05/2026', 'Salário': 'R$ 2.800,00' }),
        S('Contrato de Experiência', { 'Contrato de Experiência': '45', 'Dias de Prorrogação': '45', 'Data fim da experiência': '29/06/2026', 'Data fim da prorrogação': '13/08/2026' }),
        S('Horário', { 'Jornada': '09:00 AS 18:00 DE SEGUNDA A SEXTA', 'Carga Horária': '220' }),
      ]},
      { titulo: '2. Profissional', subsecoes: [
        S('CTPS', { 'Número': '5518234', 'Série': '0034-SP', 'Data de Expedição': '10/02/2021', 'UF': 'SP' }),
        S('PIS', { 'Número': '120.4567.89-0', 'Data de cadastro': '10/02/2021' }),
        S('Pagamento', { 'Forma de Pagamento': 'Crédito em conta', 'Banco': '237 — Bradesco', 'Agência': '1582', 'Conta': '00112345-6' }),
      ]},
      { titulo: '3. Pessoal', subsecoes: [
        S('Endereço', { 'CEP': '01310-100', 'Logradouro': 'Av. Paulista, 1000', 'Bairro': 'Bela Vista', 'Cidade/UF': 'São Paulo/SP' }),
        S('Dados pessoais', { 'Data de nascimento': '12/03/1996', 'Estado civil': 'Solteiro(a)', 'Nacionalidade': 'Brasileira' }),
      ]},
    ],
    admissao_estagiario: [
      { titulo: '1. Geral', subsecoes: [
        S('Dados básicos', { 'Nome': colab, 'CPF': '456.789.123-00', 'Cargo': 'Estagiário', 'Centro de custo': 'CC 02 — Operações' }),
        S('Instituição de ensino', { 'Instituição': 'Universidade Anhembi', 'Curso': 'Gastronomia', 'Nível': 'Superior', 'Previsão de conclusão': '12/2027' }),
      ]},
      { titulo: '2. Estágio', subsecoes: [
        S('Contrato', { 'Bolsa-auxílio': 'R$ 1.200,00', 'Auxílio-transporte': 'R$ 220,00', 'Carga horária': '6h/dia', 'Início': '02/06/2026', 'Término previsto': '02/06/2027' }),
      ]},
    ],
    admissao_rpa: [
      { titulo: '1. Prestador', subsecoes: [
        S('Dados', { 'Prestador': colab || 'Prestador de serviço', 'CPF/CNPJ': '987.654.321-00', 'Serviço': 'Consultoria de design', 'ISS retido': 'Sim' }),
      ]},
      { titulo: '2. Pagamento', subsecoes: [
        S('Valores', { 'Valor bruto': 'R$ 3.500,00', 'INSS': 'R$ 385,00', 'IRRF': 'R$ 262,50', 'Valor líquido': 'R$ 2.852,50', 'Competência': '05/2026' }),
      ]},
    ],
    ferias_calculo: [
      { titulo: '1. Férias', subsecoes: [
        S('Cálculo', { 'Colaborador': colab, 'Período aquisitivo': '2024/2025', 'Dias de férias': '30', 'Abono pecuniário': 'Não', 'Adiantamento 13º': 'Não', 'Início do gozo': '10/06/2026', 'Fim do gozo': '09/07/2026' }),
      ]},
    ],
    ferias_aviso_previo: [
      { titulo: '1. Férias', subsecoes: [
        S('Aviso de férias', { 'Colaborador': colab, 'Período aquisitivo': '2024/2025', 'Início do gozo': '10/06/2026', 'Fim do gozo': '09/07/2026', 'Dias': '30', 'Abono pecuniário': 'Não' }),
      ]},
    ],
    rescisao_calculo: [
      { titulo: '1. Rescisão', subsecoes: [
        S('Cálculo', { 'Colaborador': colab, 'Tipo de rescisão': 'Sem justa causa', 'Data do aviso': '01/05/2026', 'Data do desligamento': '31/05/2026', 'Aviso prévio': 'Indenizado', 'Saldo de FGTS': 'R$ 4.120,00' }),
      ]},
    ],
    rescisao_aviso_previo: [
      { titulo: '1. Rescisão', subsecoes: [
        S('Aviso prévio', { 'Colaborador': colab, 'Tipo de rescisão': 'Sem justa causa', 'Data do aviso': '01/05/2026', 'Data do desligamento': '31/05/2026', 'Aviso prévio': 'Indenizado' }),
      ]},
    ],
    afastamento_empregado: [
      { titulo: '1. Afastamento', subsecoes: [
        S('Dados', { 'Colaborador': colab, 'Motivo': 'Auxílio-doença (INSS)', 'Início': '05/05/2026', 'Previsão de retorno': '05/07/2026', 'CID': 'M54.5', 'Médico responsável': 'Dr. Paulo Menezes — CRM 123456' }),
      ]},
    ],
    apontamentos_folha: [
      { titulo: '1. Apontamentos', subsecoes: [
        S('Competência', { 'Competência': '05/2026', 'Tipo de apontamento': 'Horas extras + faltas', 'Horas extras': '12h50', 'Faltas': '2', 'Adicional noturno': 'Conferir', 'Observação': 'Planilha enviada pelo cliente' }),
      ]},
    ],
    solicitacao_geral: [
      { titulo: 'Solicitação', subsecoes: [ S('Detalhes', { 'Assunto': 'Declaração de vínculo', 'Descrição': t.clientMessage || 'Emissão de documento solicitada pelo cliente.' }) ]},
    ],
  };
  return MAP[t.typeCode] || [{ titulo: 'Dados da solicitação', subsecoes: [ S('Dados', { 'Colaborador': colab }) ] }];
}
// Rótulos amigáveis para as chaves do formData (abas e subseções). Dicionário
// para as mais comuns; o resto cai no humanizador (camelCase/snake → Título).
const _TSM_LABELS = {
  geral: 'Geral', profissional: 'Profissional', pessoal: 'Pessoal', dependentes: 'Dependentes', documentos: 'Documentos', anexos: 'Anexos',
  dadosBasicos: 'Dados básicos', admissao: 'Admissão', contratoExperiencia: 'Contrato de experiência', horario: 'Horário',
  ctps: 'CTPS', pis: 'PIS', pagamento: 'Pagamento', sindicais: 'Dados sindicais',
  endereco: 'Endereço', pessoais: 'Dados pessoais', contato: 'Contato', deficiencia: 'Deficiência',
  calculo: 'Cálculo', ferias: 'Férias', rescisao: 'Rescisão', afastamento: 'Afastamento', apontamentos: 'Apontamentos',
  valores: 'Valores', competencia: 'Competência', dados: 'Dados', detalhes: 'Detalhes', servico: 'Serviço', contrato: 'Contrato',
};
function _tsmHumanize(key) {
  if (_TSM_LABELS[key]) return _TSM_LABELS[key];
  const s = String(key).replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : key;
}
function _tsmTabLabels(t) {
  const map = {};
  try {
    const tabs = window.FLOW_CONFIG && window.FLOW_CONFIG.FORM_TABS_BY_TYPE && window.FLOW_CONFIG.FORM_TABS_BY_TYPE[t.typeCode];
    if (Array.isArray(tabs)) tabs.forEach(tab => { map[tab.id] = tab.label; });
  } catch (e) { /* sem FLOW_CONFIG (telas de lista) → usa humanizador */ }
  return map;
}
// Converte o formData.abas da tarefa (a MESMA fonte que o formulário do fluxo lê)
// em seções/subseções read-only pro modal. Type-agnóstico: funciona pra qualquer
// processo, em qualquer tela — o modal reflete os campos reais da tarefa.
function _tsmAbasSecoes(t) {
  const abas = t.formData && t.formData.abas;
  if (!abas || typeof abas !== 'object') return null;
  const tabLabels = _tsmTabLabels(t);
  const out = [];
  Object.entries(abas).forEach(([abaId, abaData]) => {
    if (!abaData || typeof abaData !== 'object' || abaData.disabled) return;
    const subsecoes = [];
    const diretos = {};
    Object.entries(abaData).forEach(([subKey, subVal]) => {
      if (subKey === 'disabled' || subKey === 'reason') return;
      if (subVal && typeof subVal === 'object' && !Array.isArray(subVal)) {
        const campos = {};
        Object.entries(subVal).forEach(([k, v]) => { if (v == null || typeof v !== 'object') campos[k] = v; });
        if (Object.keys(campos).length) subsecoes.push({ titulo: _tsmHumanize(subKey), campos });
      } else if (subVal != null && typeof subVal !== 'object') {
        diretos[_tsmHumanize(subKey)] = subVal;
      }
    });
    if (Object.keys(diretos).length) subsecoes.unshift({ titulo: '', campos: diretos });
    if (subsecoes.length) out.push({ titulo: tabLabels[abaId] || _tsmHumanize(abaId), subsecoes });
  });
  return out.length ? out : null;
}
function _tsmSecoes(t) {
  if (Array.isArray(t.secoes) && t.secoes.length) return t.secoes;
  if (Array.isArray(t.feito) && t.feito.length) return [{ titulo: 'Dados da solicitação', campos: t.feito }];
  if (Array.isArray(t.campos) && t.campos.length) return [{ titulo: 'Dados da solicitação', campos: t.campos }];
  const fromAbas = _tsmAbasSecoes(t); // fonte real da tarefa (mesma do formulário)
  if (fromAbas) return fromAbas;
  return secoesPorTipo(t); // fallback por processo — só quando a tarefa não tem dados próprios
}
function _tsmMsgs(t) {
  const real = (state.messages && state.messages[t.id] && state.messages[t.id].length) ? state.messages[t.id] : null;
  if (real) return real;
  if (Array.isArray(t.messages) && t.messages.length) return t.messages;
  // Em espera (stationed, aguardando cliente) sempre teve troca: o cliente pediu,
  // o operador respondeu pedindo um complemento — então a ÚLTIMA é do operador.
  // Coerência do estado; vale em qualquer tela (mesmo modal). (modal-espiada.md)
  if (t.status === 'stationed' && !t.clientResponded) {
    return [
      { from: 'client', text: t.clientMessage || 'Segue a solicitação.', timestamp: t.receivedAt || '' },
      { from: 'operator', text: 'Recebi a solicitação. Para dar sequência, preciso de um complemento — deixei o detalhe na tarefa. Fico no aguardo do retorno.', timestamp: t.receivedAt || '' },
    ];
  }
  return [];
}
function _tsmLog(t) {
  if (Array.isArray(t.log) && t.log.length) return t.log;
  return ((state._editLog && state._editLog[t.id]) || []).map(e => ({ field: e.field, before: e.before, after: e.after, by: e.changedBy, at: e.changedAt }));
}
function _tsmStepIdx(t) {
  if (t.status === 'completed') return TIMELINE_STEPS.length;
  if (t.status === 'queue') return 1; // só "recebida" concluída; sem etapa ativa (na fila)
  if (t.status === 'processing') return 2; // passo "Processamento" da timeline
  return (typeof t.timelineStep === 'number') ? t.timelineStep : 1;
}
function _tsmEmpty(icon, title, desc) {
  return `<div style="text-align:center;padding:30px 16px;"><div style="width:50px;height:50px;border-radius:14px;background:var(--surface-muted);color:var(--text-tertiary);display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px;"><i data-lucide="${icon}" style="width:25px;height:25px;"></i></div><div style="font-size:14px;font-weight:600;color:var(--text-primary);">${esc(title)}</div><div style="font-size:12.5px;color:var(--text-secondary);margin-top:3px;">${esc(desc)}</div></div>`;
}
// Campo read-only = MESMO componente do formulário (roField → .field-label/.field-value).
// Campo alterado (vista original×feito) reusa as mesmas classes + destaque "alterado".
function _tsmFieldRO(c) {
  if (!c.changed) return roField(c.l, c.v);
  return `<div><div class="field-label">${esc(c.l)}</div><div class="field-value" style="color:#92400e;font-weight:600;">${esc(c.v)} <span style="font-size:9.5px;font-weight:700;color:#b45309;background:rgba(245,158,11,0.15);border:1px solid #f59e0b;border-radius:4px;padding:0 4px;vertical-align:middle;">alterado</span></div></div>`;
}
// Item de acordeon CONECTADO — mesmo padrão da etapa de processamento: cada seção é um
// .exec-ref-item empilhado dentro de UM .exec-ref-card só (borda compartilhada), não um card
// por seção. Economiza espaço e fica consistente com a tela da tarefa.
function _tsmRefItem(s, openByDefault) {
  let body, alt = 0;
  if (Array.isArray(s.subsecoes)) {
    // Seções com subseções → reusa renderSubsection (mesmo .subsection-title + .field-group do form).
    body = s.subsecoes.map(ss => renderSubsection(ss.titulo, ss.campos)).join('');
  } else {
    const campos = s.campos || [];
    alt = campos.filter(c => c.changed).length;
    body = `<div class="field-group">${campos.map(_tsmFieldRO).join('')}</div>`;
  }
  // Sem contagem de campos no título; só o aviso de "alterados" (vista original × feito).
  const altTag = alt ? ` <span style="color:var(--text-tertiary);font-weight:500;">· ${alt} alterado${alt > 1 ? 's' : ''}</span>` : '';
  return `<div class="exec-ref-item">
    <button class="exec-ref-trigger ${openByDefault ? 'open' : ''}" onclick="toggleExecRefItem(this)"><span>${esc(s.titulo)}${altTag}</span><i data-lucide="chevron-down" class="exec-ref-chevron" style="width:16px;height:16px;"></i></button>
    <div class="exec-ref-content" style="display:${openByDefault ? 'block' : 'none'};">${body}</div>
  </div>`;
}
function tsmAcc(btn) { btn.classList.toggle('open'); const b = btn.nextElementSibling; if (b) b.style.display = (b.style.display === 'none') ? 'block' : 'none'; }

function taskSummaryModal(t, opts) {
  if (!t) return;
  opts = opts || {};
  _tsmTask = t;
  _tsmTab = opts.tab || 'resumo';
  let bd = document.getElementById('task-summary-backdrop');
  if (!bd) { bd = document.createElement('div'); bd.id = 'task-summary-backdrop'; bd.className = 'modal-backdrop hidden'; bd.onclick = (e) => { if (e.target === bd) closeTaskSummary(); }; document.body.appendChild(bd); }

  const cancelled = t.status === 'cancelled';
  const completed = t.status === 'completed';
  const op = (typeof acOp === 'function') ? acOp(t.operatorId) : null;
  const quem = op ? op.nome : (t.assignee || (t.operatorId ? '' : ''));
  const isAutopilot = t.origin === 'autopilot';
  const senderName = t.senderName || t.colaborador || '—';
  const senderTags = isAutopilot
    ? `<span class="contact-tag">robô</span>`
    : `<span class="contact-tag contact-tag-client">cliente</span>${(t.senderScopes || []).map(s => `<span class="contact-tag">${esc(s)}</span>`).join('')}`;
  const atribTxt = quem ? `Atribuído a <strong style="color:var(--text-primary);font-weight:600;">${esc(quem)}</strong>` : `<span style="color:var(--text-tertiary);">Não atribuída ainda</span>`;
  let deadlineHtml;
  if (completed) deadlineHtml = `<span style="color:var(--success);font-weight:600;">Concluído em ${esc(concluidoEmLabel(t))}</span>`;
  else if (cancelled) deadlineHtml = `<span style="color:var(--danger);font-weight:600;">Cancelada ${esc(t.cancelledAt || '')}</span>`;
  else deadlineHtml = ''; // Prazo removido do modal (por enquanto) — colunas de prazo das tabelas ficam pra outra tarefa

  // Cancelamento: mesmo acabamento suave do card de erro do Autopilot (.stopped-card),
  // título "Cancelada" + "Justificativa:". Vai no CORPO (depois da linha do header), não no header.
  const cancelNote = cancelled
    ? `<div class="stopped-card" style="margin-bottom:16px;"><div class="problem-head"><i data-lucide="x-circle"></i>Cancelada</div><div class="problem-text">Justificativa: ${esc(t.cancelReason || '—')}</div></div>`
    : '';

  // Log de alterações (antes→depois). O botão fica DENTRO da aba Resumo (não abaixo do
  // progresso) — aparece quando há histórico (tarefa concluída/em execução).
  const log = _tsmLog(t);
  const logBtn = log.length
    ? `<button class="btn btn-secondary" style="margin-top:16px;" onclick="taskLogModal()"><i data-lucide="list" class="w-4 h-4"></i>Ver alterações (${log.length})</button>`
    : '';

  // ---- Aba Resumo ----
  // Tarefa do Autopilot: espelha o miolo da tela (o que já rodou / de onde parou /
  // o que precisa ser feito), pela MESMA fonte usada em renderFormTab (apMiolo).
  let resumoPane;
  if (isAutopilot && typeof apMiolo === 'function') {
    // t.autopilot já vem pronto no acompanhamento; nas telas de tarefa monta na hora a partir
    // do processo (apFluxo). Fallback FLOW_CONFIG mantém compat.
    const apSrc = t.autopilot || (t.apFluxo && typeof apBuildMiolo === 'function' ? apBuildMiolo(t) : (window.FLOW_CONFIG || {}));
    resumoPane = apMiolo(apSrc);
  } else {
    // Miolo do Resumo = o MESMO componente da etapa de checagem (renderFormReference):
    // todas as abas do formulário, todos os campos (vazios inclusos), dependentes como
    // cards, anexos. Quando a tela tem o renderizador de campos do fluxo, usa ele; senão
    // (telas de lista sem o renderizador) cai no resumo por processo. (modal-espiada.md)
    const _FC = window.FLOW_CONFIG;
    const temCheckComp = t.formData && _FC && typeof _FC.renderFormTab === 'function'
      && _FC.FORM_TABS_BY_TYPE && _FC.FORM_TABS_BY_TYPE[t.typeCode] && typeof renderFormReference === 'function';
    let dados;
    if (temCheckComp) {
      dados = renderFormReference(t, false); // acordeons fechados por padrão
    } else {
      const secoes = _tsmSecoes(t);
      dados = secoes.length
        ? `<div class="exec-ref-card">${secoes.map(s => _tsmRefItem(s, false)).join('')}</div>`
        : `<div style="font-size:12.5px;color:var(--text-tertiary);padding:4px 0;">Sem dados de formulário registrados nesta tarefa.</div>`;
    }
    // Sem bloco "Mensagem do cliente" no Resumo — a mensagem vive na aba Conversa.
    // O acordeon traz os DADOS DA SOLICITAÇÃO ORIGINAL (o que o cliente pediu); as mudanças
    // que o operador fez ficam no "Ver alterações" (log). (modal-espiada.md)
    resumoPane = `
      <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.06em;font-weight:600;margin-bottom:10px;">Dados da solicitação original</div>
      ${dados}
      ${logBtn}`;
  }

  // ---- Aba Conversa ----
  const msgs = _tsmMsgs(t);
  const conversaPane = msgs.length
    ? `<div class="history-list">${msgs.map(m => renderHistoryMessage(m, t)).join('')}</div>`
    : _tsmEmpty('messages-square', 'Nenhuma mensagem ainda', 'Não houve troca de mensagens com o cliente nesta tarefa.');

  // ---- Progresso ("em que etapa está") ----
  // Vai pro TOPO do corpo (não é mais uma aba) — visível em TODOS os modais, igual ao robô.
  // Tarefa do robô: o acompanhamento troca a timeline pelo stepper de fases (apRoboModalAjusta).
  const progressoTop = cancelled ? '' : `
    <div class="tsm-progress" id="tsm-progress">
      <div class="timeline-horizontal" id="tsm-timeline"></div>
    </div>`;

  const tab = (id, label) => `<button class="form-tab tsm-tab" data-tab="${id}" onclick="tsmShowTab('${id}')">${label}</button>`;
  const pane = (id, html) => `<div class="tsm-pane" data-pane="${id}" style="display:none;">${html}</div>`;

  // Tarefa encerrada (concluída/cancelada) não abre nem se repassa: sem "Copiar link" nem
  // botão primário — só "Fechar".
  const encerrada = completed || cancelled;
  const _dl = encerrada ? null : taskDeepLink(t);
  const copyBtn = _dl ? `<button class="btn btn-ghost" style="margin-right:auto;" onclick="copyTaskLink(this)"><i data-lucide="link" class="w-4 h-4"></i>Copiar link</button>` : '';
  const primaryBtn = (!encerrada && opts.primary) ? `<button class="btn btn-primary" onclick="${opts.primary.onClick}">${opts.primary.icon ? `<i data-lucide="${opts.primary.icon}" class="w-4 h-4"></i>` : ''}${esc(opts.primary.label)}</button>` : '';
  const footer = `${copyBtn}<button class="btn btn-secondary" onclick="closeTaskSummary()">Fechar</button>${primaryBtn}`;

  bd.innerHTML = `<div class="modal-panel" onclick="event.stopPropagation()" style="max-width:720px;">
    <div class="modal-header" style="display:block;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div style="min-width:0;flex:1;">
          <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">${esc(t.type || '')}</div>
          <h1 style="font-size:20px;font-weight:700;line-height:1.15;margin:2px 0 4px;">${esc(t.clientName || '')}</h1>
          <div style="font-size:13px;color:var(--text-secondary);font-family:'JetBrains Mono',monospace;">${esc(t.cnpj || '')}</div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px;font-size:12px;color:var(--text-tertiary);">${olMetaStripHtml(t)}<span style="color:var(--text-tertiary);">·</span><span>${atribTxt}</span></div>
        </div>
        <button class="btn btn-ghost" style="padding:8px;flex-shrink:0;" onclick="closeTaskSummary()"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>
      <div style="border-top:1px solid var(--border);margin:12px 0;"></div>
      <div style="font-size:12.5px;color:var(--text-secondary);display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span>${isAutopilot ? 'Iniciado pelo' : 'Solicitado por'} <strong style="color:var(--text-primary);font-weight:600;">${esc(senderName)}</strong></span>
        <span style="display:inline-flex;gap:4px;">${senderTags}</span>
        <span style="color:var(--text-tertiary);">·</span>
        <span style="color:var(--text-tertiary);">Solicitado em ${esc(solicitadoEmLabel(t))}</span>
        ${statePillHtml(t)}
        ${deadlineHtml}
      </div>
    </div>
    <div class="modal-body" style="padding-top:18px;">
      ${cancelNote}
      ${progressoTop}
      ${isAutopilot
        ? `<div${progressoTop ? ' style="margin-top:20px;"' : ''}>${resumoPane}</div>`
        : `<div class="form-tabs"${progressoTop ? ' style="margin-top:20px;"' : ''}>${tab('resumo', 'Resumo')}${tab('conversa', 'Mensagens')}</div>
           <div style="padding-top:16px;">${pane('resumo', resumoPane)}${pane('conversa', conversaPane)}</div>`}
    </div>
    <div class="modal-footer">${footer}</div>
  </div>`;
  bd.classList.remove('hidden');
  if (t.status !== 'cancelled') { const tl = document.getElementById('tsm-timeline'); if (tl) renderTimelineHorizontal(tl, _tsmStepIdx(t), t, { noActive: t.status === 'queue' }); }
  tsmShowTab(_tsmTab);
  refreshIcons();
}
function tsmShowTab(tabId) {
  _tsmTab = tabId;
  document.querySelectorAll('#task-summary-backdrop .tsm-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('#task-summary-backdrop .tsm-pane').forEach(p => { p.style.display = (p.dataset.pane === tabId) ? 'block' : 'none'; });
}
function closeTaskSummary() { const bd = document.getElementById('task-summary-backdrop'); if (bd) bd.classList.add('hidden'); }

// Link direto da tarefa — o gestor copia e repassa pra outro operador finalizar,
// sem reatribuição pelo sistema (caso: operador adoece, tarefa fica parada).
function taskDeepLink(t) {
  const href = (typeof olFlowHref === 'function') ? olFlowHref(t) : null;
  if (!href || !t) return null;
  const base = location.href.replace(/[^/]*(\?.*)?$/, '');
  return base + href + '?ref=acompanhamento&taskId=' + encodeURIComponent(t.id);
}
function tsmAbrirTarefa() {
  const t = _tsmTask; if (!t) return;
  const u = taskDeepLink(t);
  const go = () => { closeTaskSummary(); if (u) window.location.href = u; else alert('No protótipo: abriria a tela da tarefa.'); };
  // Tarefa sem operador → abrir atribui a quem está abrindo (igual a pegar na fila). Avisa antes.
  const semDono = !t.operatorId && t.status !== 'completed' && t.status !== 'cancelled';
  if (semDono && typeof showConfirmModal === 'function') {
    showConfirmModal({
      title: 'Atribuir a você?',
      message: 'Esta tarefa ainda não tem operador. Ao abrir, ela será <strong>atribuída a você</strong> — o mesmo que pegar uma tarefa na fila.',
      confirmLabel: 'Atribuir e abrir',
      onConfirm: go,
    });
  } else { go(); }
}
function _copyFeedback(btn) { if (!btn) return; const old = btn.innerHTML; btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>Copiado!'; refreshIcons(); setTimeout(() => { btn.innerHTML = old; refreshIcons(); }, 1600); }
function copyLinkUrl(url, btn) {
  if (!url) return;
  (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => _copyFeedback(btn)).catch(() => {
    try { const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); _copyFeedback(btn); }
    catch (e) { prompt('Copie o link da tarefa:', url); }
  });
}
function copyTaskLink(btn) { copyLinkUrl(taskDeepLink(_tsmTask), btn); }

// Log de alterações — modal à parte (mesmo papel do "Histórico de alterações"
// de dentro da tarefa), reusado a partir do modal de resumo.
function taskLogModal() {
  const t = _tsmTask; if (!t) return;
  const log = _tsmLog(t);
  let bd = document.getElementById('task-log-backdrop');
  if (!bd) { bd = document.createElement('div'); bd.id = 'task-log-backdrop'; bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:300;display:flex;align-items:center;justify-content:center;'; bd.onclick = (e) => { if (e.target === bd) bd.remove(); }; }
  else bd.style.display = 'flex';
  const rows = log.length
    ? log.map(e => `<div style="padding:12px 0;border-top:1px solid var(--border);font-size:13px;">
        <div style="font-weight:600;color:var(--text-primary);">${esc(e.field || '')}</div>
        <div style="margin-top:4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><span style="text-decoration:line-through;color:var(--text-tertiary);">${esc(e.before || '—')}</span><i data-lucide="arrow-right" style="width:14px;height:14px;color:var(--text-tertiary);"></i><span style="color:#92400e;font-weight:600;">${esc(e.after || '—')}</span></div>
        ${(e.by || e.at) ? `<div style="margin-top:3px;font-size:11px;color:var(--text-tertiary);">${esc(e.by || '')}${e.by && e.at ? ' · ' : ''}${esc(e.at || '')}</div>` : ''}
      </div>`).join('')
    : `<div style="padding:18px 0;font-size:13px;color:var(--text-tertiary);">Nenhuma alteração registrada.</div>`;
  bd.innerHTML = `<div class="modal-panel" onclick="event.stopPropagation()" style="max-width:560px;">
    <div class="modal-header"><div style="font-size:15px;font-weight:700;">Histórico de alterações</div><button class="btn btn-ghost" style="padding:8px;" onclick="document.getElementById('task-log-backdrop').remove()"><i data-lucide="x" class="w-4 h-4"></i></button></div>
    <div class="modal-body">${rows}</div>
  </div>`;
  document.body.appendChild(bd);
  refreshIcons();
}

// Hub (lista-operador): ENTRAR na tarefa é sempre navegar pro fluxo dela. Espiar
// (olho/clique na linha) é o modal de resumo; entrar é o botão do modal e os
// botões do header ("Continuar/Pegar próxima"). Sem desvio por estado. A conversa
// com o cliente segue acessível pela aba Conversa do modal. (modal-espiada.md)
function olHubOpenTask(id) { _olNavigate(id); }
function _olFltLabel(k) {
  if (k === 'cliente') { const o = olClienteOpts().find(o => o.v === _ol.filtros.cliente); return o ? o.label : 'Cliente'; }
  if (k === 'origem') { const o = olOrigemOpts().find(o => o.v === _ol.filtros.origem); return o ? o.label : 'Origem'; }
  if (k === 'tipo') { const o = olTipoOpts().find(o => o.v === _ol.filtros.tipo); return o ? o.label : 'Processo'; }
  const o = OL_ESTADO_OPTS.find(o => o.v === _ol.filtros.estado); return o ? o.label : 'Estado';
}
function _olFltTrigger(k) {
  const has = !!_ol.filtros[k];
  const clear = has ? `<span class="flt-clear" onclick="event.stopPropagation(); olLimparFiltro('${k}')"><i data-lucide="x" style="width:14px;height:14px;"></i></span>` : '';
  return `<button class="flt-trigger ${has ? 'has-val' : ''}" onclick="event.stopPropagation(); olToggleFlt('${k}')"><span>${esc(_olFltLabel(k))}</span>${clear}<i data-lucide="chevron-down" class="flt-chev" style="width:16px;height:16px;"></i></button>`;
}
function _olFltMenu(k) {
  if (_ol.openFlt !== k) return '';
  const chk = (v) => _ol.filtros[k] === v ? '<i data-lucide="check" class="flt-check" style="width:16px;height:16px;"></i>' : '';
  if (k === 'cliente') {
    const items = olClienteOpts().map(o => `<div class="flt-item" data-search="${esc((o.label + ' ' + o.cnpj).toLowerCase())}" onclick="olSetFiltro('cliente','${esc(o.v)}')"><div style="display:flex;flex-direction:column;min-width:0;"><span>${esc(o.label)}</span><span class="flt-cnpj">${esc(o.cnpj)}</span></div>${chk(o.v)}</div>`).join('');
    return `<div class="flt-menu"><input class="flt-search" id="ol-flt-cliente-search" placeholder="Buscar nome ou CNPJ…" oninput="olFiltraCliente(this)">${items}</div>`;
  }
  if (k === 'origem') {
    const items = olOrigemOpts().map(o => `<div class="flt-item" data-search="${esc(o.label.toLowerCase())}" onclick="olSetFiltro('origem','${esc(o.v)}')"><span>${esc(o.label)}</span>${chk(o.v)}</div>`).join('');
    return `<div class="flt-menu"><input class="flt-search" id="ol-flt-origem-search" placeholder="Buscar origem…" oninput="olFiltraCliente(this)">${items}</div>`;
  }
  const opts = k === 'tipo' ? olTipoOpts() : OL_ESTADO_OPTS;
  const items = opts.map(o => `<div class="flt-item" onclick="olSetFiltro('${k}','${esc(o.v)}')"><span>${esc(o.label)}</span>${chk(o.v)}</div>`).join('');
  return `<div class="flt-menu">${items}</div>`;
}
function olRenderFiltros() {
  const el = document.getElementById('ol-filtros'); if (!el) return;
  const keys = ['cliente', 'origem', 'tipo', 'estado'];
  el.innerHTML = keys.map(k => `<div class="flt">${_olFltTrigger(k)}${_olFltMenu(k)}</div>`).join('') + (olTemFiltro() ? `<button class="flt-limpar" onclick="olLimparTodos()">Limpar filtros</button>` : '');
  refreshIcons();
  if (_ol.openFlt === 'cliente') { const s = document.getElementById('ol-flt-cliente-search'); if (s) setTimeout(() => s.focus(), 0); }
  if (_ol.openFlt === 'origem') { const s = document.getElementById('ol-flt-origem-search'); if (s) setTimeout(() => s.focus(), 0); }
}
function olToggleFlt(k) { _ol.openFlt = (_ol.openFlt === k) ? null : k; if (_ol.openFlt && _pp.ol && _pp.ol.open) { _pp.ol.open = false; ppRender('ol'); } olRenderFiltros(); }
function olSetFiltro(k, v) { _ol.filtros[k] = v; _ol.openFlt = null; _ol.page = 1; olRenderFiltros(); olRenderAtribuidas(); olRenderList(); }
function olLimparFiltro(k) { _ol.filtros[k] = null; _ol.openFlt = null; _ol.page = 1; olRenderFiltros(); olRenderAtribuidas(); olRenderList(); }
function olLimparTodos() { Object.keys(_ol.filtros).forEach(k => _ol.filtros[k] = null); _ol.openFlt = null; _ol.page = 1; if (_pp.ol) { _pp.ol.range = null; _pp.ol.calPick = null; ppRender('ol'); } olRenderFiltros(); olRenderAtribuidas(); olRenderList(); }
function olFiltraCliente(inp) { const q = inp.value.toLowerCase().trim(); inp.parentElement.querySelectorAll('.flt-item').forEach(it => { it.style.display = (!q || (it.dataset.search || '').includes(q)) ? '' : 'none'; }); }
function olRenderList() {
  const head = document.getElementById('ol-list-head'), mount = document.getElementById('ol-list'); if (!mount) return;
  const ts = olBaseList().filter(olPassa);
  if (head) head.innerHTML = `<div class="sh-text"><div class="sh-title">Fila geral (${ts.length})</div><div class="sh-sub">Não atribuídas · escolha manualmente ou deixe o sistema pegar a próxima · ordenadas por data de recebimento, mais novas no topo</div></div>`;
  if (!ts.length) { mount.innerHTML = `<div class="lo-table-wrap"><div style="padding:28px 16px;text-align:center;color:var(--text-tertiary);font-size:13px;">${olTemFiltro() ? 'Nenhuma tarefa com esses filtros.' : 'Nenhuma tarefa na fila geral agora.'}</div></div>`; refreshIcons(); return; }
  const pages = Math.max(1, Math.ceil(ts.length / OL_PAGE_SIZE));
  if (_ol.page > pages) _ol.page = pages;
  const start = (_ol.page - 1) * OL_PAGE_SIZE;
  const pageItems = ts.slice(start, start + OL_PAGE_SIZE);
  const rows = pageItems.map(t => _renderTaskRow(t, { clickable: true, onClick: `olVerDetalhes('${t.id}')`, withEye: true })).join('');
  const from = start + 1, to = start + pageItems.length;
  const hasPrev = _ol.page > 1, hasNext = to < ts.length;
  const pager = `<div class="lo-pager">
    <button class="btn btn-secondary" ${hasPrev ? '' : 'disabled'} onclick="olGoPage(${_ol.page - 1})"><i data-lucide="chevron-left" class="w-4 h-4"></i>Anterior</button>
    <span class="lo-pager-info">Mostrando ${from}–${to} de ${ts.length}</span>
    <button class="btn btn-secondary" ${hasNext ? '' : 'disabled'} onclick="olGoPage(${_ol.page + 1})">Próxima<i data-lucide="chevron-right" class="w-4 h-4"></i></button>
  </div>`;
  mount.innerHTML = `<div class="lo-table-wrap">${_taskTableHead()}${rows}</div>${pager}`;
  refreshIcons();
}
function olGoPage(p) { _ol.page = p; olRenderList(); }

// fecha o dropdown de filtro aberto ao clicar fora
document.addEventListener('click', (e) => { if (_ol.openFlt && !e.target.closest('.flt')) { _ol.openFlt = null; olRenderFiltros(); } ppCloseIfOutside('ol', e.target, '#ol-period'); });

/* ---- Contexto FLUXO: deriva do state + abre in-page (ativa) ou navega (B) ---- */
function _olTasksFromState() {
  const out = [];
  if (state.active) out.push({ ...state.active, status: 'active' });
  (state.queue || []).forEach(t => out.push({ ...t, status: 'queue' }));
  (state.stationed || []).forEach(t => out.push({ ...t, status: 'stationed' }));
  return out;
}
function _flowOpenTask(id) {
  // ENTRAR na tarefa (chamado pelo botão do modal de espiada e pelos botões do
  // header). Espiar é olVerDetalhes (olho/clique na linha). Mesma regra da outra
  // porta do hub (olHubOpenTask): entrar sempre navega pro fluxo da tarefa; a
  // conversa segue acessível pela aba Conversa do modal. (modal-espiada.md)
  _olNavigate(id);
}

// Abre uma tarefa específica da fila/estacionadas in-page (deep-link de chegada).
function openTaskById(id) {
  let task = (state.queue || []).find(t => t.id === id);
  if (task) { state.queue = state.queue.filter(t => t.id !== id); }
  else { task = (state.stationed || []).find(t => t.id === id); if (task) { state.stationed = state.stationed.filter(t => t.id !== id); if (task.clientResponded) task.clientResponded = false; } }
  if (!task) { pegarProximaTarefa(); return; }
  if (state.active && state.active.id !== id) state.queue.unshift(state.active);
  state.active = task; state.currentTaskId = id;
  renderTask(task); showScreen('task');
}

// Ao chegar de uma lista (?ref=lista), abre uma tarefa DO TIPO deste fluxo.
function _olOpenOnArrival() {
  const fam = olFamily(window.FLOW_CONFIG && window.FLOW_CONFIG.typeCode);
  const resp = (state.stationed || []).find(t => t.clientResponded && olFamily(t.typeCode) === fam);
  const fila = (state.queue || []).find(t => olFamily(t.typeCode) === fam);
  const alvo = resp || fila;
  if (alvo) openTaskById(alvo.id); else pegarProximaTarefa();
}

function renderHome() {
  olMount(qs('#screen-home'), { tarefas: _olTasksFromState(), onOpenTask: _flowOpenTask, entregues: (state.completed || []).length });
}

/* ============================================================
   RENDER: FORMULÁRIO
   ============================================================ */
function getFormTabs(typeCode) {
  const tabs = window.FLOW_CONFIG.FORM_TABS_BY_TYPE;
  return (tabs && tabs[typeCode]) || [{ id: 'geral', label: '1. Geral' }];
}

function _getActiveFormTabId() {
  const el = qs('.form-tab.active[data-tab]');
  return el ? el.dataset.tab : null;
}

function renderForm(task, preferredTabId) {
  const tabsEl = qs('#form-tabs');
  const contentEl = qs('#form-content');

  if (!task.formData) {
    tabsEl.innerHTML = '';
    contentEl.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: var(--text-tertiary); font-size: 13px;">
        <i data-lucide="file-question" class="w-10 h-10 mx-auto mb-3" style="color: var(--text-tertiary);"></i>
        <div>Formulário não disponível para esta solicitação neste protótipo.</div>
      </div>
    `;
    refreshIcons();
    return;
  }

  const data = task.formData;
  const tabs = getFormTabs(task.typeCode);

  const preferredTab = tabs.find(t => t.id === preferredTabId);
  const preferredEnabled = preferredTab && !(data.abas && data.abas[preferredTab.id] && data.abas[preferredTab.id].disabled);
  const initialTabId = preferredEnabled ? preferredTab.id : tabs[0].id;

  tabsEl.innerHTML = tabs.map(tab => {
    const tabData = data.abas && data.abas[tab.id];
    const disabled = tabData && tabData.disabled;
    return `<div class="form-tab ${tab.id === initialTabId ? 'active' : ''} ${disabled ? 'disabled' : ''}"
         data-tab="${tab.id}"
         ${disabled ? `title="${tabData.reason}"` : `onclick="switchFormTab('${tab.id}')"`}>
      ${tab.label}
      ${disabled ? '<i data-lucide="lock" style="width:12px;height:12px;opacity:0.6;"></i>' : ''}
    </div>`;
  }).join('');

  const stripEl = qs('#form-collab-strip');
  if (stripEl) {
    if (data.colaborador) {
      const initials = data.colaborador.nome.split(' ').map(n => n[0]).slice(0, 2).join('');
      const contextLabel = data.colaborador.contextLabel;
      const contextValue = data.colaborador.contextValue || data.colaborador.dataAdmissao;
      const contextBlock = contextLabel && contextValue ? `
        <div style="margin-left: auto; text-align: right;">
          <div class="field-label">${contextLabel}</div>
          <div style="font-weight: 600;">${contextValue}</div>
        </div>` : '';
      stripEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: var(--surface-subtle); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 20px;">
          <div style="width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #64748b, #94a3b8); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700;">${initials}</div>
          <div>
            <div style="font-size: 15px; font-weight: 600;">${data.colaborador.nome}</div>
            <div style="font-size: 12px; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace;">CPF ${data.colaborador.cpf} · Cód. ${data.colaborador.codigo}</div>
          </div>
          ${contextBlock}
        </div>
      `;
    } else {
      stripEl.innerHTML = '';
    }
  }

  const isEditing = !!(task.id && state._editMode[task.id]);

  const logCount = (state._editLog[task.id] || []).length;
  const editBtnEl = qs('#form-edit-btn');
  if (editBtnEl) {
    editBtnEl.innerHTML = isEditing ? '' : `
      <div style="display:flex;align-items:center;gap:8px;">
        ${logCount > 0 ? `<button onclick="showEditLog()" style="display:inline-flex;align-items:center;gap:5px;padding:7px 12px;background:#fff;border:1px solid var(--border-strong);border-radius:8px;font-size:12.5px;font-weight:500;cursor:pointer;color:var(--text-secondary);" onmouseover="this.style.borderColor='var(--brand-pink)';this.style.color='var(--brand-pink)'" onmouseout="this.style.borderColor='var(--border-strong)';this.style.color='var(--text-secondary)'"><i data-lucide="list" style="width:13px;height:13px;"></i> Ver alterações (${logCount})</button>` : ''}
        <button onclick="enterEditMode()" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:#fff;border:1px solid var(--border-strong);border-radius:8px;font-size:12.5px;font-weight:500;cursor:pointer;color:var(--text-secondary);transition:all .15s;" onmouseover="this.style.borderColor='var(--brand-pink)';this.style.color='var(--brand-pink)'" onmouseout="this.style.borderColor='var(--border-strong)';this.style.color='var(--text-secondary)'"><i data-lucide="pencil" style="width:13px;height:13px;"></i> Editar</button>
      </div>`;
  }

  const editBar = `<div class="edit-mode-bar">
      <span class="edit-mode-badge">✏ Em edição</span>
      ${logCount > 0 ? `<button onclick="showEditLog()" style="display:inline-flex;align-items:center;gap:5px;padding:6px 12px;background:#fff;border:1px solid var(--border-strong);border-radius:7px;font-size:12.5px;font-weight:500;cursor:pointer;"><i data-lucide="list" style="width:13px;height:13px;"></i> Ver alterações (${logCount})</button>` : ''}
      <div style="margin-left:auto;display:flex;gap:8px;">
        <button onclick="cancelEdits()" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:#fff;border:1px solid var(--border-strong);border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;">Cancelar</button>
        <button onclick="saveEdits()" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;background:var(--brand-pink);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;"><i data-lucide="check" style="width:14px;height:14px;"></i> Salvar alterações</button>
      </div>
    </div>`;

  contentEl.innerHTML = (isEditing ? editBar : '') + '<div id="form-tab-body"></div>' + (isEditing ? `<div style="margin-top:8px;">${editBar}</div>` : '');
  switchFormTab(initialTabId);
}

function switchFormTab(tabId) {
  qsa('.form-tab').forEach(t => t.classList.remove('active'));
  const tabEl = qs(`.form-tab[data-tab="${tabId}"]`);
  if (tabEl && !tabEl.classList.contains('disabled')) tabEl.classList.add('active');

  const task = getTaskById(state.currentTaskId);
  if (!task || !task.formData) return;
  const isEditing = !!(state._editMode && state._editMode[task.id]);
  const abas = isEditing && state._editDraft[task.id] ? state._editDraft[task.id] : task.formData.abas;
  const abaData = abas && abas[tabId];
  const bodyEl = qs('#form-tab-body');
  if (!bodyEl) return;

  if (abaData && abaData.disabled) {
    bodyEl.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; background: var(--surface-subtle); border-radius: 10px;">
        <i data-lucide="lock" class="w-8 h-8 mx-auto mb-3" style="color: var(--text-tertiary);"></i>
        <div style="color: var(--text-secondary); font-size: 13px;">${abaData.reason}</div>
      </div>
    `;
    refreshIcons();
    return;
  }

  const html = window.FLOW_CONFIG.renderFormTab(tabId, abaData || {});
  bodyEl.innerHTML = html;
  refreshIcons();
}

function roField(label, value) {
  const isEmpty = !value || value === '—';
  return `<div><div class="field-label">${label}</div><div class="field-value ${isEmpty ? 'empty' : ''}">${value || '—'}</div></div>`;
}

function renderSubsection(title, obj) {
  if (!obj) return '';
  const fields = Object.entries(obj).map(([k, v]) => roField(k, v)).join('');
  return `<div class="subsection-title">${title}</div><div class="field-group">${fields}</div>`;
}

function renderAttachments(title, list) {
  if (!list || !list.length) return '';
  return `<div class="subsection-title">${title}</div>
    <div class="flex flex-wrap gap-2">
      ${list.map(a => `
        <div class="attachment">
          <i data-lucide="paperclip" class="w-4 h-4" style="color: var(--text-tertiary);"></i>
          <span>${a.nome}</span>
          <span style="color: var(--text-tertiary); font-size: 11px;">· ${a.tipo}</span>
        </div>
      `).join('')}
    </div>`;
}

/* ============================================================
   EDIT MODE — helpers de campo editável
   ============================================================ */
function efText(label, value, tab, section, field) {
  return `<div class="ef-field"><div class="ef-label">${label}</div><input class="ef-input" type="text" value="${(value || '').replace(/"/g, '&quot;')}" data-tab="${tab}" data-section="${section}" data-field="${field}" oninput="onFieldEdit(this)"/></div>`;
}
function efDate(label, value, tab, section, field) {
  const id = ('dp-' + tab + '-' + section + '-' + field).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '_');
  const calIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  return `<div class="ef-field"><div class="ef-label">${label}</div><div class="ef-datepicker" id="${id}"><input class="ef-input ef-datepicker-input" type="text" placeholder="dd/mm/aaaa" value="${(value || '').replace(/"/g, '&quot;')}" readonly data-tab="${tab}" data-section="${section}" data-field="${field}" onclick="toggleDatePicker('${id}')"/><button type="button" class="ef-datepicker-btn" onclick="toggleDatePicker('${id}')">${calIcon}</button><div class="ef-cal-popup" data-year="" data-month=""></div></div></div>`;
}
function efNumber(label, value, tab, section, field) {
  return `<div class="ef-field"><div class="ef-label">${label}</div><input class="ef-input" type="number" value="${value || ''}" data-tab="${tab}" data-section="${section}" data-field="${field}" oninput="onFieldEdit(this)"/></div>`;
}
function efCurrency(label, value, tab, section, field) {
  return `<div class="ef-field"><div class="ef-label">${label}</div><div style="position:relative;"><span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--text-secondary);">R$</span><input class="ef-input" type="text" style="padding-left:28px;" value="${(value || '').replace('R$ ', '').replace(/"/g, '&quot;')}" data-tab="${tab}" data-section="${section}" data-field="${field}" oninput="onFieldEdit(this)"/></div></div>`;
}
function efSelect(label, value, tab, section, field, options) {
  const opts = options.map(o => {
    const v = typeof o === 'string' ? o : o.value;
    const l = typeof o === 'string' ? o : o.label;
    return `<option value="${v}" ${(v === value || l === value) ? 'selected' : ''}>${l}</option>`;
  }).join('');
  return `<div class="ef-field"><div class="ef-label">${label}</div><select class="ef-select" data-tab="${tab}" data-section="${section}" data-field="${field}" onchange="onFieldEdit(this)"><option value="">— Selecione —</option>${opts}</select></div>`;
}
function efToggle(label, value, tab, section, field, opts) {
  const btns = opts.map(o => `<button type="button" class="ef-toggle-btn ${o === value ? 'active' : ''}" onclick="onToggleEdit(this,'${tab}','${section}','${field}','${o}')">${o}</button>`).join('');
  return `<div class="ef-field"><div class="ef-label">${label}</div><div class="ef-toggle-group">${btns}</div></div>`;
}
function efTextarea(label, value, tab, section, field) {
  return `<div class="ef-field" style="grid-column:1/-1;"><div class="ef-label">${label}</div><textarea class="ef-textarea" data-tab="${tab}" data-section="${section}" data-field="${field}" oninput="onFieldEdit(this)">${value || ''}</textarea></div>`;
}

/* ── Helpers para campos dentro de itens de lista (ex.: dependentes) ── */
const DEPENDENTE_TIPO_OPTIONS = [
  '01 - Cônjuge ou companheiro(a) com o(a) qual tenha filho ou viva há mais de 5 anos',
  '02 - Filho(a) ou enteado(a) até 21 anos',
  '04 - Filho(a) ou enteado(a) em qualquer idade, quando incapacitado física e/ou mentalmente para o trabalho',
  '05 - Irmão(ã), neto(a) ou bisneto(a) sem arrimo dos pais, do qual detenha guarda judicial, até 21 anos',
  '07 - Irmão(ã), neto(a) ou bisneto(a) sem arrimo dos pais, do(a) qual detenha guarda judicial, em qualquer idade, quando incapacitado física e/ou mentalmente para o trabalho',
  '08 - Pais, avós e bisavós',
  '09 - Menor pobre, até 21 anos, que crie e eduque e do qual detenha guarda judicial',
  '10 - Pessoa absolutamente incapaz, da qual seja tutor ou curador',
  'Outros',
];

const DEPENDENTE_DEFAULTS = {
  'Nome': '',
  'Data de nascimento': '',
  'CPF': '',
  'Local de nascimento': '',
  'Tipo de dependência': '',
  'Matrícula': '',
  'Cartório': '',
  'Número registro': '',
  'Número livro': '',
  'Número folha': '',
  'Número da DNV': '',
  'Data de entrega do documento': '',
  'Pensão alimentícia': 'NAO',
  'Determinar fim da pensão': '',
  'Salário família': 'NAO',
  'Vencimento do atestado de frequência escolar para o salário família': '',
  'Vencimento da carteira de vacinação para o salário família': '',
  'IRRF': 'NAO',
  'Determinar fim IRRF': '',
  'Idade até': '',
};

const UF_OPTIONS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

/* ---- Cache de municípios (IBGE) usado pelos formulários ---- */
const __municipiosCache = new Map();
const __municipiosInflight = new Map();
function getMunicipiosForUf(uf) {
  if (!uf) return [];
  return __municipiosCache.get(uf) || [];
}
function ensureMunicipiosForUf(uf, onDone) {
  if (!uf) return;
  if (__municipiosCache.has(uf)) { onDone && onDone(__municipiosCache.get(uf)); return; }
  if (__municipiosInflight.has(uf)) { __municipiosInflight.get(uf).then(onDone || (()=>{})); return; }
  const promise = fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
    .then(r => r.ok ? r.json() : [])
    .then(data => {
      const names = Array.isArray(data) ? data.map(d => d.nome).sort((a,b) => a.localeCompare(b, 'pt-BR')) : [];
      __municipiosCache.set(uf, names);
      __municipiosInflight.delete(uf);
      return names;
    })
    .catch(() => { __municipiosInflight.delete(uf); return []; });
  __municipiosInflight.set(uf, promise);
  if (onDone) promise.then(onDone);
}

const DEPENDENTES_DISABLED_REASON = 'Colaborador não declarou dependentes. Esta aba só é habilitada quando houver dependentes informados.';

const ESTRANGEIRO_CONDICAO_OPTIONS = ['Temporário','Permanente','Refugiado','Asilado'];

const ESTRANGEIRO_DEFAULTS = {
  'Condição': '',
  'Data de Chegada': '',
  'Processo MTE': '',
  'Carteira de Trabalho - Validade': '',
  'RNE - Número': '',
  'RNE - Data de Expedição': '',
  'RNE - Órgão Emissor': '',
  'RNE - Data de Validade': '',
  'Casado com Brasileiro': 'NAO',
  'Filhos com Brasileiro': 'NAO',
};

function _getPaisNacionalidade() {
  const taskId = state.currentTaskId;
  const editing = !!(state._editMode && state._editMode[taskId]);
  if (editing && state._editDraft[taskId] && state._editDraft[taskId].pessoal && state._editDraft[taskId].pessoal.pessoais) {
    return state._editDraft[taskId].pessoal.pessoais['País de nacionalidade'] || 'Brasil';
  }
  const task = getTaskById(taskId);
  const pess = task && task.formData && task.formData.abas && task.formData.abas.pessoal && task.formData.abas.pessoal.pessoais;
  return (pess && pess['País de nacionalidade']) || 'Brasil';
}

function renderEstrangeiroSection(estrangeiroData, editing) {
  const pais = _getPaisNacionalidade();
  const isBrasileiro = pais === 'Brasil';
  if (isBrasileiro) {
    return `<div class="subsection-title">Documentos de estrangeiro</div>`
      + `<div style="display:flex;gap:10px;align-items:flex-start;padding:14px 16px;background:var(--surface-subtle);border:1px solid var(--border);border-radius:10px;font-size:13px;color:var(--text-secondary);"><i data-lucide="info" style="width:16px;height:16px;flex-shrink:0;margin-top:2px;color:var(--text-tertiary);"></i><div>Você informou o país de nacionalidade <strong>Brasil</strong>, então essa seção não precisa ser preenchida.</div></div>`;
  }
  const e = estrangeiroData || {};
  if (!editing) {
    return `<div class="subsection-title">Documentos de estrangeiro</div>`
      + `<div class="field-group" style="margin-bottom:24px;">`
      +   roField('Condição', e['Condição'])
      +   roField('Data de Chegada', e['Data de Chegada'])
      +   roField('Processo MTE', e['Processo MTE'])
      +   roField('Carteira de Trabalho - Validade', e['Carteira de Trabalho - Validade'])
      +   roField('RNE - Número', e['RNE - Número'])
      +   roField('RNE - Data de Expedição', e['RNE - Data de Expedição'])
      +   roField('RNE - Órgão Emissor', e['RNE - Órgão Emissor'])
      +   roField('RNE - Data de Validade', e['RNE - Data de Validade'])
      +   roField('Casado com Brasileiro', e['Casado com Brasileiro'])
      +   roField('Filhos com Brasileiro', e['Filhos com Brasileiro'])
      + `</div>`;
  }
  return `
    <div class="subsection-title" style="margin-bottom:16px;">Documentos de estrangeiro</div>
    <div class="field-group field-group-2" style="margin-bottom:24px;">
      ${efSelect('Condição', e['Condição'], 'documentos', 'estrangeiro', 'Condição', ESTRANGEIRO_CONDICAO_OPTIONS)}
      ${efDate('Data de Chegada', e['Data de Chegada'], 'documentos', 'estrangeiro', 'Data de Chegada')}
      ${efText('Processo MTE', e['Processo MTE'], 'documentos', 'estrangeiro', 'Processo MTE')}
      ${efDate('Carteira de Trabalho - Validade', e['Carteira de Trabalho - Validade'], 'documentos', 'estrangeiro', 'Carteira de Trabalho - Validade')}
      ${efText('RNE - Número', e['RNE - Número'], 'documentos', 'estrangeiro', 'RNE - Número')}
      ${efDate('RNE - Data de Expedição', e['RNE - Data de Expedição'], 'documentos', 'estrangeiro', 'RNE - Data de Expedição')}
      ${efText('RNE - Órgão Emissor', e['RNE - Órgão Emissor'], 'documentos', 'estrangeiro', 'RNE - Órgão Emissor')}
      ${efDate('RNE - Data de Validade', e['RNE - Data de Validade'], 'documentos', 'estrangeiro', 'RNE - Data de Validade')}
      ${efToggle('Casado com Brasileiro', e['Casado com Brasileiro'], 'documentos', 'estrangeiro', 'Casado com Brasileiro', ['NAO','SIM'])}
      ${efToggle('Filhos com Brasileiro', e['Filhos com Brasileiro'], 'documentos', 'estrangeiro', 'Filhos com Brasileiro', ['NAO','SIM'])}
    </div>
  `;
}

function efMonthYear(label, value, tab, section, field) {
  let nativeValue = '';
  const m = (value || '').match(/^(\d{2})\/(\d{4})$/);
  if (m) nativeValue = `${m[2]}-${m[1]}`;
  return `<div class="ef-field"><div class="ef-label">${label}</div><input class="ef-input" type="month" value="${nativeValue}" data-tab="${tab}" data-section="${section}" data-field="${field}" onchange="onMonthYearEdit(this)"/></div>`;
}

function onMonthYearEdit(el) {
  const m = (el.value || '').match(/^(\d{4})-(\d{2})$/);
  const formatted = m ? `${m[2]}/${m[1]}` : '';
  const { tab, section, field } = el.dataset;
  const taskId = state.currentTaskId;
  if (!state._editDraft[taskId] || !state._editDraft[taskId][tab]) return;
  if (!state._editDraft[taskId][tab][section]) state._editDraft[taskId][tab][section] = {};
  state._editDraft[taskId][tab][section][field] = formatted;
}

function efListText(label, value, tab, listKey, depId, field, opts) {
  opts = opts || {};
  const dis = opts.disabled ? 'disabled style="opacity:0.5;"' : '';
  return `<div class="ef-field"><div class="ef-label">${label}</div><input class="ef-input" type="text" value="${(value||'').replace(/"/g,'&quot;')}" data-tab="${tab}" data-list-key="${listKey}" data-dep-id="${depId}" data-field="${field}" oninput="onListFieldEdit(this)" ${dis}/></div>`;
}
function efListDate(label, value, tab, listKey, depId, field, opts) {
  opts = opts || {};
  const id = ('dpl-' + tab + '-' + listKey + '-' + depId + '-' + field).replace(/\s+/g,'-').replace(/[^a-zA-Z0-9\-]/g,'_');
  const calIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const disabled = opts.disabled;
  const inputClick = disabled ? '' : `onclick="toggleDatePicker('${id}')"`;
  const btnClick = disabled ? '' : `onclick="toggleDatePicker('${id}')"`;
  const dim = disabled ? 'opacity:0.5;pointer-events:none;' : '';
  return `<div class="ef-field"><div class="ef-label">${label}</div><div class="ef-datepicker" id="${id}" style="${dim}"><input class="ef-input ef-datepicker-input" type="text" placeholder="dd/mm/aaaa" value="${(value||'').replace(/"/g,'&quot;')}" readonly data-tab="${tab}" data-list-key="${listKey}" data-dep-id="${depId}" data-field="${field}" ${inputClick} ${disabled?'disabled':''}/><button type="button" class="ef-datepicker-btn" ${btnClick}>${calIcon}</button><div class="ef-cal-popup" data-year="" data-month=""></div></div></div>`;
}
function efListSelect(label, value, tab, listKey, depId, field, options) {
  const opts = options.map(o => {
    const v = typeof o === 'string' ? o : o.value;
    const l = typeof o === 'string' ? o : o.label;
    return `<option value="${v}" ${(v === value || l === value) ? 'selected' : ''}>${l}</option>`;
  }).join('');
  return `<div class="ef-field"><div class="ef-label">${label}</div><select class="ef-select" data-tab="${tab}" data-list-key="${listKey}" data-dep-id="${depId}" data-field="${field}" onchange="onListFieldEdit(this)"><option value="">— Selecione —</option>${opts}</select></div>`;
}
function efListToggle(label, value, tab, listKey, depId, field, opts) {
  const btns = opts.map(o => `<button type="button" class="ef-toggle-btn ${o === value ? 'active' : ''}" onclick="onListToggleEdit(this,'${tab}','${listKey}','${depId}','${field}','${o}')">${o}</button>`).join('');
  return `<div class="ef-field"><div class="ef-label">${label}</div><div class="ef-toggle-group">${btns}</div></div>`;
}

function onListFieldEdit(el) {
  const { tab, listKey, depId, field } = el.dataset;
  const taskId = state.currentTaskId;
  const list = state._editDraft[taskId] && state._editDraft[taskId][tab] && state._editDraft[taskId][tab][listKey];
  if (!Array.isArray(list)) return;
  const dep = list.find(d => d.id === depId);
  if (!dep) return;
  dep[field] = el.value;
  const item = el.closest('.exec-ref-item');
  if (!item) return;
  if (field === 'Nome') {
    const nameEl = item.querySelector('.exec-ref-trigger [data-role="nome"]');
    if (nameEl) nameEl.textContent = el.value || '(sem nome)';
  } else if (field === 'Tipo de dependência') {
    const tipoEl = item.querySelector('.exec-ref-trigger [data-role="tipo"]');
    if (tipoEl) tipoEl.textContent = el.value ? `· ${el.value}` : '';
  }
}

function onListToggleEdit(btn, tab, listKey, depId, field, value) {
  btn.closest('.ef-toggle-group').querySelectorAll('.ef-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const taskId = state.currentTaskId;
  const list = state._editDraft[taskId] && state._editDraft[taskId][tab] && state._editDraft[taskId][tab][listKey];
  if (!Array.isArray(list)) return;
  const dep = list.find(d => d.id === depId);
  if (!dep) return;
  dep[field] = value;
  if (field === 'IRRF' || field === 'Pensão alimentícia' || field === 'Salário família') {
    switchFormTab('dependentes');
    setTimeout(() => {
      const item = document.querySelector(`.exec-ref-item[data-dep-id="${depId}"]`);
      if (item) {
        const trigger = item.querySelector('.exec-ref-trigger');
        const content = item.querySelector('.exec-ref-content');
        if (trigger && content) { content.style.display = 'block'; trigger.classList.add('open'); }
      }
      if (window.lucide) lucide.createIcons();
    }, 0);
  }
}

function toggleDependenteAccordion(btn) {
  const item = btn.closest('.exec-ref-item');
  if (!item) return;
  const content = item.querySelector('.exec-ref-content');
  if (!content) return;
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  btn.classList.toggle('open', !isOpen);
  if (window.lucide) lucide.createIcons();
}

function addDependente() {
  const taskId = state.currentTaskId;
  const draft = state._editDraft[taskId];
  if (!draft) return;
  if (!draft.dependentes || draft.dependentes.disabled) {
    draft.dependentes = { lista: [] };
  }
  if (!Array.isArray(draft.dependentes.lista)) draft.dependentes.lista = [];
  const id = 'dep-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  draft.dependentes.lista.push({ ...DEPENDENTE_DEFAULTS, id, _isNew: true });
  switchFormTab('dependentes');
  setTimeout(() => {
    const item = document.querySelector(`.exec-ref-item[data-dep-id="${id}"]`);
    if (item) {
      const trigger = item.querySelector('.exec-ref-trigger');
      const content = item.querySelector('.exec-ref-content');
      if (trigger && content) { content.style.display = 'block'; trigger.classList.add('open'); }
      const nameInput = item.querySelector('input[data-field="Nome"]');
      if (nameInput) nameInput.focus();
    }
    if (window.lucide) lucide.createIcons();
  }, 0);
}

function removeDependente(depId) {
  const taskId = state.currentTaskId;
  const draft = state._editDraft[taskId];
  if (!draft || !draft.dependentes || !Array.isArray(draft.dependentes.lista)) return;
  const dep = draft.dependentes.lista.find(d => d.id === depId);
  const nome = dep ? (dep['Nome'] || 'sem nome') : 'sem nome';
  showConfirmModal({
    title: 'Remover dependente?',
    message: `O dependente <strong>${nome}</strong> será removido da lista.`,
    confirmLabel: 'Remover',
    danger: true,
    onConfirm: () => {
      const d = state._editDraft[taskId];
      if (!d || !d.dependentes || !Array.isArray(d.dependentes.lista)) return;
      d.dependentes.lista = d.dependentes.lista.filter(x => x.id !== depId);
      switchFormTab('dependentes');
    }
  });
}

function syncDependentesTabAvailability(value, originBtn) {
  const taskId = state.currentTaskId;
  const draft = state._editDraft[taskId];
  if (!draft) return;
  const cur = draft.dependentes || {};
  const lista = Array.isArray(cur.lista) ? cur.lista : [];

  const updateToggleVisual = (val) => {
    if (!originBtn) return;
    const grp = originBtn.closest('.ef-toggle-group');
    if (grp) grp.querySelectorAll('.ef-toggle-btn').forEach(b => b.classList.toggle('active', b.textContent.trim() === val));
  };

  const apply = (val) => {
    draft.pessoal.pessoais['Possui Dependentes'] = val;
    if (val === 'SIM') {
      draft.dependentes = { lista: lista };
    } else {
      draft.dependentes = { disabled: true, reason: DEPENDENTES_DISABLED_REASON };
    }
    const tabEl = document.querySelector('.form-tab[data-tab="dependentes"]');
    if (tabEl) {
      if (val === 'SIM') {
        tabEl.classList.remove('disabled');
        tabEl.removeAttribute('title');
        tabEl.setAttribute('onclick', "switchFormTab('dependentes')");
        const lock = tabEl.querySelector('i[data-lucide="lock"]');
        if (lock) lock.remove();
      } else {
        tabEl.classList.add('disabled');
        tabEl.setAttribute('title', DEPENDENTES_DISABLED_REASON);
        tabEl.removeAttribute('onclick');
        if (!tabEl.querySelector('i[data-lucide="lock"]')) {
          const lock = document.createElement('i');
          lock.setAttribute('data-lucide', 'lock');
          lock.style.cssText = 'width:12px;height:12px;opacity:0.6;';
          tabEl.appendChild(lock);
          if (window.lucide) lucide.createIcons();
        }
        if (tabEl.classList.contains('active')) switchFormTab('pessoal');
      }
    }
  };

  if (value === 'NAO' && lista.length > 0) {
    // Reverte visualmente para SIM enquanto o modal está aberto
    draft.pessoal.pessoais['Possui Dependentes'] = 'SIM';
    updateToggleVisual('SIM');
    showConfirmModal({
      title: 'Remover dependentes cadastrados?',
      message: `Marcar "Possui Dependentes" como NÃO vai remover os <strong>${lista.length} dependente(s)</strong> já cadastrados.`,
      confirmLabel: 'Remover',
      danger: true,
      onConfirm: () => {
        apply('NAO');
        updateToggleVisual('NAO');
      }
    });
    return;
  }
  apply(value);
}

function renderDependentesTab(d, editing) {
  const lista = (d && Array.isArray(d.lista)) ? d.lista : [];
  if (!editing) {
    if (lista.length === 0) {
      return `<div style="color:var(--text-tertiary);font-size:13px;padding:20px 0;">Nenhum dependente cadastrado.</div>`;
    }
    return `<div class="subsection-title">Dependentes cadastrados (${lista.length})</div>`
      + `<div class="exec-ref-card" style="margin-top:0;">`
      + lista.map(dep => _renderDependenteAccordionRO(dep)).join('')
      + `</div>`;
  }
  const headerCount = `<div class="subsection-title">Dependentes cadastrados (${lista.length})</div>`;
  const accordions = lista.length > 0
    ? `<div class="exec-ref-card" style="margin-top:0;margin-bottom:16px;">` + lista.map(dep => _renderDependenteAccordionEdit(dep)).join('') + `</div>`
    : `<div style="color:var(--text-tertiary);font-size:13px;padding:8px 0 16px;">Nenhum dependente cadastrado. Clique em "Adicionar dependente" para começar.</div>`;
  const addBtn = `<button onclick="addDependente()" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:#fff;color:var(--text-primary);border:1px solid var(--border-strong);border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;"><i data-lucide="plus" style="width:14px;height:14px;"></i> Adicionar dependente</button>`;
  return headerCount + accordions + `<div style="display:flex;justify-content:flex-end;margin-bottom:24px;">${addBtn}</div>`;
}

function _renderDependenteAccordionRO(dep) {
  const nome = dep['Nome'] || '(sem nome)';
  const tipo = dep['Tipo de dependência'] || '';
  const tipoBadge = tipo ? `<span class="exec-ref-badge">· ${tipo}</span>` : '';
  const pensaoSim = dep['Pensão alimentícia'] === 'SIM';
  const salarioFamiliaSim = dep['Salário família'] === 'SIM';
  return `
    <div class="exec-ref-item" data-dep-id="${dep.id || ''}">
      <button class="exec-ref-trigger" onclick="toggleExecRefItem(this)">
        <span>${nome}${tipoBadge}</span>
        <i data-lucide="chevron-down" class="exec-ref-chevron" style="width:16px;height:16px;"></i>
      </button>
      <div class="exec-ref-content" style="display:none;">
        <div class="subsection-title" style="margin-top:8px;">Identificação</div>
        <div class="field-group" style="margin-bottom:20px;">
          ${roField('Nome', dep['Nome'])}
          ${roField('Data de nascimento', dep['Data de nascimento'])}
          ${roField('CPF', dep['CPF'])}
          ${roField('Local de nascimento', dep['Local de nascimento'])}
          ${roField('Tipo de dependência', dep['Tipo de dependência'])}
          ${roField('Matrícula', dep['Matrícula'])}
        </div>
        <div class="subsection-title">Documentos / Registro</div>
        <div class="field-group" style="margin-bottom:20px;">
          ${roField('Cartório', dep['Cartório'])}
          ${roField('Número registro', dep['Número registro'])}
          ${roField('Número livro', dep['Número livro'])}
          ${roField('Número folha', dep['Número folha'])}
          ${roField('Número da DNV', dep['Número da DNV'])}
          ${roField('Data de entrega do documento', dep['Data de entrega do documento'])}
        </div>
        <div class="subsection-title">Pensão alimentícia</div>
        <div class="field-group" style="margin-bottom:20px;">
          ${roField('Pensão alimentícia', dep['Pensão alimentícia'])}
          ${pensaoSim ? roField('Determinar fim da pensão', dep['Determinar fim da pensão']) : ''}
        </div>
        <div class="subsection-title">Salário família</div>
        <div class="field-group" style="margin-bottom:20px;">
          ${roField('Salário família', dep['Salário família'])}
          ${salarioFamiliaSim ? roField('Vencimento do atestado de frequência escolar para o salário família', dep['Vencimento do atestado de frequência escolar para o salário família']) : ''}
          ${salarioFamiliaSim ? roField('Vencimento da carteira de vacinação para o salário família', dep['Vencimento da carteira de vacinação para o salário família']) : ''}
        </div>
        <div class="subsection-title">Tributação e prazos</div>
        <div class="field-group">
          ${roField('IRRF', pensaoSim ? 'SIM' : dep['IRRF'])}
          ${(pensaoSim || dep['IRRF'] === 'SIM') ? roField('Determinar fim IRRF', dep['Determinar fim IRRF']) : ''}
          ${(pensaoSim || dep['IRRF'] === 'SIM') ? roField('Idade até', dep['Idade até']) : ''}
        </div>
      </div>
    </div>`;
}

function _renderDependenteAccordionEdit(dep) {
  const nome = dep['Nome'] || '(sem nome)';
  const tipo = dep['Tipo de dependência'] || '';
  const tipoBadge = tipo ? `<span class="exec-ref-badge" data-role="tipo">· ${tipo}</span>` : '<span class="exec-ref-badge" data-role="tipo"></span>';
  const id = dep.id;
  const tab = 'dependentes', listKey = 'lista';
  const pensaoSim = dep['Pensão alimentícia'] === 'SIM';
  const salarioFamiliaSim = dep['Salário família'] === 'SIM';
  const irrfAtivo = pensaoSim || dep['IRRF'] === 'SIM';
  const irrfToggleHtml = pensaoSim
    ? `<div class="ef-field"><div class="ef-label">IRRF</div><div class="ef-toggle-group" style="opacity:0.5;pointer-events:none;">${['NAO','SIM'].map(o => `<button type="button" class="ef-toggle-btn ${o === 'SIM' ? 'active' : ''}" disabled>${o}</button>`).join('')}</div></div>`
    : efListToggle('IRRF', dep['IRRF'], 'dependentes', 'lista', dep.id, 'IRRF', ['NAO','SIM']);
  return `
    <div class="exec-ref-item" data-dep-id="${id}">
      <div style="display:flex;align-items:stretch;">
        <button class="exec-ref-trigger" onclick="toggleDependenteAccordion(this)" style="flex:1;">
          <span><span data-role="nome">${nome}</span>${tipoBadge}</span>
          <i data-lucide="chevron-down" class="exec-ref-chevron" style="width:16px;height:16px;"></i>
        </button>
        <button onclick="removeDependente('${id}')" title="Remover dependente" style="padding:0 18px;border:none;background:none;cursor:pointer;color:var(--danger);display:flex;align-items:center;border-left:1px solid var(--border);">
          <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
        </button>
      </div>
      <div class="exec-ref-content" style="display:none;">
        <div class="subsection-title" style="margin-top:8px;">Identificação</div>
        <div class="field-group field-group-2" style="margin-bottom:20px;">
          ${efListText('Nome', dep['Nome'], tab, listKey, id, 'Nome')}
          ${efListDate('Data de nascimento', dep['Data de nascimento'], tab, listKey, id, 'Data de nascimento')}
          ${efListText('CPF', dep['CPF'], tab, listKey, id, 'CPF')}
          ${efListSelect('Local de nascimento', dep['Local de nascimento'], tab, listKey, id, 'Local de nascimento', UF_OPTIONS)}
          ${efListSelect('Tipo de dependência', dep['Tipo de dependência'], tab, listKey, id, 'Tipo de dependência', DEPENDENTE_TIPO_OPTIONS)}
          ${efListText('Matrícula', dep['Matrícula'], tab, listKey, id, 'Matrícula')}
        </div>
        <div class="subsection-title">Documentos / Registro</div>
        <div class="field-group field-group-2" style="margin-bottom:20px;">
          ${efListText('Cartório', dep['Cartório'], tab, listKey, id, 'Cartório')}
          ${efListText('Número registro', dep['Número registro'], tab, listKey, id, 'Número registro')}
          ${efListText('Número livro', dep['Número livro'], tab, listKey, id, 'Número livro')}
          ${efListText('Número folha', dep['Número folha'], tab, listKey, id, 'Número folha')}
          ${efListText('Número da DNV', dep['Número da DNV'], tab, listKey, id, 'Número da DNV')}
          ${efListDate('Data de entrega do documento', dep['Data de entrega do documento'], tab, listKey, id, 'Data de entrega do documento')}
        </div>
        <div class="subsection-title">Pensão alimentícia</div>
        <div class="field-group field-group-2" style="margin-bottom:20px;">
          ${efListToggle('Pensão alimentícia', dep['Pensão alimentícia'], tab, listKey, id, 'Pensão alimentícia', ['NAO','SIM'])}
          ${pensaoSim ? efListDate('Determinar fim da pensão', dep['Determinar fim da pensão'], tab, listKey, id, 'Determinar fim da pensão') : ''}
        </div>
        <div class="subsection-title">Salário família</div>
        <div class="field-group field-group-2" style="margin-bottom:20px;">
          ${efListToggle('Salário família', dep['Salário família'], tab, listKey, id, 'Salário família', ['NAO','SIM'])}
          ${salarioFamiliaSim ? efListDate('Vencimento do atestado de frequência escolar para o salário família', dep['Vencimento do atestado de frequência escolar para o salário família'], tab, listKey, id, 'Vencimento do atestado de frequência escolar para o salário família') : ''}
          ${salarioFamiliaSim ? efListDate('Vencimento da carteira de vacinação para o salário família', dep['Vencimento da carteira de vacinação para o salário família'], tab, listKey, id, 'Vencimento da carteira de vacinação para o salário família') : ''}
        </div>
        <div class="subsection-title">Tributação e prazos</div>
        <div class="field-group field-group-2">
          ${irrfToggleHtml}
          ${irrfAtivo ? efListDate('Determinar fim IRRF', dep['Determinar fim IRRF'], tab, listKey, id, 'Determinar fim IRRF') : ''}
          ${irrfAtivo ? efListText('Idade até', dep['Idade até'], tab, listKey, id, 'Idade até') : ''}
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:24px;padding-top:16px;border-top:1px solid var(--border);">
          <button onclick="cancelDependente('${id}')" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#fff;border:1px solid var(--border-strong);border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;color:var(--text-primary);">Cancelar</button>
          <button onclick="confirmDependente('${id}')" style="display:inline-flex;align-items:center;gap:6px;padding:8px 18px;background:var(--brand-pink);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Adicionar</button>
        </div>
      </div>
    </div>`;
}

function confirmDependente(depId) {
  const taskId = state.currentTaskId;
  const draft = state._editDraft[taskId];
  if (!draft || !draft.dependentes || !Array.isArray(draft.dependentes.lista)) return;
  const dep = draft.dependentes.lista.find(d => d.id === depId);
  if (!dep) return;
  if (dep._isNew) delete dep._isNew;
  const item = document.querySelector(`.exec-ref-item[data-dep-id="${depId}"]`);
  if (item) {
    const trigger = item.querySelector('.exec-ref-trigger');
    const content = item.querySelector('.exec-ref-content');
    if (trigger && content) { content.style.display = 'none'; trigger.classList.remove('open'); }
  }
}

function cancelDependente(depId) {
  const taskId = state.currentTaskId;
  const draft = state._editDraft[taskId];
  if (!draft || !draft.dependentes || !Array.isArray(draft.dependentes.lista)) return;
  const dep = draft.dependentes.lista.find(d => d.id === depId);
  if (!dep) return;
  if (dep._isNew) {
    showConfirmModal({
      title: 'Descartar dependente?',
      message: 'Os dados preenchidos para este novo dependente serão perdidos.',
      confirmLabel: 'Descartar',
      danger: true,
      onConfirm: () => {
        const d = state._editDraft[taskId];
        if (d && d.dependentes && Array.isArray(d.dependentes.lista)) {
          d.dependentes.lista = d.dependentes.lista.filter(x => x.id !== depId);
        }
        switchFormTab('dependentes');
      }
    });
    return;
  }
  const task = getTaskById(taskId);
  const origLista = (task && task.formData && task.formData.abas && task.formData.abas.dependentes && Array.isArray(task.formData.abas.dependentes.lista))
    ? task.formData.abas.dependentes.lista : [];
  const orig = origLista.find(d => d.id === depId);
  if (!orig) return;
  const hasChanges = Object.keys(orig).some(k => k !== 'id' && String(orig[k] || '') !== String(dep[k] || ''));
  const doRestore = () => {
    const d = state._editDraft[taskId];
    const idx = d.dependentes.lista.findIndex(x => x.id === depId);
    if (idx >= 0) d.dependentes.lista[idx] = JSON.parse(JSON.stringify(orig));
    switchFormTab('dependentes');
  };
  if (!hasChanges) { doRestore(); return; }
  showConfirmModal({
    title: 'Descartar alterações?',
    message: 'As alterações feitas neste dependente serão revertidas para o estado original.',
    confirmLabel: 'Descartar',
    danger: true,
    onConfirm: doRestore
  });
}

function onFieldEdit(el) {
  if (el.dataset && el.dataset.listKey) { onListFieldEdit(el); return; }
  const { tab, section, field } = el.dataset;
  const taskId = state.currentTaskId;
  if (!state._editDraft[taskId] || !state._editDraft[taskId][tab]) return;
  if (!state._editDraft[taskId][tab][section]) state._editDraft[taskId][tab][section] = {};
  state._editDraft[taskId][tab][section][field] = el.value;
  if (tab === 'pessoal' && section === 'pessoais' && field === 'País de nacionalidade') {
    const docTab = qs('.form-tab.active[data-tab="documentos"]');
    if (docTab) switchFormTab('documentos');
  }
  if (typeof window.onFieldEditAfter === 'function') {
    try { window.onFieldEditAfter(tab, section, field, el.value); } catch (e) { /* noop */ }
  }
}

