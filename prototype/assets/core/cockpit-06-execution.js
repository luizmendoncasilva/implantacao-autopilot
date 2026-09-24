/* ============================================================
   EXEC_STEPS PADRÃO — backward compat para fluxos sem EXEC_STEPS declarado
   ============================================================ */
const DEFAULT_EXEC_STEPS = [
  {
    title: 'Gerar e baixar o arquivo TXT',
    desc: 'O TXT é gerado a partir dos dados da solicitação. Baixe para importar na Domínio.',
    action: { label: 'Baixar TXT', icon: 'file-down', doneLabel: 'Baixado', onClick: 'handleStepAction(0)' },
    timelineStep: 2,
    autoCompleteOnAction: true,
  },
  {
    title: 'Acessar a Domínio e subir o TXT',
    desc: 'Abra a Domínio e faça a importação do arquivo TXT. Marque como feito quando concluído.',
    timelineStep: 2,
    type: 'form-reference',
  },
  {
    title: 'Registrar no Gestta',
    desc: 'Copie o nome sugerido abaixo para garantir a correlação automática dos documentos.',
    action: { label: 'Abrir Gestta', icon: 'external-link', doneLabel: 'Aberto', onClick: 'handleStepAction(2)' },
    timelineStep: 2,
    showTaskId: true,
  },
  {
    title: 'Conclusão da etapa',
    desc: 'O processamento segue na sequência e o que precisar ser gerado chega ao cliente assim que ficar pronto.',
    type: 'final-message',
    timelineStep: 2,
  },
];

/* ============================================================
   EXEC_STEP_PRESETS — presets nomeados compartilhados por todos os fluxos.
   Cada HTML pode declarar EXEC_STEPS: 'nome_do_preset' (string) em vez de
   um array inline. Mudança aqui propaga automaticamente para todos os fluxos
   que referenciam o preset.
   ============================================================ */
/* Passos compartilhados por todos os fluxos não-admissão.
   Idênticos à admissão, mas sem o 1º passo (gerar TXT). */
const NON_ADMISSION_STEPS = [
  {
    title: 'Acessar a Domínio e fazer o processamento',
    desc: 'Abra a Domínio, realize o processamento correspondente a esta solicitação e marque como feito quando concluído.',
    timelineStep: 2,
    type: 'form-reference',
    defaultOpen: true,
  },
  {
    title: 'Registrar no Gestta',
    desc: 'Copie o nome sugerido abaixo para garantir a correlação automática dos documentos.',
    action: { label: 'Abrir Gestta', icon: 'external-link', doneLabel: 'Aberto', onClick: 'handleStepAction(1)' },
    timelineStep: 2,
    showTaskId: true,
  },
  {
    title: 'Conclusão da etapa',
    desc: 'O processamento segue na sequência e o que precisar ser gerado chega ao cliente assim que ficar pronto.',
    type: 'final-message',
    timelineStep: 2,
  },
];

/* Passos do fluxo de Afastamento.
   Registro na Domínio, SEM registro no Gestta — afastamento não gera documento
   correlacionado no Gestta hoje. Por isso tem preset próprio em vez de
   compartilhar o NON_ADMISSION_STEPS (que mantém o passo de Gestta). */
const AFASTAMENTO_STEPS = [
  {
    title: 'Acessar a Domínio e fazer o processamento',
    desc: 'Abra a Domínio, registre o afastamento e marque como feito quando concluído.',
    timelineStep: 2,
    type: 'form-reference',
    defaultOpen: true,
  },
  {
    title: 'Conclusão da etapa',
    desc: 'O processamento segue na sequência e o que precisar ser gerado chega ao cliente assim que ficar pronto.',
    type: 'final-message',
    timelineStep: 2,
  },
];

/* Passos do fluxo de Apontamentos em folha.
   Mesma estrutura da admissão, mas o passo 1 baixa a planilha enviada pelo cliente
   em vez de gerar TXT, e o passo 2 sobe essa planilha na Domínio. */
