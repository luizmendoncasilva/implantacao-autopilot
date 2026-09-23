/* ============================================================
   DATE PICKER
   ============================================================ */
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function toggleDatePicker(id) {
  const popup = document.querySelector('#' + id + ' .ef-cal-popup');
  if (!popup) return;
  if (popup.classList.contains('open')) { popup.classList.remove('open'); return; }
  document.querySelectorAll('.ef-cal-popup.open').forEach(p => p.classList.remove('open'));
  const input = document.querySelector('#' + id + ' .ef-datepicker-input');
  const parts = (input.value || '').split('/');
  const today = new Date();
  popup.dataset.year  = parts.length === 3 ? parseInt(parts[2]) : today.getFullYear();
  popup.dataset.month = parts.length === 3 ? parseInt(parts[1]) - 1 : today.getMonth();
  renderCalGrid(id);
  popup.classList.add('open');
}

function navCalMonth(id, delta) {
  const popup = document.querySelector('#' + id + ' .ef-cal-popup');
  let month = parseInt(popup.dataset.month) + delta;
  let year  = parseInt(popup.dataset.year);
  if (month < 0)  { month = 11; year--; }
  if (month > 11) { month = 0;  year++; }
  popup.dataset.month = month;
  popup.dataset.year  = year;
  renderCalGrid(id);
}

function renderCalGrid(id) {
  const popup  = document.querySelector('#' + id + ' .ef-cal-popup');
  const year   = parseInt(popup.dataset.year);
  const month  = parseInt(popup.dataset.month);
  const input  = document.querySelector('#' + id + ' .ef-datepicker-input');
  const parts  = (input.value || '').split('/');
  const selDay = parts.length === 3 ? parseInt(parts[0]) : -1;
  const selMon = parts.length === 3 ? parseInt(parts[1]) - 1 : -1;
  const selYr  = parts.length === 3 ? parseInt(parts[2]) : -1;
  const today  = new Date();
  const first  = new Date(year, month, 1).getDay();
  const days   = new Date(year, month + 1, 0).getDate();
  let html = `<div class="ef-cal-header"><button class="ef-cal-nav" onclick="navCalMonth('${id}',-1)">&#8249;</button><span class="ef-cal-month-label">${MONTHS_PT[month]} ${year}</span><button class="ef-cal-nav" onclick="navCalMonth('${id}',1)">&#8250;</button></div><div class="ef-cal-weekdays"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div><div class="ef-cal-grid">`;
  for (let i = 0; i < first; i++) html += `<div class="ef-cal-day empty"></div>`;
  for (let d = 1; d <= days; d++) {
    const isSel   = d === selDay && month === selMon && year === selYr;
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const cls = 'ef-cal-day' + (isSel ? ' selected' : '') + (isToday ? ' today' : '');
    html += `<div class="${cls}" onclick="selectCalDate('${id}',${d},${month},${year})">${d}</div>`;
  }
  html += `</div>`;
  popup.innerHTML = html;
}

function selectCalDate(id, day, month, year) {
  const input = document.querySelector('#' + id + ' .ef-datepicker-input');
  input.value = String(day).padStart(2,'0') + '/' + String(month + 1).padStart(2,'0') + '/' + year;
  onFieldEdit(input);
  document.querySelector('#' + id + ' .ef-cal-popup').classList.remove('open');
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.ef-datepicker')) {
    document.querySelectorAll('.ef-cal-popup.open').forEach(p => p.classList.remove('open'));
  }
});

