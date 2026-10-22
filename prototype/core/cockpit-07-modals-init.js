/* ============================================================
   MODAL: CONFIRM FINISH
   ============================================================ */
function openConfirmFinish() {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  qs('#confirm-finish-detail').innerHTML = `Você marcou todas as etapas de <strong>${task.type}</strong> de <strong>${task.clientName}</strong> como feitas.`;
  qs('#modal-confirm-finish').classList.remove('hidden');
  refreshIcons();
}

function closeConfirmFinish() { qs('#modal-confirm-finish').classList.add('hidden'); }

function confirmarFinalizacao() {
  const task = getTaskById(state.currentTaskId);
  if (!task) return;
  const completedTask = { ...task, completedAt: 'agora mesmo' };
  state.completed.push(completedTask);
  state.active = null;
  closeConfirmFinish();
  renderSuccess(completedTask);
  showScreen('success');
}

/* ============================================================
   RENDER: SUCCESS
   ============================================================ */
function renderSuccess(task) {
  const colaborador = task.formData && task.formData.colaborador ? task.formData.colaborador.nome : null;
  const rows = [['Empresa', task.clientName], ['CNPJ', task.cnpj], ['Tipo', task.type]];
  if (colaborador) rows.push(['Colaborador', colaborador]);
  rows.push(['Operador(a)', 'Daniele Ribeiro']);
  rows.push(['Concluída em', 'hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })]);
  rows.push(['Tarefa', '#' + task.id]);
  qs('#success-summary').innerHTML = rows.map(([label, value]) => `<div class="summary-row"><span class="summary-label">${label}</span><span class="summary-value">${value}</span></div>`).join('');
}

/* ============================================================
   DRAWERS
   ============================================================ */
function openDrawer(type) {
  if (type === 'estacionadas') {
    qs('#drawer-title').textContent = 'Tarefas em espera';
    qs('#drawer-subtitle').textContent = `${state.stationed.length} aguardando o cliente responder`;
    qs('#drawer-body').innerHTML = state.stationed.length === 0
      ? `<div style="padding: 24px; text-align: center; color: var(--text-tertiary);">Nenhuma tarefa em espera.</div>`
      : state.stationed.map(t => `<div class="task-item" style="margin-bottom: 8px;"><div style="flex: 1;"><div style="font-size: 11px; color: var(--text-tertiary); text-transform: uppercase;">${t.type}</div><div style="font-weight: 600;">${t.clientName}</div></div>${t.clientResponded ? `<span class="badge badge-pink">Respondeu</span>` : `<span class="badge badge-warning">Aguardando</span>`}</div>`).join('');
  } else {
    qs('#drawer-title').textContent = 'Tarefas concluídas hoje';
    qs('#drawer-subtitle').textContent = `${state.completed.length} finalizadas`;
    qs('#drawer-body').innerHTML = state.completed.length === 0
      ? `<div style="padding: 24px; text-align: center; color: var(--text-tertiary);">Nenhuma tarefa concluída ainda hoje.</div>`
      : state.completed.map(t => `<div class="task-item" style="margin-bottom: 8px; cursor: default;"><div style="flex: 1;"><div style="font-size: 11px; color: var(--text-tertiary); text-transform: uppercase;">${t.type}</div><div style="font-weight: 600;">${t.clientName}</div></div><span class="badge badge-success"><i data-lucide="check" class="w-3 h-3"></i> Concluída</span></div>`).join('');
  }
  qs('#modal-drawer').classList.remove('hidden');
  refreshIcons();
}

function closeDrawer() { qs('#modal-drawer').classList.add('hidden'); }

/* ============================================================
   NOTIFICAÇÕES
   ============================================================ */
function renderNotifications() {
  const list = qs('#notif-list');
  list.innerHTML = state.notifications.map(n => `
    <div class="notif-item">
      ${n.unread ? '<div class="dot"></div>' : '<div style="width: 8px; flex-shrink: 0;"></div>'}
      <div style="flex: 1;"><div style="font-size: 13px; color: var(--text-primary); line-height: 1.45;">${n.text}</div><div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">${n.time}</div></div>
    </div>
  `).join('');
  qs('#notif-dot').style.display = state.notifications.some(n => n.unread) ? 'block' : 'none';
}

/* ============================================================
   SIMULAÇÕES
   ============================================================ */
function simularRespostaCliente() {
  const aguardando = state.stationed.find(t => !t.clientResponded);
  if (!aguardando) { showAlertModal({ title: 'Sem tarefas em espera', message: 'Não há tarefas aguardando resposta do cliente. Coloque uma tarefa em espera primeiro.' }); return; }
  aguardando.clientResponded = true;
  aguardando.respondedAt = 'agora mesmo';
  if (!state.messages[aguardando.id]) state.messages[aguardando.id] = [];
  const cfg = window.FLOW_CONFIG;
  const simMsg = cfg.simulateClientResponseText
    ? cfg.simulateClientResponseText(aguardando)
    : 'Prontinho, segue o documento reenviado em melhor qualidade. Qualquer outra coisa me avisa!';
  const simAttachments = cfg.simulateClientResponseAttachments
    ? cfg.simulateClientResponseAttachments(aguardando)
    : [{ name: 'documento-reenviado.pdf', size: '480 KB' }];
  state.messages[aguardando.id].push({ from: 'client', text: simMsg, timestamp: 'agora mesmo', attachments: simAttachments });
  // Anexo do cliente também entra no bloco consolidado de anexos da tarefa (regra 04-comunicacao-cliente.md § Anexos em mensagens).
  if (!aguardando.attachments) aguardando.attachments = [];
  aguardando.attachments.push(...simAttachments);
  state.notifications.unshift({ id: Date.now(), text: `Cliente de ${aguardando.clientName} respondeu a tarefa em espera`, time: 'agora mesmo', unread: true });
  if (state.currentScreen === 'home') renderHome();
  renderNotifications();
  flash(`Cliente de ${aguardando.clientName} respondeu!`, 'info');
}

function resetDemo() {
  showConfirmModal({
    title: 'Resetar protótipo',
    message: 'Voltar ao estado inicial? Todas as alterações feitas na sessão serão perdidas.',
    confirmLabel: 'Resetar',
    danger: true,
    onConfirm: () => { _initState(); sortQueueBySLA(); renderNotifications(); goHome(); },
  });
}

/* ============================================================
   FLASH
   ============================================================ */
function flash(msg, type) {
  const colors = {
    success: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
    info:    { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    warning: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  };
  const c = colors[type || 'info'];
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;top:60px;left:50%;transform:translateX(-50%);background:${c.bg};color:${c.text};border:1px solid ${c.border};padding:10px 18px;border-radius:999px;font-size:13px;font-weight:500;z-index:300;box-shadow:0 10px 30px rgba(0,0,0,0.12);`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; }, 2600);
  setTimeout(() => el.remove(), 3000);
}

/* ============================================================
   INIT
   ============================================================ */
function _initCockpit() {
  const cfg = window.FLOW_CONFIG || {};

  // Modo STANDALONE: pra protótipos que adaptam um layout/print/HTML que não é
  // do Cockpit, ou que só precisam de um componente isolado. Não monta sidebar,
  // topbar nem fila — os tokens de design e os helpers (badges, botões, modais,
  // drawer, datatable) já estão disponíveis, mas a própria página do protótipo
  // define seu HTML. Ativar com window.FLOW_CONFIG = { standalone: true }.
  if (cfg.standalone) {
    refreshIcons();
    return;
  }

  _buildShell();
  _initState();
  // Wire up notification toggle after shell is in the DOM
  qs('#notif-toggle').addEventListener('click', () => { qs('#notif-panel').classList.toggle('hidden'); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#notif-toggle') && !e.target.closest('#notif-panel')) qs('#notif-panel').classList.add('hidden');
  });
  sortQueueBySLA();
  renderNotifications();

  // Tela de entrada: por padrão o protótipo abre na fila ('queue'), mas isso
  // deixou de ser obrigatório — quando o pedido é uma tela específica (ex.:
  // já pular direto pra execução, ou pra validação de uma tarefa puntual),
  // declare FLOW_CONFIG.entryScreen: 'task' | 'execution' | 'success'.
  // FLOW_CONFIG.entryTaskId escolhe qual tarefa abrir (default: 1ª da fila).
  const entry = cfg.entryScreen || 'queue';
  if (entry === 'queue') {
    renderHome();
    showScreen('home');
  } else {
    const targetId = cfg.entryTaskId || ((state.queue || [])[0] && state.queue[0].id);
    if (!targetId) {
      renderHome();
      showScreen('home');
    } else {
      openTaskById(targetId); // já deixa a tela 'task' visível
      if (entry === 'execution' || entry === 'success') {
        const t = getTaskById(targetId) || state.active;
        if (t) {
          renderExecution(t);
          showScreen('execution');
          if (entry === 'success') {
            renderSuccess(t);
            showScreen('success');
          }
        }
      }
    }
  }
  refreshIcons();

  // Deep-link: se o operador chegou clicando numa tarefa na lista
  // (lista-operador.html abre o fluxo com ?ref=lista), pula a home e abre
  // direto a tela da tarefa — replica o que vai acontecer de verdade pra ele.
  // Isso tem prioridade sobre entryScreen, porque representa navegação real.
  try {
    if (new URLSearchParams(window.location.search).get('ref') === 'lista') {
      _olOpenOnArrival();
    }
  } catch (e) { /* sem URL params, segue no entryScreen configurado */ }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initCockpit);
} else {
  _initCockpit();
}

// Botão "Acompanhamento" no topbar (fonte única). Aparece SÓ quando a tela visível é
// uma FILA de tarefas do operador — a que tem o hero "Pegar próxima tarefa" (#ol-header).
// Isso cobre a fila dedicada (lista-operador) E a home de cada fluxo, e some nas telas de
// execução da tarefa (#screen-task/execution/success), onde o #ol-header fica oculto.
// _syncAcompanhamentoBtn() é chamado por showScreen() e olMount() a cada troca de tela.
function _syncAcompanhamentoBtn() {
  const btn = document.getElementById('btn-acompanhamento');
  if (!btn) return;
  const hero = document.getElementById('ol-header'); // hero da fila (Pegar próxima tarefa)
  const naFila = !!(hero && hero.offsetParent !== null); // existe E está visível na tela
  btn.style.display = naFila ? 'inline-flex' : 'none';
}
(function _injectAcompanhamentoBtn() {
  const page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (page === 'acompanhamento') return; // a própria tela de destino
  let tries = 0;
  (function place() {
    if (document.getElementById('btn-acompanhamento')) { _syncAcompanhamentoBtn(); return; }
    const right = document.querySelector('.topbar-right');
    if (!right) { if (tries++ < 40) setTimeout(place, 50); return; } // gerente (.mgr-topbar) não entra: sem fila
    const a = document.createElement('a');
    a.id = 'btn-acompanhamento';
    // Leva a origem (arquivo atual + hash) pra que o "Voltar pra fila" retorne pra cá.
    const origem = (location.pathname.split('/').pop() || 'lista-operador.html') + location.search + location.hash;
    a.href = 'acompanhamento.html?origem=' + encodeURIComponent(origem);
    a.title = 'Painel de acompanhamento (gestores e coordenadores)';
    // Começa oculto; _syncAcompanhamentoBtn decide a visibilidade pela tela atual.
    a.style.cssText = 'display:none;align-items:center;gap:7px;height:38px;padding:0 14px;border:1px solid var(--border);border-radius:10px;background:#fff;color:var(--text-primary);font-size:13px;font-weight:500;text-decoration:none;margin-right:12px;';
    a.innerHTML = '<i data-lucide="layout-dashboard" style="width:16px;height:16px;color:var(--brand-blue);"></i> Acompanhamento';
    right.insertBefore(a, right.firstChild);
    if (window.lucide) lucide.createIcons();
    _syncAcompanhamentoBtn();
  })();
})();