const APONTAMENTOS_STEPS = [
  {
    title: 'Baixar a planilha enviada pelo cliente',
    desc: 'Baixe a planilha de apontamentos enviada pelo cliente para subir na Domínio.',
    action: { label: 'Baixar planilha', icon: 'file-down', doneLabel: 'Baixada', onClick: 'handleStepAction(0)' },
    timelineStep: 2,
    autoCompleteOnAction: true,
  },
  {
    title: 'Acessar a Domínio e subir a planilha',
    desc: 'Abra a Domínio, suba a planilha no módulo de apontamentos e confira o processamento. Marque como feito quando concluído.',
    timelineStep: 2,
    type: 'form-reference',
    defaultOpen: true,
  },
  {
    title: 'Conclusão da etapa',
    desc: 'O processamento segue na sequência e o que precisar ser gerado chega ao cliente assim que ficar pronto.',
    type: 'final-message',
    timelineStep: 2,
  },
];

/* Passos do fluxo de Admissão RPA via Planilha.
   Operador baixa a planilha, cadastra contribuintes novos na Domínio
   e faz o espelhamento/processamento dos valores do RPA. */
const ADMISSAO_PLANILHA_STEPS = [
  {
    title: 'Baixar a planilha enviada pelo cliente',
    desc: 'Baixe a planilha de admissões de RPA enviada pelo cliente para processar na Domínio.',
    action: { label: 'Baixar planilha', icon: 'file-down', doneLabel: 'Baixada', onClick: 'handleStepAction(0)' },
    timelineStep: 2,
    autoCompleteOnAction: true,
  },
  {
    title: 'Cadastrar na Domínio os contribuintes que ainda não estão na base',
    desc: 'Abra a Domínio, cadastre os prestadores listados na planilha que ainda não constam na base do cliente. Marque como feito quando concluído.',
    timelineStep: 2,
    type: 'form-reference',
    defaultOpen: true,
  },
  {
    title: 'Espelhar e processar os valores do RPA na Domínio',
    desc: 'Faça o espelhamento dos valores dos RPAs conforme a planilha e processe na Domínio. Marque como feito quando concluído.',
    timelineStep: 2,
    type: 'form-reference',
  },
  {
    title: 'Registrar no Gestta',
    desc: 'Copie o nome sugerido abaixo para garantir a correlação automática dos documentos.',
    action: { label: 'Abrir Gestta', icon: 'external-link', doneLabel: 'Aberto', onClick: 'handleStepAction(3)' },
    timelineStep: 2,
    showTaskId: true,
  },
  {
    title: 'Conclusão da etapa',
    desc: 'O processamento segue na sequência e o que precisar ser gerado chega ao cliente assim que ficar pronto.',
    type: 'final-message',
    timelineStep: 2,
  },
];

/* Passos do fluxo de Solicitação Geral.
   Não há Domínio nem Gestta: o operador apenas redige a resposta que será
   enviada ao cliente e conclui. Passo único do tipo 'client-reply'. */
const SOLICITACAO_GERAL_STEPS = [
  {
    title: 'Responder ao cliente',
    desc: 'Descreva o que você fez nesta solicitação. Este texto será enviado ao cliente como resposta quando você concluir.',
    timelineStep: 2,
    type: 'client-reply',
  },
];

const EXEC_STEP_PRESETS = {
  admissao:          DEFAULT_EXEC_STEPS,
  admissao_planilha: ADMISSAO_PLANILHA_STEPS,
  solicitacao_geral: SOLICITACAO_GERAL_STEPS,
  ferias:            NON_ADMISSION_STEPS,
  rescisao:          NON_ADMISSION_STEPS,
  afastamento:       AFASTAMENTO_STEPS,
  geral:             NON_ADMISSION_STEPS,
  apontamentos:      APONTAMENTOS_STEPS,
};