function onToggleEdit(btn, tab, section, field, value) {
  btn.closest('.ef-toggle-group').querySelectorAll('.ef-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const taskId = state.currentTaskId;
  if (!state._editDraft[taskId] || !state._editDraft[taskId][tab]) return;
  if (!state._editDraft[taskId][tab][section]) state._editDraft[taskId][tab][section] = {};
  state._editDraft[taskId][tab][section][field] = value;
  if (tab === 'pessoal' && section === 'pessoais' && field === 'Possui Dependentes') {
    syncDependentesTabAvailability(value, btn);
  }
}

function onCheckboxEdit(el, tab, section, field, option) {
  const taskId = state.currentTaskId;
  if (!state._editDraft[taskId] || !state._editDraft[taskId][tab]) return;
  if (!state._editDraft[taskId][tab][section]) state._editDraft[taskId][tab][section] = {};
  let arr = Array.isArray(state._editDraft[taskId][tab][section][field]) ? [...state._editDraft[taskId][tab][section][field]] : [];
  if (el.checked) { if (!arr.includes(option)) arr.push(option); }
  else { arr = arr.filter(o => o !== option); }
  state._editDraft[taskId][tab][section][field] = arr;
}

function enterEditMode() {
  const task = getTaskById(state.currentTaskId);
  if (!task || !task.formData) return;
  const currentTab = _getActiveFormTabId();
  state._editMode[task.id] = true;
  state._editDraft[task.id] = JSON.parse(JSON.stringify(task.formData.abas));
  renderForm(task, currentTab);
}

function cancelEdits() {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  const currentTab = _getActiveFormTabId();
  const draft = state._editDraft[task.id];
  const hasChanges = draft && JSON.stringify(draft) !== JSON.stringify(task.formData.abas);
  const doCancelEdits = () => { state._editMode[task.id] = false; delete state._editDraft[task.id]; renderForm(task, currentTab); };
  if (!hasChanges) { doCancelEdits(); return; }
  showConfirmModal({
    title: 'Descartar alterações?',
    message: 'Há modificações não salvas. Descartar e sair do modo de edição?',
    confirmLabel: 'Descartar',
    danger: true,
    onConfirm: doCancelEdits,
  });
}

function saveEdits() {
  const task = getTaskById(state.currentTaskId);
  const draft = state._editDraft && state._editDraft[task.id];
  if (!draft) return;
  if (!state._editLog[task.id]) state._editLog[task.id] = [];
  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const original = task.formData.abas;

  Object.keys(draft).forEach(tabId => {
    const origTab = original[tabId] || {};
    const draftTab = draft[tabId] || {};
    if (tabId === 'observacoes') {
      if (String(origTab.texto || '') !== String(draftTab.texto || '')) {
        state._editLog[task.id].push({ tabId, section: 'observacoes', field: 'Comentário', before: origTab.texto || '—', after: draftTab.texto || '—', changedBy: OPERATOR_NAME, changedAt: now });
      }
      return;
    }
    if (tabId === 'dependentes') {
      const origLista = (origTab && Array.isArray(origTab.lista)) ? origTab.lista : [];
      const draftLista = (draftTab && Array.isArray(draftTab.lista)) ? draftTab.lista : [];
      origLista.forEach(orig => {
        if (!draftLista.find(d => d.id === orig.id)) {
          state._editLog[task.id].push({ tabId, section: 'dependentes', field: 'Dependente removido', before: orig['Nome'] || '—', after: '—', changedBy: OPERATOR_NAME, changedAt: now });
        }
      });
      draftLista.forEach(d => {
        const orig = origLista.find(o => o.id === d.id);
        if (!orig) {
          state._editLog[task.id].push({ tabId, section: 'dependentes', field: 'Dependente adicionado', before: '—', after: d['Nome'] || '(sem nome)', changedBy: OPERATOR_NAME, changedAt: now });
        } else {
          Object.keys(d).forEach(k => {
            if (k === 'id' || k.startsWith('_')) return;
            if (String(orig[k] || '') !== String(d[k] || '')) {
              state._editLog[task.id].push({ tabId, section: 'dependentes', field: `${d['Nome'] || 'dep'} → ${k}`, before: orig[k] || '—', after: d[k] || '—', changedBy: OPERATOR_NAME, changedAt: now });
            }
          });
        }
      });
      return;
    }
    Object.keys(draftTab).forEach(sectionKey => {
      const origSection = origTab[sectionKey] || {};
      const draftSection = draftTab[sectionKey] || {};
      if (typeof draftSection !== 'object' || Array.isArray(draftSection)) return;
      Object.keys(draftSection).forEach(field => {
        if (String(origSection[field] || '') !== String(draftSection[field] || '')) {
          state._editLog[task.id].push({ tabId, section: sectionKey, field, before: origSection[field] || '—', after: draftSection[field] || '—', changedBy: OPERATOR_NAME, changedAt: now });
        }
      });
    });
  });

  const currentTab = _getActiveFormTabId();
  task.formData.abas = JSON.parse(JSON.stringify(draft));
  state._editMode[task.id] = false;
  delete state._editDraft[task.id];
  renderForm(task, currentTab);
  flash('Alterações salvas com sucesso.', 'success');
}

function showEditLog() {
  const task = getTaskById(state.currentTaskId);
  const log = (state._editLog && state._editLog[task.id]) || [];
  const existing = qs('#modal-edit-log');
  if (existing) existing.remove();

  const TAB = { geral: 'Geral', profissional: 'Profissional', pessoal: 'Pessoal', documentos: 'Documentos', dependentes: 'Dependentes', observacoes: 'Observações', solicitacao: 'Solicitação' };
  const SEC = { dadosBasicos: 'Dados Básicos', admissao: 'Admissão', contratoExperiencia: 'Contrato de Experiência', horario: 'Horário', ctps: 'Carteira Profissional', pis: 'PIS', pagamento: 'Pagamento', sindicais: 'Sindicais', endereco: 'Endereço', pessoais: 'Informações Pessoais', deficiencia: 'Portador de Deficiência', documentosProfissionais: 'Documentos Profissionais', documentos: 'Documentos', estrangeiro: 'Documentos de estrangeiro', dependentes: 'Dependentes', observacoes: 'Observações', campos: 'Campos', descricao: 'Descrição', anexos: 'Anexos' };

  const content = log.length === 0
    ? `<div style="color:var(--text-tertiary);text-align:center;padding:32px;">Nenhuma alteração registrada ainda.</div>`
    : log.map(e => `
      <div style="padding:14px 0;border-bottom:1px solid var(--border);">
        <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em;">${TAB[e.tabId] || e.tabId} · ${SEC[e.section] || e.section}</div>
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">${e.field}</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span style="background:var(--danger-soft);color:var(--danger);padding:3px 9px;border-radius:5px;font-size:12px;">${e.before}</span>
          <i data-lucide="arrow-right" style="width:12px;height:12px;color:var(--text-tertiary);flex-shrink:0;"></i>
          <span style="background:var(--success-soft);color:var(--success);padding:3px 9px;border-radius:5px;font-size:12px;">${e.after}</span>
        </div>
        <div style="font-size:11px;color:var(--text-tertiary);margin-top:6px;">operador: ${e.changedBy} · ${e.changedAt}</div>
      </div>`).join('');

  const el = document.createElement('div');
  el.id = 'modal-edit-log';
  el.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:200;display:flex;align-items:center;justify-content:center;" onclick="if(event.target===this)closeEditLog()">
      <div style="background:#fff;border-radius:14px;width:520px;max-width:95vw;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.15);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border);">
          <div style="font-size:15px;font-weight:700;">Histórico de alterações</div>
          <button onclick="closeEditLog()" style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:4px;border-radius:6px;display:flex;align-items:center;"><i data-lucide="x" style="width:18px;height:18px;"></i></button>
        </div>
        <div style="overflow-y:auto;padding:4px 24px 24px;">${content}</div>
      </div>
    </div>`;
  document.body.appendChild(el);
  refreshIcons();
}

function closeEditLog() { const m = qs('#modal-edit-log'); if (m) m.remove(); }

/* ---- Modais genéricos de confirmação e alerta ---- */
function showConfirmModal({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, onConfirm }) {
  const existing = qs('#modal-confirm');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'modal-confirm';
  el.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:300;display:flex;align-items:center;justify-content:center;" onclick="if(event.target===this)_closeConfirmModal()">
      <div style="background:#fff;border-radius:14px;width:400px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,0.15);">
        <div style="padding:24px 24px 0;">
          <div style="font-size:15px;font-weight:700;margin-bottom:8px;">${title}</div>
          <div style="font-size:13.5px;color:var(--text-secondary);line-height:1.55;">${message}</div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;padding:20px 24px;">
          <button onclick="_closeConfirmModal()" style="padding:8px 16px;border:1px solid var(--border-strong);border-radius:8px;background:#fff;font-size:13px;font-weight:500;cursor:pointer;">${cancelLabel}</button>
          <button id="modal-confirm-ok" style="padding:8px 18px;border:none;border-radius:8px;background:${danger ? 'var(--danger)' : 'var(--brand-pink)'};color:#fff;font-size:13px;font-weight:600;cursor:pointer;">${confirmLabel}</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el);
  qs('#modal-confirm-ok').onclick = () => { _closeConfirmModal(); onConfirm && onConfirm(); };
}
function _closeConfirmModal() { const m = qs('#modal-confirm'); if (m) m.remove(); }

function showAlertModal({ title, message }) {
  const existing = qs('#modal-alert');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'modal-alert';
  el.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:300;display:flex;align-items:center;justify-content:center;" onclick="if(event.target===this)qs('#modal-alert').remove()">
      <div style="background:#fff;border-radius:14px;width:380px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,0.15);">
        <div style="padding:24px 24px 0;">
          <div style="font-size:15px;font-weight:700;margin-bottom:8px;">${title}</div>
          <div style="font-size:13.5px;color:var(--text-secondary);line-height:1.55;">${message}</div>
        </div>
        <div style="display:flex;justify-content:flex-end;padding:20px 24px;">
          <button onclick="qs('#modal-alert').remove()" style="padding:8px 18px;border:none;border-radius:8px;background:var(--brand-pink);color:#fff;font-size:13px;font-weight:600;cursor:pointer;">Entendi</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el);
}

/* ============================================================
   TIMELINE
   ============================================================ */
const TIMELINE_STEPS = [
  { id: 'received',   label: 'Solicitação recebida' },
  { id: 'validation', label: 'Validação do operador' },
  { id: 'processing', label: 'Processamento' },
  { id: 'done',       label: 'Concluída' },
];

// Componente ÚNICO de linha do tempo (dots + linha + label + sub). Usado pela timeline do
// cliente (estados da tarefa) E pelo stepper do Autopilot (macroetapas do fluxo) — muda só a
// lista de passos, o visual é sempre o mesmo. Mexeu aqui, muda em todos.
// steps: [{ label, meta, state }], state ∈ 'done' | 'active' | 'warn' (travou) | 'pending'.
function tlStepperHTML(steps) {
  const dotCls = { done: 'tl-dot-done', active: 'tl-dot-active', warn: 'tl-dot-warn', pending: 'tl-dot-pending' };
  return steps.map((s, i) => {
    const dot = s.state === 'done' ? '<i data-lucide="check" class="w-3 h-3"></i>' : String(i + 1);
    return `<div class="tl-item-h ${s.state}"><div class="tl-dot ${dotCls[s.state] || 'tl-dot-pending'}">${dot}</div><div class="tl-step">${esc(s.label)}</div><div class="tl-meta">${esc(s.meta || '')}</div></div>`;
  }).join('');
}

function renderTimelineHorizontal(targetEl, currentStepIdx, task, opts) {
  // Um fluxo pode sobrescrever os rótulos das etapas (ex.: Autopilot usa
  // "Atuação do operador" no lugar de "Validação do operador"). Sem override,
  // usa o padrão do DP. Mesmo mecanismo dos demais overrides do FLOW_CONFIG.
  // noActive: sem etapa "em andamento" — usado quando a tarefa está na fila
  // (só "recebida" concluída, o resto aguardando; ninguém está tocando ainda).
  const noActive = !!(opts && opts.noActive);
  const steps = (window.FLOW_CONFIG && FLOW_CONFIG.timelineSteps) || TIMELINE_STEPS;
  const mapped = steps.map((step, i) => {
    if (i < currentStepIdx) return { label: step.label, meta: 'Concluído', state: 'done' };
    if (i === currentStepIdx && !noActive) return { label: step.label, meta: 'Em andamento', state: 'active' };
    return { label: step.label, meta: 'Aguardando', state: 'pending' };
  });
  targetEl.innerHTML = tlStepperHTML(mapped);
}

/* ============================================================
   RENDER: TASK ANALYSIS
   ============================================================ */
// Faixa de identificação do header (base da Domínio, origem e colaborador).
// Mesmo conjunto que aparece na lista, pra o operador reconhecer a solicitação
// pelos mesmos âncoras. Campos vêm do mock (ver TAREFAS em lista-operador.html).
// Faixa abaixo do nome no header: Origem · ERP operado (origem primeiro). O
// colaborador NÃO entra aqui — já aparece no miolo (Dados da solicitação).
function olMetaStripHtml(task) {
  const sep = '<span style="color:var(--text-tertiary);">·</span>';
  const m = domMetaParts(task);
  return [m.origem, m.erp].join(sep);
}

/* Link "Abrir página do cliente" — injetado no header da tarefa, ao lado do CNPJ.
   Fonte única: vale pra QUALQUER tarefa (Hub e Autopilot), já que o header é o
   mesmo (renderTask). Idempotente — a tela de execução é reusada entre tarefas. */
function montarLinkCliente() {
  const cnpj = qs('#task-client-cnpj');
  if (!cnpj || qs('#client-page-link')) { refreshIcons(); return; }
  const a = document.createElement('a');
  a.id = 'client-page-link';
  a.className = 'client-link';
  a.href = 'https://app.bhub.ai/clientes/exemplo'; // link fake — abre em nova aba
  a.target = '_blank';
  a.rel = 'noopener';
  a.title = 'Abrir página do cliente';
  a.setAttribute('aria-label', 'Abrir página do cliente');
  a.innerHTML = '<i data-lucide="external-link"></i>'; // só o ícone; rótulo vai no tooltip
  cnpj.parentNode.appendChild(a);
  refreshIcons();
}

function renderTask(task) {
  qs('#task-id-label').textContent = task.id;
  qs('#task-type-label').textContent = task.type;
  qs('#task-client-name').textContent = task.clientName;
  qs('#task-client-cnpj').textContent = task.cnpj;
  qs('#task-meta-strip').innerHTML = olMetaStripHtml(task);
  qs('#task-client-logo').textContent = task.logoText;
  montarLinkCliente(); // botão "Abrir página do cliente" no header — toda tarefa
  qs('#task-solicitante').textContent = task.senderName;
  // Header alinhado ao modal de espiada: tarefa do robô = "Iniciado pelo … robô";
  // solicitação de cliente = "Solicitado por … cliente" + escopos.
  const isAP = task.origin === 'autopilot';
  qs('#task-solicitante-label').textContent = isAP ? 'Iniciado pelo' : 'Solicitado por';
  const scopes = task.senderScopes || [];
  qs('#task-solicitante-tags').innerHTML = isAP
    ? `<span class="contact-tag">robô</span>`
    : [`<span class="contact-tag contact-tag-client">cliente</span>`, ...scopes.map(s => `<span class="contact-tag">${s}</span>`)].join('');
  qs('#task-timestamp').textContent = `Solicitado em ${solicitadoEmLabel(task)}`;
  qs('#task-assignee').textContent = OPERATOR_NAME;
  renderTimelineHorizontal(qs('#task-timeline'), 1, task);
  renderClientAttachments(task);

  const msgs = state.messages[task.id] || [];
  const activityBlock = qs('#activity-block');
  if (msgs.length > 1) {
    activityBlock.classList.remove('hidden');
    qs('#activity-messages').innerHTML = `<div class="history-list">${msgs.map(m => renderHistoryMessage(m, task)).join('')}</div>`;
  } else {
    activityBlock.classList.add('hidden');
  }

  renderForm(task);
  refreshIcons();
}

function renderClientAttachments(task) {
  const block = qs('#attachments-block');
  if (!block) return;
  const all = (task.attachments || []).map(a => ({ name: a.name, size: a.size, source: 'initial' }));
  block.classList.remove('hidden');
  qs('#attachments-count-badge').textContent = all.length;
  if (all.length === 0) {
    qs('#attachments-list').innerHTML = `<div style="font-size:13px;color:var(--text-tertiary);padding:8px 0;">Nenhum anexo enviado pelo cliente.</div>`;
  } else {
    qs('#attachments-list').innerHTML = all.map(f => renderFileItem(f)).join('');
  }
  refreshIcons();
}

function getFileIconClass(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['pdf'].includes(ext)) return { cls: 'file-icon-pdf', label: 'PDF' };
  if (['jpg', 'jpeg', 'png'].includes(ext)) return { cls: 'file-icon-img', label: 'IMG' };
  if (['xlsx', 'xls', 'csv'].includes(ext)) return { cls: 'file-icon-xls', label: 'XLS' };
  return { cls: 'file-icon-doc', label: 'DOC' };
}

function renderFileItem(file, options) {
  const opts = options || {};
  const removable = opts.removable || false;
  const removeFn = opts.removeFn || null;
  const icon = getFileIconClass(file.name);
  const isResponse = file.source === 'response';
  return `
    <div class="file-item ${isResponse ? 'highlighted' : ''}">
      <div class="file-item-icon"><div class="${icon.cls}">${icon.label}</div></div>
      <div style="min-width: 0; display: flex; align-items: baseline; flex-wrap: wrap;">
        <span class="file-item-name">${file.name}</span>
        <span class="file-item-meta">· ${file.size || '—'}</span>
        ${isResponse ? `<span class="file-item-response-tag">resposta · ${file.when}</span>` : ''}
      </div>
      <div class="file-item-actions">
        <button class="file-action-btn" title="Visualizar" onclick="event.stopPropagation();"><i data-lucide="eye" style="width:16px;height:16px;"></i></button>
        <button class="file-action-btn" title="Baixar" onclick="event.stopPropagation();"><i data-lucide="download" style="width:16px;height:16px;"></i></button>
        ${removable ? `<button class="file-action-btn danger" title="Remover" onclick="${removeFn}"><i data-lucide="x" style="width:16px;height:16px;"></i></button>` : ''}
      </div>
    </div>
  `;
}

function renderHistoryMessage(m, task) {
  const isOperator = m.from === 'operator';
  const author = isOperator ? (typeof OPERATOR_NAME !== 'undefined' && OPERATOR_NAME ? OPERATOR_NAME : 'Operador') : (task.senderName || task.colaborador || 'Cliente');
  const initials = (author || '?').trim().split(/\s+/).map(n => n[0]).slice(0, 2).join('');
  const scopes = task.senderScopes || [];
  const tagsHtml = isOperator
    ? `<span class="contact-tag" style="background:#fff5f6;color:var(--brand-pink);border-color:#f9c5cb;">operador</span>`
    : `<span class="contact-tag contact-tag-client">cliente</span>${scopes.map(s => `<span class="contact-tag">${s}</span>`).join('')}`;
  return `
    <div class="history-msg ${isOperator ? 'operator' : 'client'}">
      <div class="history-msg-header">
        <div class="history-msg-avatar">${initials}</div>
        <span class="history-msg-author">${author}</span>
        <span style="display:inline-flex;gap:4px;">${tagsHtml}</span>
        <span class="history-msg-timestamp">${m.timestamp}</span>
      </div>
      <div class="history-msg-text">${m.text}</div>
      ${(m.attachments && m.attachments.length) ? `<div class="history-msg-attachments">${m.attachments.map(f => renderFileItem(f)).join('')}</div>` : ''}
    </div>
  `;
}

function renderHistoryInto(targetEl, task) {
  const msgs = state.messages[task.id] || [];
  if (msgs.length === 0) {
    targetEl.innerHTML = `<div style="color: var(--text-tertiary); font-size: 12px; text-align: center; padding: 12px;">Primeira mensagem desta conversa.</div>`;
    return;
  }
  targetEl.innerHTML = `<div class="history-list">${msgs.map(m => renderHistoryMessage(m, task)).join('')}</div>`;
}

/* ============================================================
   AÇÕES DO OPERADOR
   ============================================================ */
function pegarProximaTarefa() {
  if (state.active) {
    state.currentTaskId = state.active.id;
    renderTask(state.active);
    showScreen('task');
    return;
  }
  const responded = state.stationed.find(t => t.clientResponded);
  let task;
  if (responded) {
    state.stationed = state.stationed.filter(t => t.id !== responded.id);
    task = responded;
    task.clientResponded = false;
  } else {
    if (state.queue.length === 0) { flash('Fila vazia! 🎉', 'success'); return; }
    task = state.queue.shift();
  }
  state.active = task;
  state.currentTaskId = task.id;
  renderTask(task);
  showScreen('task');
}

function abrirEstacionada(id) {
  const task = state.stationed.find(t => t.id === id);
  if (!task) return;
  if (task.clientResponded) {
    showConfirmModal({
      title: 'Cliente respondeu',
      message: 'O cliente respondeu essa tarefa. Deseja abri-la para continuar a execução?',
      confirmLabel: 'Abrir tarefa',
      onConfirm: () => pegarProximaTarefa(),
    });
    return;
  }
  qs('#drawer-title').textContent = `${task.type} — ${task.clientName}`;
  qs('#drawer-subtitle').textContent = `Aguardando cliente desde ${task.stationedAt}`;
  qs('#drawer-body').innerHTML = `
    <div style="background: var(--warning-soft); border-radius: 10px; padding: 12px 14px; font-size: 13px; color: var(--warning); display: flex; gap: 10px; align-items: flex-start; margin-bottom: 16px;">
      <i data-lucide="clock" class="w-4 h-4" style="flex-shrink: 0; margin-top: 2px;"></i>
      <div><div style="font-weight: 600; margin-bottom: 2px;">${task.stationedReason}</div></div>
    </div>
    <div class="section-title" style="font-size: 11px; margin-bottom: 10px;"><i data-lucide="message-square"></i>Histórico</div>
    <div class="history-list" id="drawer-history"></div>
    <div style="margin-top: 18px; display: flex; justify-content: flex-end;">
      <button class="btn btn-primary" onclick="retomarEstacionada('${task.id}')"><i data-lucide="play" class="w-4 h-4"></i>Retomar tarefa</button>
    </div>
  `;
  renderHistoryInto(qs('#drawer-history'), task);
  qs('#modal-drawer').classList.remove('hidden');
  refreshIcons();
}

// Retoma uma tarefa em espera sem precisar da resposta do cliente — abre a
// partir do estágio atual.
function retomarEstacionada(id) {
  qs('#modal-drawer').classList.add('hidden');
  openTaskById(id);
}

function aceitarTarefa() {
  _checkEditGuard(() => {
    const task = getTaskById(state.currentTaskId);
    if (!task) return;
    state._editMode[task.id] = false;
    delete state._editDraft[task.id];
    task.timelineStep = 2; // entra em Processamento (reflete no acompanhamento do cliente)
    renderExecution(task);
    showScreen('execution');
  });
}

/* ------------------------------------------------------------
   Voltar pra conferência de dados — do Processamento, o operador
   volta um passo pra ajustar algo que já conferiu (descobriu algo na
   Domínio, precisa corrigir um dado). NÃO é troca de tela silenciosa:
   regride a etapa da tarefa, o que reflete pro cliente e pro operador.
   Por isso passa por confirmação. Ver decisoes/voltar-a-conferencia.md.
   ------------------------------------------------------------ */
function voltarParaConferencia() {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  showConfirmModal({
    title: 'Voltar para validação?',
    message: `
      <p style="margin:0 0 10px;">A tarefa volta pra etapa de <strong>Validação</strong>.</p>
      <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;">
        <li>O status muda pra <strong>"Em andamento"</strong> — pro cliente e pra você.</li>
        <li>Os passos de <strong>Processamento</strong> que você já marcou serão <strong>desmarcados</strong>; você refaz ao reavançar.</li>
      </ul>`,
    confirmLabel: 'Voltar para validação',
    cancelLabel: 'Cancelar',
    onConfirm: () => _doVoltarParaConferencia(task),
  });
}

function _doVoltarParaConferencia(task) {
  // Zera o processamento — editar a conferência pode invalidar o que já rodou,
  // então é mais seguro refazer do que arrastar estado possivelmente inconsistente.
  state._execProgress[task.id] = 0;
  if (state._execActions) state._execActions[task.id] = {};
  if (state._execStepExpanded) state._execStepExpanded[task.id] = {};
  // Regride a etapa (a timeline do acompanhamento do cliente lê task.timelineStep).
  task.timelineStep = 1;
  // Volta pra conferência em leitura — o operador clica em "Editar" quando/se quiser
  // mexer. Evita edição acidental e aviso de "não salvo" pra quem só quer reler.
  state._editMode[task.id] = false;
  delete state._editDraft[task.id];
  renderTask(task);
  showScreen('task');
  flash('Tarefa voltou para validação — status "Em andamento".', 'info');
}

/* ------------------------------------------------------------
   Devolver à fila — operador abre mão da atribuição (troca interna,
   invisível pro cliente). A tarefa volta pra fila geral com tudo que
   já foi feito preservado; outro operador continua de onde parou.
   ------------------------------------------------------------ */
let _returnReason = null;

function _attribInitials(name) {
  return String(name || '').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

// Cresce o textarea conforme o conteúdo (sem barra de rolagem).
function autoGrowField(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

// Motivo (obrigatório) via dropdown. Em "Outro", as observações também viram obrigatórias.
function onReturnReasonChange(sel) {
  _returnReason = sel.value || null;
  const lbl = qs('#return-queue-detail-label');
  if (lbl) lbl.textContent = _returnReason === 'Outro' ? 'Observações (obrigatório)' : 'Observações (opcional)';
  updateReturnConfirmState();
}

// Habilita o confirmar: precisa de motivo; se for "Outro", precisa também de observações.
function updateReturnConfirmState() {
  const detail = ((qs('#return-queue-reason-detail') || {}).value || '').trim();
  const ok = !!_returnReason && (_returnReason !== 'Outro' || detail.length > 0);
  const btn = qs('#return-queue-confirm');
  if (btn) btn.disabled = !ok;
}

function openReturnQueueModal() {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  qs('#return-queue-from-av').textContent = _attribInitials(OPERATOR_NAME);
  qs('#return-queue-from-name').textContent = OPERATOR_NAME;
  // Avisa se há rascunho de edição não salvo (será descartado ao devolver).
  const hasUnsaved = !!(task.id && state._editMode[task.id]);
  qs('#return-queue-unsaved').classList.toggle('hidden', !hasUnsaved);
  // Reforço extra quando a devolução vem da execução (já há progresso nos passos).
  const fromExec = !qs('#screen-execution').classList.contains('hidden');
  qs('#return-queue-keep-text').textContent = fromExec
    ? 'Tudo que já foi salvo e editado, as mensagens com o cliente e o progresso dos passos já concluídos ficam do jeito que estão — nada é desfeito.'
    : 'Tudo que já foi salvo e editado, além das mensagens trocadas com o cliente, fica do jeito que está — nada é desfeito.';
  // Reset do motivo a cada abertura (motivo é obrigatório).
  _returnReason = null;
  const sel = qs('#return-queue-reason'); if (sel) sel.value = '';
  const detail = qs('#return-queue-reason-detail'); if (detail) { detail.value = ''; detail.style.height = ''; }
  const lbl = qs('#return-queue-detail-label'); if (lbl) lbl.textContent = 'Observações (opcional)';
  updateReturnConfirmState();
  qs('#modal-return-queue').classList.remove('hidden');
  refreshIcons();
}

function closeReturnQueueModal(ev) {
  if (ev && ev.target && !ev.target.classList.contains('modal-backdrop')) return;
  const m = qs('#modal-return-queue');
  if (m) m.classList.add('hidden');
}

function devolverParaFila() {
  if (!_returnReason) return; // motivo é obrigatório
  const task = state.active;
  const detail = ((qs('#return-queue-reason-detail') || {}).value || '').trim();
  closeReturnQueueModal();
  if (!task) return;
  // Trilha de auditoria da devolução (quem/quando/motivo/transição). No protótipo
  // fica no objeto da tarefa; no real vai pro audit log (ver handoff §6/§7).
  task._returnLog = { by: OPERATOR_NAME, at: 'agora mesmo', reason: _returnReason, detail, from: OPERATOR_NAME, to: null };
  // Descarta apenas o rascunho de edição não salvo; tudo que foi salvo (formulário,
  // anexos, conversa, progresso dos passos de execução) é preservado no objeto.
  state._editMode[task.id] = false;
  delete state._editDraft[task.id];
  // A tarefa sai da atribuição (active) e volta pra fila geral (queue),
  // reordenada por SLA como qualquer tarefa não atribuída.
  state.active = null;
  state.currentTaskId = null;
  state.queue.push(task);
  state.queue.sort((a, b) => slaToMinutes(a.sla) - slaToMinutes(b.sla));
  _returnReason = null;
  renderHome();
  showScreen('home');
  flash('Tarefa devolvida à fila — disponível pra outro operador', 'success');
}

function openAskClientModal() {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  qs('#modal-task-context').innerHTML = `
    <div style="display: flex; gap: 10px; align-items: center;">
      <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #f25461, #f97316); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">${task.logoText}</div>
      <div><div style="font-weight: 600;">${task.type} · ${task.clientName}</div><div style="font-size: 12px; color: var(--text-secondary);">Tarefa ${task.id}</div></div>
    </div>
  `;
  renderHistoryInto(qs('#modal-history'), task);
  qs('#modal-message-text').value = '';
  state._askClientFiles = [];
  renderAskClientFiles();
  qs('#modal-ask-client').classList.remove('hidden');
  refreshIcons();
  setTimeout(() => qs('#modal-message-text').focus(), 100);
}

function closeAskClientModal() { qs('#modal-ask-client').classList.add('hidden'); }

function renderAskClientFiles() {
  const el = qs('#ask-client-files');
  if (!el) return;
  const files = state._askClientFiles || [];
  el.innerHTML = files.map((f, idx) => renderFileItem(f, { removable: true, removeFn: `removeAskClientFile(${idx})` })).join('');
  refreshIcons();
}

function handleAskClientFileSelect(e) {
  Array.from(e.target.files).forEach(f => {
    const sizeKB = (f.size / 1024).toFixed(0);
    state._askClientFiles.push({ name: f.name, size: sizeKB > 1024 ? (sizeKB/1024).toFixed(1) + ' MB' : sizeKB + ' KB' });
  });
  e.target.value = '';
  renderAskClientFiles();
}

function removeAskClientFile(idx) { state._askClientFiles.splice(idx, 1); renderAskClientFiles(); }

function enviarPendenciaCliente() {
  const text = qs('#modal-message-text').value.trim();
  if (!text) { showAlertModal({ title: 'Campo obrigatório', message: 'Digite uma mensagem para o cliente antes de enviar.' }); return; }
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  if (!state.messages[task.id]) state.messages[task.id] = [];
  const attachments = (state._askClientFiles || []).slice();
  state.messages[task.id].push({ from: 'operator', text, timestamp: 'agora mesmo', attachments });
  state._askClientFiles = [];
  state.active = null;
  state.queue = state.queue.filter(t => t.id !== task.id);
  state.stationed.push({ ...task, stationedAt: 'agora mesmo', stationedReason: text.length > 80 ? text.substring(0, 80) + '...' : text, clientResponded: false, respondedAt: null });
  closeAskClientModal();
  goHome();
  flash('Tarefa colocada em espera — o cliente foi notificado.', 'success');
}