function getExecSteps() {
  const raw = window.FLOW_CONFIG.EXEC_STEPS || DEFAULT_EXEC_STEPS;
  if (typeof raw === 'string') return EXEC_STEP_PRESETS[raw] || DEFAULT_EXEC_STEPS;
  return raw;
}

/* ============================================================
   RENDER: EXECUÇÃO
   ============================================================ */
function renderExecution(task) {
  const EXEC_STEPS = getExecSteps();
  qs('#exec-type-label').textContent = task.type;
  qs('#exec-client-label').textContent = task.clientName;
  qs('#exec-client-cnpj').textContent = task.cnpj;
  qs('#exec-meta-strip').innerHTML = olMetaStripHtml(task);
  qs('#exec-solicitante').textContent = task.senderName;
  const isAPx = task.origin === 'autopilot';
  const _lblEx = qs('#exec-solicitante-label'); if (_lblEx) _lblEx.textContent = isAPx ? 'Iniciado pelo' : 'Solicitado por';
  const scopes = task.senderScopes || [];
  qs('#exec-solicitante-tags').innerHTML = isAPx
    ? `<span class="contact-tag">robô</span>`
    : [`<span class="contact-tag contact-tag-client">cliente</span>`, ...scopes.map(s => `<span class="contact-tag">${s}</span>`)].join('');
  qs('#exec-timestamp').textContent = `Solicitado em ${solicitadoEmLabel(task)}`;
  qs('#exec-assignee').textContent = OPERATOR_NAME;

  if (!state._execProgress[task.id]) state._execProgress[task.id] = 0;
  if (!state._execActions[task.id]) state._execActions[task.id] = {};
  if (!state._execStepExpanded) state._execStepExpanded = {};
  if (!state._execStepExpanded[task.id]) state._execStepExpanded[task.id] = {};
  if (!state._gdocsFiles[task.id]) state._gdocsFiles[task.id] = [];

  const progress = state._execProgress[task.id];
  const actionsDone = state._execActions[task.id];
  const expandedMap = state._execStepExpanded[task.id];
  const gdocsFiles = state._gdocsFiles[task.id];

  renderTimelineHorizontal(qs('#exec-timeline'), EXEC_STEPS[progress] ? EXEC_STEPS[progress].timelineStep : 3, task);

  qs('#exec-steps').innerHTML = EXEC_STEPS.map((s, i) => {
    const done = i < progress;
    const active = i === progress;
    const pending = i > progress;
    const hasBodyExtra = s.type === 'upload' || s.type === 'final-message' || s.type === 'form-reference' || s.type === 'client-reply' || s.showTaskId;
    const expanded = !!expandedMap[i];
    const showBody = active || (done && expanded);
    let bodyExtra = '';
    let buttonsHtml = '';

    if (s.type === 'upload' && showBody) bodyExtra += renderUploadSection(i, gdocsFiles, active);
    if (s.type === 'final-message' && showBody) bodyExtra += renderFinalMessageSection(i, task, active);
    if (s.type === 'client-reply' && showBody) bodyExtra += renderClientReplySection(i, task, active);
    if (s.type === 'form-reference' && showBody) bodyExtra += renderFormReference(task, s.defaultOpen);
    if (s.showTaskId && showBody) bodyExtra += renderTaskIdPanel(task);

    if (done) {
      buttonsHtml = `<span class="badge badge-success"><i data-lucide="check" class="w-3 h-3"></i> Feito</span>`;
      if (s.editable) buttonsHtml += `<button class="step-edit-btn" onclick="event.stopPropagation(); editarPasso(${i})"><i data-lucide="pencil" class="w-3 h-3"></i> Editar</button>`;
      if (s.autoCompleteOnAction && s.action) {
        buttonsHtml += `<button class="step-edit-btn" onclick="event.stopPropagation(); ${s.action.onClick}"><i data-lucide="${s.action.icon}" class="w-3 h-3"></i> ${s.action.label} novamente</button>`;
      }
    } else if (active) {
      let actionBtn = '';
      if (s.action) {
        const actionDone = actionsDone[i];
        actionBtn = actionDone
          ? `<span class="step-action done"><i data-lucide="check" class="w-3.5 h-3.5"></i> ${s.action.doneLabel}</span>`
          : `<button class="step-action" onclick="${s.action.onClick}"><i data-lucide="${s.action.icon}" class="w-3.5 h-3.5"></i> ${s.action.label}</button>`;
      }
      let skipBtn = '';
      if (s.type === 'upload' && gdocsFiles.length === 0) {
        skipBtn = `<button class="step-action" onclick="pularPassoGdocs(${i})" style="border-style: dashed;">Não há documentos a adicionar</button>`;
      }
      const markDisabled = s.requiresFiles && gdocsFiles.length === 0;
      let markBtn = '';
      if (s.type === 'client-reply') {
        markBtn = `<button class="step-mark-done" onclick="enviarRespostaEConcluir(${i})"><i data-lucide="send" class="w-3.5 h-3.5"></i> Concluir e enviar resposta ao cliente</button>`;
      } else if (!s.autoCompleteOnAction) {
        markBtn = markDisabled
          ? `<button class="step-mark-done" disabled style="opacity:0.5;cursor:not-allowed;" title="Adicione pelo menos um arquivo"><i data-lucide="check" class="w-3.5 h-3.5"></i> Marcar como feito</button>`
          : `<button class="step-mark-done" onclick="marcarPassoFeito(${i})"><i data-lucide="check" class="w-3.5 h-3.5"></i> Marcar como feito</button>`;
      }
      buttonsHtml = actionBtn + skipBtn + markBtn;
    } else {
      buttonsHtml = `<span style="font-size: 11px; color: var(--text-tertiary);">Aguardando</span>`;
    }

    const collapsible = done && hasBodyExtra;
    const headerCls = `exec-step-header${collapsible ? ' collapsible' : ''}`;
    const headerOnClick = collapsible ? `onclick="toggleStepExpanded(${i})"` : '';
    const chevronHtml = collapsible
      ? `<i data-lucide="chevron-down" class="exec-step-chevron${expanded ? ' open' : ''}"></i>`
      : '';
    const showButtonsTop = !bodyExtra || s.type === 'form-reference' || collapsible;

    return `
      <div class="exec-step ${done ? 'done' : ''} ${active ? 'active' : ''}" style="${pending ? 'opacity: 0.55;' : ''} flex-direction: ${bodyExtra ? 'column' : 'row'}; align-items: ${bodyExtra ? 'stretch' : 'flex-start'};">
        <div class="${headerCls}" ${headerOnClick}>
          <div class="step-num">${done ? '✓' : i + 1}</div>
          <div style="flex: 1; min-width: 0;"><div style="font-weight: 600; margin-bottom: 4px;">${s.title}</div><div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.55;">${s.desc}</div></div>
          ${showButtonsTop ? `<div class="step-buttons">${buttonsHtml}</div>` : ''}
          ${chevronHtml}
        </div>
        ${bodyExtra ? `<div style="margin-top: 14px; ${s.type === 'form-reference' ? '' : 'padding-left: 42px;'}">${bodyExtra}${!collapsible ? `<div class="step-buttons" style="margin-top: 14px;">${buttonsHtml}</div>` : ''}</div>` : ''}
      </div>
    `;
  }).join('');

  refreshIcons();
}

function renderUploadSection(stepIdx, files, active) {
  const filesHtml = files.length > 0 ? `<div class="uploaded-files-list">${files.map((f, idx) => renderFileItem(f, { removable: active, removeFn: `removeGdocsFile(${idx})` })).join('')}</div>` : '';
  if (!active) return filesHtml || '<div style="font-size: 12px; color: var(--text-tertiary); font-style: italic;">Nenhum arquivo adicionado.</div>';
  return `
    <div class="upload-area" id="upload-area-${stepIdx}" onclick="document.getElementById('gdocs-file-input').click()" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleFileDrop(event)">
      <div class="upload-area-icon"><i data-lucide="upload-cloud" style="width:20px;height:20px;"></i></div>
      <div class="upload-area-title">Arraste arquivos aqui</div>
      <div class="upload-area-hint">ou <strong>selecione do computador</strong></div>
    </div>
    <input type="file" id="gdocs-file-input" style="display:none;" multiple onchange="handleFileSelect(event)" />
    ${filesHtml}
  `;
}

function findFormCampo(formData, nome) {
  const abas = formData && formData.abas;
  if (!abas) return null;
  function recurse(obj) {
    if (!obj || typeof obj !== 'object') return null;
    for (const [k, v] of Object.entries(obj)) {
      if (k === nome) return v;
      if (v && typeof v === 'object') {
        const found = recurse(v);
        if (found != null) return found;
      }
    }
    return null;
  }
  return recurse(abas);
}

function buildGesttaTaskName(task) {
  const id = task.id;
  const colaborador = task.formData && task.formData.colaborador ? task.formData.colaborador.nome : null;
  const cliente = task.clientName;
  const dash = '—';

  switch (task.typeCode) {
    case 'admissao_clt':
    case 'admissao_estagiario': {
      const dataInicio = findFormCampo(task.formData, 'Data da admissão')
        || findFormCampo(task.formData, 'Data de Admissão')
        || findFormCampo(task.formData, 'Início do Contrato')
        || dash;
      return `Admissão — ${colaborador || cliente} - Início: ${dataInicio} (${id})`;
    }
    case 'ferias_aviso_previo': {
      const dataInicio = findFormCampo(task.formData, 'Data de início do gozo') || dash;
      return `Aviso Prévio de Férias — ${colaborador || cliente} - Início: ${dataInicio} (${id})`;
    }
    case 'solicitacao_geral':
      return `Solicitação Geral — ${cliente} (${id})`;
    default:
      return colaborador
        ? `${task.type} — ${colaborador} (${id})`
        : `${task.type} — ${cliente} (${id})`;
  }
}

function renderTaskIdPanel(task) {
  const suggestedName = buildGesttaTaskName(task);
  const encoded = encodeURIComponent(suggestedName);
  return `
    <div style="background: var(--info-soft); border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 16px; margin-top: 4px;">
      <div style="font-size: 12px; font-weight: 600; color: #1e40af; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
        <i data-lucide="tag" style="width:13px;height:13px;"></i> Instrução de registro no Gestta
      </div>
      <div style="font-size: 12.5px; color: #3b82f6; margin-bottom: 10px;">Crie a tarefa no Gestta com o seguinte nome:</div>
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; background: #fff; padding: 10px 14px; border-radius: 8px; border: 1px solid #93c5fd; flex: 1; min-width: 200px; word-break: break-all;">${suggestedName}</div>
        <button id="copy-task-id-btn" onclick="copyTaskId(decodeURIComponent('${encoded}'))"
          style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer; white-space: nowrap;">
          <i data-lucide="copy" style="width:14px;height:14px;"></i> Copiar
        </button>
      </div>
    </div>
  `;
}

function copyTaskId(text) {
  navigator.clipboard.writeText(text).then(() => {
    flash('Nome copiado! Cole no campo de tarefa do Gestta.', 'success');
    const btn = qs('#copy-task-id-btn');
    if (btn) {
      btn.dataset.copied = '1';
      btn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;"></i> Copiado!';
      btn.style.background = '#16a34a';
      refreshIcons();
      setTimeout(() => {
        btn.innerHTML = '<i data-lucide="copy" style="width:14px;height:14px;"></i> Copiar';
        btn.style.background = '#2563eb';
        delete btn.dataset.copied;
        refreshIcons();
      }, 2000);
    }
  }).catch(() => flash('Selecione e copie o texto manualmente.', 'warning'));
}

function renderFinalMessageSection(stepIdx, task, active) {
  const manualFiles = state._gdocsFiles[task.id] || [];
  const filesHtml = manualFiles.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;">${manualFiles.map((f, idx) => renderFileItem(f, { removable: active, removeFn: `removeGdocsFile(${idx})` })).join('')}</div>`
    : '';
  const fileInput = active ? `<input type="file" id="gdocs-file-input" style="display:none;" multiple onchange="handleFileSelect(event)" />` : '';
  const attachBtn = active
    ? `<div style="margin-top:14px;"><button onclick="document.getElementById('gdocs-file-input').click()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#fff;border:1px solid var(--border-strong);border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;color:var(--text-primary);"><i data-lucide="paperclip" style="width:14px;height:14px;"></i> Anexar documento manualmente (opcional)</button></div>`
    : '';
  return `
    <div style="background:var(--info-soft);border:1px solid #bfdbfe;border-radius:10px;padding:16px 18px;display:flex;gap:12px;align-items:flex-start;">
      <i data-lucide="info" style="width:18px;height:18px;color:var(--info);flex-shrink:0;margin-top:2px;"></i>
      <div style="flex:1;font-size:13px;line-height:1.55;color:#1e40af;">
        <div style="font-weight:600;margin-bottom:4px;">Sua parte nessa solicitação foi concluída.</div>
        <div>Quando o processamento for concluído, o que precisar ser gerado é enviado automaticamente ao cliente pelo HUB. Você pode marcar essa etapa como feita para fechar a solicitação.</div>
      </div>
    </div>
    ${attachBtn}
    ${filesHtml}
    ${fileInput}
  `;
}

function renderClientReplySection(stepIdx, task, active) {
  const sol = task.formData && task.formData.abas ? task.formData.abas.solicitacao : null;
  const assunto = sol && sol.campos ? sol.campos['Assunto'] : null;
  const pedido = sol && sol.descricao ? sol.descricao.texto : null;
  if (!state._clientReply) state._clientReply = {};
  const replyVal = state._clientReply[task.id] || '';
  const manualFiles = state._gdocsFiles[task.id] || [];

  const clientAttachments = task.attachments || [];
  const clientFilesHtml = clientAttachments.length ? `
      <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.06em;font-weight:600;margin:12px 0 8px;">Anexos do cliente<span class="badge badge-neutral" style="margin-left:6px;font-size:10px;">${clientAttachments.length}</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">${clientAttachments.map(f => renderFileItem(f)).join('')}</div>` : '';
  const pedidoHtml = (assunto || pedido || clientAttachments.length) ? `
    <div style="background:var(--surface-subtle);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:16px;">
      <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.06em;font-weight:600;margin-bottom:6px;">O que o cliente pediu</div>
      ${assunto ? `<div style="font-weight:600;font-size:13px;margin-bottom:4px;">${esc(assunto)}</div>` : ''}
      ${pedido ? `<div style="font-size:13px;color:var(--text-secondary);line-height:1.55;">${esc(pedido)}</div>` : ''}
      ${clientFilesHtml}
    </div>` : '';

  const filesHtml = manualFiles.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;">${manualFiles.map((f, idx) => renderFileItem(f, { removable: active, removeFn: `removeGdocsFile(${idx})` })).join('')}</div>`
    : '';
  const fileInput = `<input type="file" id="gdocs-file-input" style="display:none;" multiple onchange="handleFileSelect(event)" />`;
  const attachBtn = `<div style="margin-top:14px;"><button onclick="document.getElementById('gdocs-file-input').click()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#fff;border:1px solid var(--border-strong);border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;color:var(--text-primary);"><i data-lucide="paperclip" style="width:14px;height:14px;"></i> Anexar documento (opcional)</button></div>`;

  return `
    ${pedidoHtml}
    <div class="field-label mb-2">Sua resposta ao cliente <span style="color:var(--brand-pink);">*</span></div>
    <textarea id="client-reply-text" oninput="setClientReply(this.value)" placeholder="Descreva o que você fez nesta solicitação. Ex.: Declaração de vínculo emitida e anexada, com cargo, salário e data de admissão." style="width:100%;min-height:130px;padding:12px;border:1px solid var(--border-strong);border-radius:10px;font-family:inherit;font-size:13px;line-height:1.55;resize:vertical;outline:none;" onfocus="this.style.borderColor='var(--brand-pink)'" onblur="this.style.borderColor='var(--border-strong)'">${esc(replyVal)}</textarea>
    <div style="display:flex;gap:6px;align-items:center;font-size:12px;color:var(--text-secondary);margin-top:8px;">
      <i data-lucide="send" style="width:13px;height:13px;flex-shrink:0;"></i> Esta mensagem será enviada ao cliente quando você concluir.
    </div>
    ${attachBtn}
    ${filesHtml}
    ${fileInput}
  `;
}

function setClientReply(value) {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  if (!state._clientReply) state._clientReply = {};
  state._clientReply[task.id] = value;
}

function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('dragover'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('dragover'); }
function handleFileDrop(e) { e.preventDefault(); e.currentTarget.classList.remove('dragover'); addFilesToGdocs(Array.from(e.dataTransfer.files)); }
function handleFileSelect(e) { addFilesToGdocs(Array.from(e.target.files)); e.target.value = ''; }

function addFilesToGdocs(files) {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  if (!state._gdocsFiles[task.id]) state._gdocsFiles[task.id] = [];
  files.forEach(f => {
    const sizeKB = (f.size / 1024).toFixed(0);
    state._gdocsFiles[task.id].push({ name: f.name, size: sizeKB > 1024 ? (sizeKB/1024).toFixed(1) + ' MB' : sizeKB + ' KB' });
  });
  renderExecution(task);
}

function removeGdocsFile(idx) { const task = getTaskById(state.currentTaskId); if (!task) return; state._gdocsFiles[task.id].splice(idx, 1); renderExecution(task); }
function editarPasso(stepIdx) { const task = getTaskById(state.currentTaskId); if (!task) return; state._execProgress[task.id] = stepIdx; flash('Voltando ao passo para ajustar.', 'info'); renderExecution(task); }

function pularPassoGdocs(stepIdx) {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  const total = getExecSteps().length;
  if (stepIdx + 1 >= total) { openConfirmFinish(); return; }
  state._execProgress[task.id] = stepIdx + 1;
  renderExecution(task);
}

function injectCopyButtons(html) {
  return html.replace(
    /<div class="field-value(?! empty)[^"]*">([\s\S]*?)<\/div>/g,
    (match, val) => {
      const text = (val || '').trim();
      if (!text || text === '—') return match;
      const safe = text.replace(/"/g, '&quot;');
      return `<div class="field-value">${val}<button class="exec-ref-copy-btn" data-copy="${safe}" onclick="execCopyField(this)" title="Copiar" style="margin-left:4px;vertical-align:middle;"><i data-lucide="copy" style="width:11px;height:11px;"></i></button></div>`;
    }
  );
}

function execCopyField(btn) {
  const value = btn.getAttribute('data-copy');
  navigator.clipboard.writeText(value).then(() => {
    btn.innerHTML = '<i data-lucide="check" style="width:11px;height:11px;color:var(--success);"></i>';
    lucide.createIcons();
    setTimeout(() => {
      btn.innerHTML = '<i data-lucide="copy" style="width:11px;height:11px;"></i>';
      lucide.createIcons();
    }, 1500);
  });
}

function toggleExecRefItem(btn) {
  const content = btn.nextElementSibling;
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  btn.classList.toggle('open', !isOpen);
  lucide.createIcons();
}

function renderFormReference(task, defaultOpen) {
  if (!task.formData) return '';
  const tabs = (FLOW_CONFIG.FORM_TABS_BY_TYPE || {})[task.typeCode] || [];
  if (!tabs.length) return '';

  const open = !!defaultOpen;
  const display = open ? 'block' : 'none';
  const triggerClass = open ? 'exec-ref-trigger open' : 'exec-ref-trigger';

  const savedEdit = state._editMode && state._editMode[task.id];
  if (state._editMode) state._editMode[task.id] = false;

  const items = tabs.map((tab, idx) => {
    const abaData = task.formData.abas && task.formData.abas[tab.id];
    const rawHtml = FLOW_CONFIG.renderFormTab(tab.id, abaData || {});
    const content = injectCopyButtons(rawHtml);
    return `<div class="exec-ref-item">
      <button class="${triggerClass}" onclick="toggleExecRefItem(this)">
        <span>${tab.label}</span>
        <i data-lucide="chevron-down" class="exec-ref-chevron" style="width:16px;height:16px;"></i>
      </button>
      <div class="exec-ref-content" style="display:${display};">${content}</div>
    </div>`;
  }).join('');

  if (state._editMode) state._editMode[task.id] = savedEdit;

  const anexos = task.attachments || [];
  const anexosBadge = anexos.length ? `<span class="exec-ref-badge">(${anexos.length})</span>` : '';
  const anexosBody = anexos.length
    ? anexos.map(a => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);"><i data-lucide="paperclip" style="width:14px;height:14px;color:var(--text-secondary);flex-shrink:0;"></i><div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:500;">${a.name}</div><div style="font-size:11px;color:var(--text-secondary);">${a.size}</div></div></div>`).join('')
    : `<div style="font-size:13px;color:var(--text-secondary);">Nenhum anexo enviado.</div>`;

  const anexosItem = `<div class="exec-ref-item">
    <button class="${triggerClass}" onclick="toggleExecRefItem(this)">
      <span>Anexos${anexosBadge}</span>
      <i data-lucide="chevron-down" class="exec-ref-chevron" style="width:16px;height:16px;"></i>
    </button>
    <div class="exec-ref-content" style="display:${display};">${anexosBody}</div>
  </div>`;

  return `<div class="exec-ref-card">${items}${anexosItem}</div>`;
}

function handleStepAction(stepIdx) {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  const step = getExecSteps()[stepIdx];
  const progress = state._execProgress[task.id] || 0;
  const alreadyDone = stepIdx < progress;
  if (!state._execActions[task.id]) state._execActions[task.id] = {};
  state._execActions[task.id][stepIdx] = true;
  if (alreadyDone) {
    flash(`${step.action.label} — repetido.`, 'info');
    return;
  }
  if (step.autoCompleteOnAction) {
    flash(`${step.action.label} — concluído.`, 'success');
    const total = getExecSteps().length;
    if (stepIdx + 1 >= total) { openConfirmFinish(); return; }
    state._execProgress[task.id] = stepIdx + 1;
    renderExecution(task);
    return;
  }
  flash(`${step.action.label} — ação registrada. Marque como feito quando concluído.`, 'info');
  renderExecution(task);
}

function marcarPassoFeito(stepIdx) {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  const total = getExecSteps().length;
  if (stepIdx + 1 >= total) { openConfirmFinish(); return; }
  state._execProgress[task.id] = stepIdx + 1;
  renderExecution(task);
}

function enviarRespostaEConcluir(stepIdx) {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  const reply = ((state._clientReply && state._clientReply[task.id]) || '').trim();
  if (!reply) {
    showAlertModal({ title: 'Resposta obrigatória', message: 'Escreva a resposta que será enviada ao cliente antes de concluir a solicitação.' });
    return;
  }
  if (!state.messages[task.id]) state.messages[task.id] = [];
  state.messages[task.id].push({ from: 'operator', text: reply, timestamp: 'agora mesmo' });
  task._operatorReply = reply;
  openConfirmFinish();
}

function toggleStepExpanded(stepIdx) {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  if (!state._execStepExpanded) state._execStepExpanded = {};
  if (!state._execStepExpanded[task.id]) state._execStepExpanded[task.id] = {};
  state._execStepExpanded[task.id][stepIdx] = !state._execStepExpanded[task.id][stepIdx];
  renderExecution(task);
}

