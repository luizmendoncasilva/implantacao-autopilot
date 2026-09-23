/* ============================================================
   cockpit-core.js — Shell compartilhado para todos os protótipos de fluxo DP
   Cada fluxo define window.FLOW_CONFIG antes de incluir este script.
   ============================================================ */

/* ---- CSS injection ---- */
(function () {
  const style = document.createElement('style');
  style.textContent = `
  :root {
    --brand-pink: #f25461;
    --brand-pink-hover: #e83d4d;
    --brand-pink-soft: #fde7ea;
    --brand-blue: #0171e4;
    --brand-blue-soft: rgba(1, 113, 228, 0.10);
    --sidebar-bg: #141414;
    --sidebar-item: #2a2a2a;
    --sidebar-item-hover: #3a3a3a;
    --surface: #ffffff;
    --surface-muted: #f7f7f8;
    --surface-subtle: #fafafa;
    --text-primary: #18181b;
    --text-secondary: #52525b;
    --text-tertiary: #a1a1aa;
    --border: #e4e4e7;
    --border-strong: #d4d4d8;
    --success: #16a34a;
    --success-soft: #dcfce7;
    --danger: #dc2626;
    --danger-soft: #fee2e2;
    --warning: #d97706;
    --warning-soft: #fef3c7;
    --info: #2563eb;
    --info-soft: #dbeafe;
  }
  html, body { font-family: 'Inter', system-ui, sans-serif; background: var(--surface-muted); color: var(--text-primary); font-size: 14px; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }
  .sidebar { width: 98px; background: var(--sidebar-bg); color: #fff; display: flex; flex-direction: column; align-items: center; padding: 18px 0 20px; position: fixed; left: 0; top: 0; bottom: 0; z-index: 40; }
  .sidebar .brand { font-weight: 700; font-size: 15px; margin-bottom: 32px; position: relative; }
  .sidebar .brand::after { content: ''; position: absolute; right: -6px; bottom: 5px; width: 4px; height: 4px; background: var(--brand-pink); border-radius: 50%; }
  .sidebar-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; width: 76px; border-radius: 14px; cursor: pointer; margin-bottom: 6px; transition: background .15s; }
  .sidebar-item:hover { background: var(--sidebar-item-hover); }
  .sidebar-item.active { background: var(--brand-pink); }
  .sidebar-item .icon-wrap { width: 42px; height: 32px; background: var(--sidebar-item); border-radius: 999px; display: flex; align-items: center; justify-content: center; }
  .sidebar-item.active .icon-wrap { background: transparent; }
  .sidebar-item .label { font-size: 11px; text-align: center; line-height: 1.2; color: #fff; }
  .sidebar .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #f25461, #f97316); margin-top: auto; border: 2px solid #2a2a2a; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 13px; }
  .main { margin-left: 98px; min-height: 100vh; display: flex; flex-direction: column; }
  .topbar { background: transparent; display: flex; align-items: center; height: 44px; padding-right: 18px; position: sticky; top: 0; z-index: 30; }
  .topbar .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 14px; }
  .notif-btn { position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 8px; }
  .notif-btn:hover { background: var(--surface-muted); }
  .notif-btn .dot { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: var(--brand-pink); border: 2px solid #fff; }
  .section-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 24px 28px; margin-bottom: 16px; }
  .section-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-pink); margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
  .section-title i[data-lucide] { width: 16px; height: 16px; }
  .field-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-tertiary); margin-bottom: 4px; }
  .field-value { font-size: 14px; color: var(--text-primary); font-weight: 500; }
  .field-value.empty { color: var(--text-tertiary); font-weight: 400; }
  .field-group { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px 24px; }
  .field-group-2 { grid-template-columns: repeat(2, 1fr); }
  .field-group-3 { grid-template-columns: repeat(3, 1fr); }
  #task-summary-backdrop .field-group { grid-template-columns: repeat(2, 1fr); gap: 14px 20px; }
  /* Campos do acordeon no modal: fonte densa, consistente com o miolo do Autopilot. */
  #task-summary-backdrop .field-label { font-size: 10.5px; margin-bottom: 3px; }
  #task-summary-backdrop .field-value { font-size: 12.5px; }
  .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
  .badge-success { background: var(--success-soft); color: var(--success); }
  .badge-danger { background: var(--danger-soft); color: var(--danger); }
  .badge-warning { background: var(--warning-soft); color: var(--warning); }
  .badge-info { background: var(--info-soft); color: var(--info); }
  .badge-pink { background: var(--brand-pink-soft); color: var(--brand-pink); }
  .badge-neutral { background: var(--surface-muted); color: var(--text-secondary); border: 1px solid var(--border); }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s; border: 1px solid transparent; }
  .btn-primary { background: var(--brand-pink); color: #fff; }
  .btn-primary:hover { background: var(--brand-pink-hover); }
  .btn-secondary { background: #fff; color: var(--text-primary); border-color: var(--border-strong); }
  .btn-secondary:hover { background: var(--surface-muted); }
  .btn-ghost { background: transparent; color: var(--text-secondary); }
  .btn-ghost:hover { background: var(--surface-muted); color: var(--text-primary); }
  .btn-danger { background: #fff; color: var(--danger); border-color: #fecaca; }
  .btn-danger:hover { background: var(--danger-soft); }
  .btn-lg { padding: 14px 28px; font-size: 14px; }
  .form-tabs { display: inline-flex; gap: 2px; padding: 4px; background: var(--surface-muted); border-radius: 10px; flex-wrap: wrap; }
  .form-tab { padding: 7px 16px; font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; border-radius: 7px; display: inline-flex; align-items: center; gap: 6px; background: transparent; border: none; transition: all .15s; }
  .form-tab:hover:not(.disabled):not(.active) { color: var(--text-primary); }
  .form-tab.active { background: var(--surface); color: var(--text-primary); box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
  .form-tab.disabled { color: var(--text-tertiary); cursor: not-allowed; opacity: 0.5; }
  .file-item { display: inline-flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; transition: border-color .15s; max-width: 100%; }
  .file-item:hover { border-color: var(--border-strong); }
  .file-item.highlighted { border-color: var(--brand-pink); background: var(--brand-pink-soft); }
  .file-item-icon { flex-shrink: 0; width: 22px; height: 26px; position: relative; }
  .file-icon-pdf { background: #ef4444; color: #fff; border-radius: 3px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 3px; font-size: 8px; font-weight: 800; letter-spacing: 0.3px; width: 100%; height: 100%; position: relative; }
  .file-icon-pdf::before { content: ''; position: absolute; top: 0; right: 0; border-left: 6px solid #fca5a5; border-bottom: 6px solid transparent; }
  .file-icon-img { background: #3b82f6; color: #fff; border-radius: 3px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 3px; font-size: 8px; font-weight: 800; width: 100%; height: 100%; position: relative; }
  .file-icon-img::before { content: ''; position: absolute; top: 0; right: 0; border-left: 6px solid #93c5fd; border-bottom: 6px solid transparent; }
  .file-icon-doc { background: #8b5cf6; color: #fff; border-radius: 3px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 3px; font-size: 8px; font-weight: 800; width: 100%; height: 100%; position: relative; }
  .file-icon-doc::before { content: ''; position: absolute; top: 0; right: 0; border-left: 6px solid #c4b5fd; border-bottom: 6px solid transparent; }
  .file-icon-xls { background: #16a34a; color: #fff; border-radius: 3px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 3px; font-size: 8px; font-weight: 800; width: 100%; height: 100%; position: relative; }
  .file-icon-xls::before { content: ''; position: absolute; top: 0; right: 0; border-left: 6px solid #86efac; border-bottom: 6px solid transparent; }
  .file-item-name { font-size: 13px; color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 360px; }
  .file-item-meta { font-size: 11px; color: var(--text-tertiary); margin-left: 4px; white-space: nowrap; }
  .file-item-response-tag { font-size: 10px; color: var(--brand-pink); font-weight: 600; margin-left: 4px; white-space: nowrap; }
  .file-item-actions { display: flex; align-items: center; gap: 2px; margin-left: 6px; padding-left: 8px; border-left: 1px solid var(--border); }
  .file-action-btn { width: 28px; height: 28px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; transition: all .12s; }
  .file-action-btn:hover { background: var(--surface-muted); color: var(--brand-pink); }
  .file-action-btn.danger:hover { background: var(--danger-soft); color: var(--danger); }
  .subsection-title { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 24px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
  .subsection-title:first-child { margin-top: 0; }
  .task-item { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: border-color .15s, box-shadow .15s; }
  .task-item:hover:not(.task-item-static) { border-color: var(--brand-pink); box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .task-item.highlight { border-color: var(--brand-pink); background: linear-gradient(to right, #fff5f6, #fff); box-shadow: 0 0 0 3px rgba(242,84,97,0.08); }
  .modal-backdrop { position: fixed; inset: 0; background: rgba(15,15,15,0.55); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 24px; }
  .modal-backdrop.hidden { display: none; }
  .modal-panel { background: #fff; border-radius: 16px; width: 100%; max-width: 720px; max-height: 88vh; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.25); overflow: hidden; }
  .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; background: var(--surface-subtle); }
  .message { padding: 12px 14px; border-radius: 12px; font-size: 13px; line-height: 1.55; margin-bottom: 10px; max-width: 92%; }
  .message-client { background: var(--surface-muted); border: 1px solid var(--border); }
  .message-operator { background: var(--brand-pink-soft); border: 1px solid #f9c5cb; margin-left: auto; }
  .notif-panel { position: absolute; top: 44px; right: 14px; width: 360px; background: #fff; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 14px 30px rgba(0,0,0,0.12); overflow: hidden; z-index: 50; }
  .notif-panel.hidden { display: none; }
  .notif-item { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; gap: 10px; cursor: pointer; }
  .notif-item:hover { background: var(--surface-muted); }
  .notif-item:last-child { border-bottom: none; }
  .notif-item .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand-pink); flex-shrink: 0; margin-top: 6px; }
  .exec-step { display: flex; align-items: flex-start; gap: 14px; padding: 18px; border: 1px solid var(--border); border-radius: 12px; margin-bottom: 10px; background: #fff; transition: all .2s; }
  .exec-step.done { border-color: var(--success); background: linear-gradient(to right, #f0fdf4, #fff); }
  .exec-step.active { border-color: var(--brand-pink); box-shadow: 0 0 0 3px rgba(242,84,97,0.1); }
  .exec-step-header { display: flex; align-items: flex-start; gap: 14px; width: 100%; }
  .exec-step-header.collapsible { cursor: pointer; }
  .exec-step-chevron { width: 18px; height: 18px; color: var(--text-secondary); flex-shrink: 0; align-self: center; transition: transform 0.2s; }
  .exec-step-chevron.open { transform: rotate(180deg); }
  .exec-step .step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--surface-muted); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; flex-shrink: 0; }
  .exec-step.done .step-num { background: var(--success); color: #fff; }
  .exec-step.active .step-num { background: var(--brand-pink); color: #fff; }
  .exec-ref-card { background: #fff; border: 1px solid var(--border); border-radius: 12px; margin-bottom: 0; overflow: hidden; }
  .exec-ref-card-header { padding: 16px 20px 14px; font-size: 14px; font-weight: 600; border-bottom: 1px solid var(--border); color: var(--text-primary); }
  .exec-ref-item { border-bottom: 1px solid var(--border); }
  .exec-ref-item:last-child { border-bottom: none; }
  .exec-ref-trigger { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; font-size: 13.5px; font-weight: 600; background: none; border: none; cursor: pointer; text-align: left; color: var(--text-primary); gap: 8px; }
  .exec-ref-trigger:hover { background: var(--surface-subtle); }
  .exec-ref-chevron { flex-shrink: 0; transition: transform 0.2s; }
  .exec-ref-trigger.open .exec-ref-chevron { transform: rotate(180deg); }
  .exec-ref-content { padding: 4px 20px 24px; }
  .exec-ref-badge { font-size: 12px; font-weight: 400; color: var(--text-secondary); margin-left: 6px; }
  .exec-ref-copy-btn { padding: 2px 4px; border: none; background: none; cursor: pointer; color: var(--text-tertiary); border-radius: 4px; display: inline-flex; align-items: center; flex-shrink: 0; }
  .exec-ref-copy-btn:hover { background: var(--surface-muted); color: var(--text-secondary); }
  .empty-state { text-align: center; padding: 48px 24px; }
  .empty-state .icon-wrap { width: 64px; height: 64px; background: var(--brand-pink-soft); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: var(--brand-pink); margin-bottom: 20px; }
  .attachment { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--surface-subtle); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; cursor: pointer; transition: border-color .15s; }
  .attachment:hover { border-color: var(--brand-pink); }
  .home-top-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px; align-items: stretch; }
  .stats-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); }
  .stats-row:last-child { border-bottom: none; }
  .stats-row.clickable { cursor: pointer; transition: background .12s; }
  .stats-row.clickable:hover { background: var(--surface-subtle); }
  .stats-row-label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
  .stats-row-sublabel { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
  .stats-row-value { font-size: 24px; font-weight: 700; color: var(--text-primary); line-height: 1; }
  .stats-row-value.warning { color: var(--warning); }
  .stats-row-value.brand { color: var(--brand-pink); }
  .lo-pager { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 12px; }
  .lo-pager-info { font-size: 12px; color: var(--text-tertiary); }
  .lo-pager .btn { padding: 6px 12px; font-size: 12.5px; }
  .lo-pager .btn[disabled] { opacity: 0.45; cursor: not-allowed; }
  .contact-tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: lowercase; letter-spacing: 0.02em; background: var(--surface-muted); color: var(--text-secondary); border: 1px solid var(--border); white-space: nowrap; line-height: 1.6; }
  .contact-tag-client { background: #fde7ea; color: var(--brand-pink); border-color: #f9c5cb; }
  .hidden { display: none !important; }
  .container-wide { max-width: 1500px; margin: 0 auto; }
  .task-detail-grid { display: grid; grid-template-columns: 1fr 340px; gap: 16px; align-items: start; }
  .timeline-horizontal { display: flex; align-items: flex-start; gap: 0; padding: 4px 0 2px; }
  .tl-item-h { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; text-align: center; padding: 0 6px; min-width: 0; }
  .tl-item-h:not(:last-child)::after { content: ''; position: absolute; top: 13px; left: calc(50% + 18px); right: calc(-50% + 18px); height: 2px; background: var(--border); z-index: 0; }
  .tl-item-h.done:not(:last-child)::after { background: var(--success); }
  .tl-item-h.active:not(:last-child)::after { background: linear-gradient(to right, var(--success) 0%, var(--success) 40%, var(--border) 60%); }
  .tl-item-h .tl-dot { position: relative; z-index: 1; margin-bottom: 8px; }
  .tl-item-h .tl-step { font-size: 12px; font-weight: 600; color: var(--text-primary); line-height: 1.3; }
  .tl-item-h.pending .tl-step { color: var(--text-tertiary); font-weight: 500; }
  .tl-item-h .tl-meta { font-size: 10.5px; color: var(--text-tertiary); margin-top: 2px; line-height: 1.2; }
  .history-list { display: flex; flex-direction: column; }
  .history-msg { padding: 14px 14px; border-bottom: 1px solid var(--border); border-radius: 6px; }
  .history-msg:last-child { border-bottom: none; }
  .history-msg.operator { background: #fff5f6; border-bottom: 1px solid var(--border); }
  .history-msg-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
  .history-msg-avatar { width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #64748b, #94a3b8); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; align-self: center; }
  .history-msg.operator .history-msg-avatar { background: linear-gradient(135deg, var(--brand-pink), #f97316); }
  .history-msg-author { font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .history-msg.operator .history-msg-author { color: var(--brand-pink); }
  .history-msg-timestamp { font-size: 12px; color: var(--text-tertiary); margin-left: auto; }
  .history-msg-text { font-size: 13px; color: var(--text-primary); line-height: 1.6; padding-left: 32px; }
  .history-msg-attachments { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; padding-left: 32px; }
  .tl-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; position: relative; z-index: 1; }
  .tl-dot-done { background: var(--success-soft); color: var(--success); }
  .tl-dot-active { background: var(--brand-pink); color: #fff; box-shadow: 0 0 0 4px rgba(242,84,97,0.12); }
  .tl-dot-pending { background: var(--surface-muted); color: var(--text-tertiary); border: 2px solid var(--border); }
  .tl-dot-warn { background: var(--warning); color: #fff; box-shadow: 0 0 0 4px rgba(245,158,11,0.15); }
  .tl-item-h.warn:not(:last-child)::after { background: var(--success); }
  .decision-card { background: linear-gradient(to bottom, var(--surface-subtle), #fff); border: 2px solid var(--border); border-radius: 14px; padding: 24px 28px; margin-top: 16px; }
  .decision-card .decision-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
  .decision-card .decision-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.55; }
  .decision-card .decision-btns { display: flex; gap: 12px; flex-wrap: wrap; }
  .btn-decision-yes { background: var(--success); color: #fff; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 8px; transition: background .15s; }
  .btn-decision-yes:hover { background: #15803d; }
  .btn-decision-no { background: #fff; color: var(--text-primary); padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; border: 1.5px solid var(--border-strong); display: inline-flex; align-items: center; gap: 8px; transition: all .15s; }
  .btn-decision-no:hover { border-color: var(--brand-pink); color: var(--brand-pink); }
  /* Ação terciária da validação: devolver à fila (peso menor que os dois primários) */
  /* Ação "Devolver à fila" — no header da tarefa, alinhada à direita (mesmo lugar em validação e execução). Vermelho do projeto. */
  .btn-return-queue { background: none; border: none; color: var(--danger); font-size: 12.5px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; padding: 2px; text-underline-offset: 3px; white-space: nowrap; }
  .btn-return-queue:hover { color: #b91c1c; text-decoration: underline; }
  /* Botão primário destrutivo (vermelho do projeto) — confirmar da devolução */
  .btn-danger-solid { background: var(--danger); color: #fff; }
  .btn-danger-solid:hover { background: #b91c1c; }
  .btn-danger-solid:disabled { opacity: 0.5; cursor: not-allowed; }
  /* Bloco "De → Para" — reaproveitado do gerente.html para o modal de devolução */
  .from-to-block { display: flex; align-items: stretch; gap: 10px; margin: 4px 0 4px; }
  .ft-side { flex: 1; min-width: 0; }
  .ft-side .ft-label { font-size: 10px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .ft-card { background: var(--surface-muted); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; min-height: 60px; }
  .ft-card .av { width: 34px; height: 34px; border-radius: 50%; color: #fff; font-weight: 700; font-size: 11.5px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--brand-blue); }
  .ft-card .av.inbox { background: var(--brand-pink); }
  .ft-card .info { min-width: 0; }
  .ft-card .info .name { font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.2; }
  .ft-card .info .role { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
  .ft-arrow { display: flex; align-items: center; color: var(--text-tertiary); padding-top: 22px; }
  .exec-step .step-action { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: #fff; border: 1px solid var(--border-strong); border-radius: 8px; font-size: 12.5px; font-weight: 500; color: var(--text-primary); cursor: pointer; transition: all .15s; white-space: nowrap; }
  .exec-step .step-action:hover { border-color: var(--brand-pink); color: var(--brand-pink); }
  .exec-step .step-action.done { background: var(--success-soft); border-color: transparent; color: var(--success); }
  .exec-step .step-mark-done { padding: 8px 14px; background: var(--brand-pink); color: #fff; border: none; border-radius: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; transition: background .15s; }
  .exec-step .step-mark-done:hover { background: var(--brand-pink-hover); }
  .exec-step .step-buttons { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
  .success-hero { background: linear-gradient(135deg, #dcfce7, #f0fdf4); border: 2px solid #86efac; border-radius: 18px; padding: 48px 32px; text-align: center; margin-bottom: 20px; }
  .success-hero .icon-circle { width: 72px; height: 72px; border-radius: 50%; background: var(--success); color: #fff; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
  .success-hero h1 { font-size: 24px; font-weight: 700; color: var(--success); margin-bottom: 8px; }
  .success-hero p { font-size: 14px; color: #15803d; line-height: 1.55; max-width: 480px; margin: 0 auto; }
  .summary-list { background: #fff; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
  .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid var(--border); }
  .summary-row:last-child { border-bottom: none; }
  .summary-label { font-size: 13px; color: var(--text-secondary); }
  .summary-value { font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .upload-area { border: 2px dashed var(--border-strong); border-radius: 10px; padding: 22px 18px; text-align: center; background: var(--surface-subtle); cursor: pointer; transition: all .15s; margin-top: 12px; }
  .upload-area:hover, .upload-area.dragover { border-color: var(--brand-pink); background: var(--brand-pink-soft); }
  .upload-area-icon { width: 40px; height: 40px; border-radius: 50%; background: #fff; color: var(--brand-pink); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px; }
  .upload-area-title { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
  .upload-area-hint { font-size: 12px; color: var(--text-secondary); }
  .upload-area-hint strong { color: var(--brand-pink); text-decoration: underline; }
  .uploaded-files-list { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
  .step-edit-btn { padding: 6px 12px; background: #fff; color: var(--text-secondary); border: 1px solid var(--border-strong); border-radius: 7px; font-size: 12px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all .15s; }
  .step-edit-btn:hover { border-color: var(--brand-pink); color: var(--brand-pink); }
  .alert-banner { background: linear-gradient(to right, #fff5f6, #fff); border: 1px solid #f9c5cb; border-left: 4px solid var(--brand-pink); border-radius: 10px; padding: 14px 18px; display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
  .divider { height: 1px; background: var(--border); margin: 16px 0; }
  details > summary { list-style: none; cursor: pointer; }
  details > summary::-webkit-details-marker { display: none; }
  .editable-badge { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 6px; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; border-radius: 4px; font-weight: 600; vertical-align: middle; }
  .editable-edit-btn { background: none; border: 1px solid var(--border); border-radius: 5px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-tertiary); transition: all .15s; padding: 0; flex-shrink: 0; }
  .editable-edit-btn:hover { border-color: var(--brand-pink); color: var(--brand-pink); background: var(--brand-pink-soft); }
  .ef-field { display: flex; flex-direction: column; gap: 4px; }
  .ef-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-tertiary); margin-bottom: 0; }
  .ef-input, .ef-select, .ef-textarea { font-size: 13.5px; font-weight: 400; color: var(--text-primary); border: 1px solid var(--border-strong); border-radius: 7px; padding: 7px 10px; background: #fff; outline: none; width: 100%; font-family: inherit; transition: border-color .15s, box-shadow .15s; }
  .ef-input:focus, .ef-select:focus, .ef-textarea:focus { border-color: var(--brand-pink); box-shadow: 0 0 0 3px var(--brand-pink-soft); }
  .ef-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px; }
  .ef-textarea { resize: vertical; min-height: 80px; }
  .ef-toggle-group { display: inline-flex; border: 1px solid var(--border-strong); border-radius: 7px; padding: 3px; background: var(--surface-muted); width: fit-content; }
  .ef-field:has(> .ef-toggle-group) { width: max-content; justify-self: start; align-self: end; }
  .ef-toggle-btn { padding: 5px 12px; font-size: 12.5px; font-weight: 500; border-radius: 5px; border: none; cursor: pointer; background: transparent; color: var(--text-secondary); transition: all .12s; white-space: nowrap; }
  .ef-toggle-btn.active { background: #fff; color: var(--text-primary); box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
  .edit-mode-bar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #fffbf0; border: 1px solid #fcd34d; border-radius: 10px; margin-bottom: 20px; flex-wrap: wrap; }
  .edit-mode-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 10px; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; border-radius: 5px; }
  .ef-datepicker { position: relative; display: flex; }
  .ef-datepicker-input { flex: 1; cursor: pointer; padding-left: 34px !important; }
  .ef-datepicker-btn { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-tertiary); display: flex; align-items: center; padding: 0; transition: color .12s; }
  .ef-datepicker-btn:hover { color: var(--brand-pink); }
  .ef-cal-popup { display: none; position: absolute; top: calc(100% + 6px); left: 0; z-index: 200; background: #fff; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 14px 16px 16px; min-width: 252px; }
  .ef-cal-popup.open { display: block; }
  .ef-cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .ef-cal-nav { background: none; border: 1px solid var(--border); border-radius: 6px; width: 26px; height: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 15px; line-height: 1; transition: background .1s; }
  .ef-cal-nav:hover { background: var(--surface-muted); color: var(--text-primary); }
  .ef-cal-month-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .ef-cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 4px; }
  .ef-cal-weekdays span { text-align: center; font-size: 10.5px; font-weight: 500; color: var(--text-tertiary); padding: 3px 0; }
  .ef-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
  .ef-cal-day { text-align: center; padding: 6px 0; font-size: 12.5px; border-radius: 6px; cursor: pointer; color: var(--text-primary); transition: background .1s; }
  .ef-cal-day:hover:not(.empty) { background: var(--surface-muted); }
  .ef-cal-day.selected { background: var(--brand-pink); color: #fff; font-weight: 600; }
  .ef-cal-day.today:not(.selected) { font-weight: 700; color: var(--brand-pink); }
  .ef-cal-day.other-month { color: var(--text-tertiary); }
  .ef-cal-day.empty { cursor: default; }

  /* Tabela densa de tarefas (padrão V1 — admin do gerente + lista do operador + fila invisível dos fluxos) */
  .lo-table-wrap { background: #fff; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; margin-bottom: 16px; }
  .lo-table-head, .lo-row { display: grid; grid-template-columns: 30px 12px minmax(140px, 1.8fr) minmax(104px, 1.2fr) minmax(124px, 1fr) minmax(138px, 1.1fr) 40px; align-items: center; gap: 12px; padding: 10px 14px; }
  .lo-table-head { background: var(--surface-muted); border-bottom: 1px solid var(--border); }
  .lo-table-head .h-cell { font-size: 11.5px; font-weight: 600; color: var(--text-secondary); }
  .lo-row { position: relative; background: #fff; transition: background .12s; }
  .lo-row + .lo-row { border-top: 1px solid var(--border); }
  .lo-row.clickable { cursor: pointer; }
  .lo-row.clickable:hover { background: var(--surface-subtle); }
  .lo-row.execucao      { box-shadow: inset 3px 0 0 var(--brand-pink); }
  .lo-row.stationed-row { box-shadow: inset 3px 0 0 var(--warning); }
  .lo-row.next-up       { box-shadow: inset 3px 0 0 var(--brand-pink); }
  .lo-row .type-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--brand-blue-soft); color: var(--brand-blue); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lo-row .lo-solic { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .lo-row .lo-solic .client-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); line-height: 1.3; word-break: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  /* Bolinha de "cliente respondeu, ainda não aberto" (GDocs). Vive numa COLUNA fina entre o
     ícone e o nome (2ª coluna do grid) pra saltar aos olhos e alinhar entre as linhas, em vez
     de se perder colada ao nome. Azul de marca (--brand-blue) — consistente com a UI e
     distinto do ponto rosa do sino. Só na lista do operador. (COCKPIT-958) */
  .lo-table-head .lo-dot-cell, .lo-row .lo-dot-cell { display: flex; align-items: center; justify-content: center; }
  .lo-row .update-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand-blue); }
  .lo-row .lo-solic .client-cnpj { font-size: 11px; color: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; }
  .lo-row .lo-solic .ctx-line { font-size: 11px; color: var(--text-tertiary); }
  .lo-row .lo-tipo { font-size: 12.5px; color: var(--text-primary); font-weight: 500; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .lo-row .lo-tipo .lo-proc { line-height: 1.3; word-break: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .lo-row .lo-tipo .lo-colab { color: var(--text-secondary); font-weight: 400; font-size: 11.5px; }
  /* Tag HITL na tarefa de origem Autopilot — mesmo selo/valores do acompanhamento
     (tarefa que o robô gerou pra uma pessoa resolver). Fonte única aqui.
     Fica num bloco ACIMA do nome do processo, igual ao acompanhamento (apt-proc-top). */
  .lo-row .lo-tipo .lo-proc-top { margin-bottom: 1px; }
  .tag-autopilot { display: inline-flex; align-items: center; font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; color: #6b7280; background: #f3f4f6; border-radius: 3px; padding: 1px 6px; white-space: nowrap; }
  /* Link "Abrir página do cliente" no header da tarefa (ao lado do CNPJ).
     Fonte única aqui — vale pra toda tarefa (Hub e Autopilot); os fluxos do Hub
     não carregam operador-ui.css, então o estilo precisa morar no core. */
  .client-link { display: inline-flex; align-items: center; margin-left: 10px; color: var(--brand-pink); text-decoration: none; vertical-align: middle; transition: opacity .12s; }
  .client-link:hover { opacity: 0.65; }
  .client-link svg { width: 16px; height: 16px; stroke: currentColor; stroke-width: 2.25; }
  /* ERP operado + Origem — mesmo padrão de texto do Cockpit (rótulo neutro +
     valor em destaque). */
  .dom-meta { font-size: 11.5px; color: var(--text-primary); white-space: nowrap; }
  .dom-meta .dom-k { color: var(--text-tertiary); font-weight: 400; }
  .dom-meta .dom-v { font-weight: 600; }
  .dom-meta .dom-sep { color: var(--text-tertiary); margin: 0 5px; }
  /* Na lista, esses metadados são secundários: leves (peso médio + cinza) pra não
     competir com o nome do cliente. No header da tarefa seguem em preto/bold. */
  .lo-row .dom-meta { color: var(--text-secondary); }
  .lo-row .dom-meta .dom-v { font-weight: 500; color: var(--text-secondary); }
  .lo-row .icon-btn { width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 6px; background: transparent; color: var(--text-secondary); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all .12s; }
  .lo-row .icon-btn:hover { border-color: var(--brand-blue); color: var(--brand-blue); background: #fff; }

  /* State pill outlined (compartilhado em todos os contextos) */
  .state-pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 6px; font-size: 11.5px; font-weight: 500; background: #fff; border: 1px solid; white-space: nowrap; }
  .state-pill.em-execucao       { color: var(--brand-pink); border-color: var(--brand-pink); }
  .state-pill.na-fila           { color: var(--text-secondary); border-color: #c8ccd1; }
  .state-pill.proxima           { color: var(--brand-pink); border-color: var(--brand-pink); background: var(--brand-pink-soft); }
  .state-pill.em-espera         { color: #b45309; border-color: #f59e0b; }
  .state-pill.em-processamento  { color: var(--brand-blue); border-color: var(--brand-blue); }

  /* Prazo cell */
  .prazo-cell { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .prazo-when { font-size: 13px; color: var(--text-primary); font-weight: 500; white-space: nowrap; }
  .prazo-when.overdue { color: #b91c1c; font-weight: 600; }
  .prazo-when .sep { display: inline-block; margin: 0 4px; color: var(--text-tertiary); font-weight: 400; }
  .prazo-when.overdue .sep { color: rgba(185, 28, 28, 0.55); }
  .prazo-tag { font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 5px; width: fit-content; }
  .prazo-tag.risk    { background: rgba(245, 158, 11, 0.15); color: #b45309; border: 1px solid #f59e0b; }
  .prazo-tag.overdue { background: rgba(220, 38, 38, 0.10); color: #b91c1c; border: 1px solid #ef4444; }

  /* Cabeçalho da seção (h2 fora do box + subtítulo) */
  .section-head { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; margin-top: 28px; }
  .section-head .sh-text { display: flex; flex-direction: column; min-width: 0; }
  .section-head .sh-title { font-size: 19px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
  .section-head .sh-sub { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
  /* Títulos das seções da fila do operador (Atribuídas a mim / Fila geral) um
     pouco menores — escopado por ID pra não afetar outras telas. */
  #ol-atribuidas .sh-title, #ol-list-head .sh-title { font-size: 15px; }

  /* Container "Em espera — aguardando cliente" (recolhível) */
  .espera-wrap { border: 1px solid var(--border); border-radius: 14px; overflow: hidden; margin-bottom: 16px; background: #fff; }
  .espera-head { width: 100%; display: flex; align-items: center; gap: 9px; padding: 12px 16px; background: #fff; border: none; cursor: pointer; text-align: left; font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
  .espera-head:hover { background: var(--surface-subtle); }
  .espera-head .esp-chev { margin-left: auto; color: var(--text-tertiary); transition: transform .15s; }
  .espera-head.open { border-bottom: 1px solid var(--border); }
  .espera-head.open .esp-chev { transform: rotate(180deg); }

  /* Filtros — dropdowns no estilo do cockpit (dhub: shadcn/Radix neutro) */
  .flt-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 0 0 12px; }
  .flt { position: relative; }
  .flt-trigger { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; background: #fff; border: 1px solid #ebebeb; border-radius: 10px; font-size: 14px; color: var(--text-primary); cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.05); white-space: nowrap; }
  .flt-trigger:hover { background: #fafafa; }
  .flt-trigger.has-val { border-color: var(--brand-blue); color: var(--brand-blue); font-weight: 500; }
  .flt-chev { color: #8d8d8d; }
  .flt-clear { display: inline-flex; color: #8d8d8d; }
  .flt-trigger.has-val .flt-chev, .flt-trigger.has-val .flt-clear { color: var(--brand-blue); }
  .flt-clear:hover { color: var(--brand-pink); }
  .flt-menu { position: absolute; top: calc(100% + 4px); left: 0; min-width: 230px; max-height: 300px; overflow-y: auto; background: #fff; border: 1px solid #ebebeb; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); z-index: 60; padding: 4px; }
  .flt-search { width: 100%; box-sizing: border-box; height: 34px; padding: 0 10px; border: 1px solid #ebebeb; border-radius: 6px; font-size: 13.5px; outline: none; margin-bottom: 4px; }
  .flt-search:focus { border-color: var(--brand-blue); }
  .flt-item { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 4px; font-size: 14px; color: var(--text-primary); cursor: pointer; }
  .flt-item:hover { background: #f8f8f8; }
  .flt-item .flt-check { margin-left: auto; color: var(--brand-blue); flex-shrink: 0; }
  .flt-item .flt-cnpj { font-size: 11px; color: #8d8d8d; font-family: 'JetBrains Mono', monospace; }
  .flt-limpar { background: none; border: none; color: var(--brand-blue); font-size: 13px; cursor: pointer; padding: 0 6px; height: 36px; }
  .flt-limpar:hover { text-decoration: underline; }

  /* Seletor de período (presets + calendário de range) — MÓDULO COMPARTILHADO
     (fila do operador "Solicitado em" + painel de acompanhamento). Espelha
     .flt-trigger (mesma altura/borda/fonte). */
  .pp-wrap { position: relative; display: inline-flex; }
  .pp-btn { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border: 1px solid #ebebeb; border-radius: 10px; background: #fff; font-size: 14px; color: var(--text-primary); cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.05); white-space: nowrap; }
  .pp-btn:hover { background: var(--surface-subtle); }
  .pp-btn.open, .pp-btn.has-val { border-color: var(--brand-blue); color: var(--brand-blue); }
  .pp-btn.has-val { font-weight: 500; }
  .pp-pop { position: absolute; top: calc(100% + 6px); left: 0; z-index: 70; display: flex; background: #fff; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.16); overflow: hidden; }
  .pp-presets { display: flex; flex-direction: column; padding: 8px; border-right: 1px solid var(--border); min-width: 154px; background: var(--surface-subtle); }
  .pp-preset { text-align: left; padding: 8px 12px; font-size: 13px; color: var(--text-secondary); background: none; border: none; border-radius: 8px; cursor: pointer; white-space: nowrap; }
  .pp-preset:hover { background: #fff; color: var(--text-primary); }
  .pp-preset.active { background: var(--brand-blue-soft); color: var(--brand-blue); font-weight: 600; }
  .pp-preset.pp-clear { color: var(--brand-pink); margin-top: 4px; border-top: 1px solid var(--border); border-radius: 0; }
  .pp-cal { padding: 12px; width: 262px; }
  .pp-cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .pp-cal-head span { font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .pp-cal-head button { background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 4px; border-radius: 6px; display: inline-flex; }
  .pp-cal-head button:hover { background: var(--surface-subtle); color: var(--text-primary); }
  .pp-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
  .pp-cal-dow { font-size: 10.5px; color: var(--text-tertiary); text-align: center; padding: 4px 0; font-weight: 600; }
  .pp-cal-day { font-size: 12.5px; text-align: center; padding: 7px 0; border-radius: 7px; cursor: pointer; color: var(--text-primary); }
  .pp-cal-day:hover:not(.empty) { background: var(--surface-subtle); }
  .pp-cal-day.empty { cursor: default; }
  .pp-cal-day.in-range { background: var(--brand-blue-soft); border-radius: 0; }
  .pp-cal-day.range-start, .pp-cal-day.range-end { background: var(--brand-blue); color: #fff; }
  .pp-cal-day.range-start { border-radius: 7px 0 0 7px; }
  .pp-cal-day.range-end { border-radius: 0 7px 7px 0; }
  .pp-cal-day.range-start.range-end, .pp-cal-day.picked { border-radius: 7px; background: var(--brand-blue); color: #fff; }
  .pp-cal-day.today { box-shadow: inset 0 0 0 1.5px var(--brand-pink); font-weight: 700; }
  .pp-cal-hint { font-size: 11px; color: var(--text-tertiary); margin-top: 8px; text-align: center; }
  `;
  document.head.appendChild(style);
})();

/* ============================================================
   CATÁLOGO DE MÓDULOS — cada protótipo roda em nome de um módulo do
   Cockpit (não é sempre DP). Define marca da sidebar + itens de navegação
   padrão daquele módulo. FLOW_CONFIG.module escolhe o preset; FLOW_CONFIG
   pode sobrescrever brand/navItems manualmente se precisar de algo custom.
   ============================================================ */
const COCKPIT_MODULES = {
  dp: {
    brand: 'Cockpit',
    activeLabel: 'Tarefas de DP',
    activeIcon: 'list-todo',
    activeHref: 'lista-operador.html',
    extraItems: [
      { nav: 'clientes', icon: 'users', label: 'Clientes' },
      { nav: 'tarefas', icon: 'check-circle', label: 'Tarefas' },
      { nav: 'solicitacoes', icon: 'megaphone', label: 'Solicitações' },
      { nav: 'pagamentos', icon: 'clock', label: 'Agendar pagamentos' },
      { nav: 'docs', icon: 'folder', label: 'Gerenciador de docs' },
    ],
  },
  fiscal: {
    brand: 'Cockpit',
    activeLabel: 'Tarefas Fiscais',
    activeIcon: 'landmark',
    activeHref: 'lista-operador.html',
    extraItems: [
      { nav: 'clientes', icon: 'users', label: 'Clientes' },
      { nav: 'obrigacoes', icon: 'calendar-clock', label: 'Obrigações' },
      { nav: 'guias', icon: 'receipt', label: 'Guias e impostos' },
      { nav: 'docs', icon: 'folder', label: 'Gerenciador de docs' },
    ],
  },
  contabil: {
    brand: 'Cockpit',
    activeLabel: 'Tarefas Contábeis',
    activeIcon: 'book-open-check',
    activeHref: 'lista-operador.html',
    extraItems: [
      { nav: 'clientes', icon: 'users', label: 'Clientes' },
      { nav: 'conciliacao', icon: 'scale', label: 'Conciliação' },
      { nav: 'balancetes', icon: 'bar-chart-3', label: 'Balancetes' },
      { nav: 'docs', icon: 'folder', label: 'Gerenciador de docs' },
    ],
  },
  bpo: {
    brand: 'Cockpit',
    activeLabel: 'Tarefas de BPO',
    activeIcon: 'briefcase',
    activeHref: 'lista-operador.html',
    extraItems: [
      { nav: 'clientes', icon: 'users', label: 'Clientes' },
      { nav: 'processos', icon: 'workflow', label: 'Processos' },
      { nav: 'docs', icon: 'folder', label: 'Gerenciador de docs' },
    ],
  },
  autopilot_configs: {
    brand: 'Autopilot',
    activeLabel: 'Configurações',
    activeIcon: 'settings-2',
    activeHref: 'lista-operador.html',
    extraItems: [
      { nav: 'motores', icon: 'cpu', label: 'Motores' },
      { nav: 'regras', icon: 'list-checks', label: 'Regras' },
      { nav: 'clientes', icon: 'users', label: 'Clientes' },
    ],
  },
};

function _resolveModuleMeta(cfg) {
  const preset = COCKPIT_MODULES[(cfg && cfg.module) || 'dp'] || COCKPIT_MODULES.dp;
  // FLOW_CONFIG pode sobrescrever qualquer campo do preset do módulo (brand, activeLabel, navItems etc.)
  return Object.assign({}, preset, cfg && cfg.moduleOverrides ? cfg.moduleOverrides : {});
}

function _moduleNavItemsHtml(moduleMeta) {
  const itemHtml = (it) => `
  <div class="sidebar-item" data-nav="${it.nav}">
    <div class="icon-wrap"><i data-lucide="${it.icon}" class="w-5 h-5"></i></div>
    <div class="label">${it.label}</div>
  </div>`;
  const activeHtml = `
  <a href="${moduleMeta.activeHref}" class="sidebar-item active" title="${moduleMeta.activeLabel}" style="text-decoration:none;">
    <div class="icon-wrap"><i data-lucide="${moduleMeta.activeIcon}" class="w-5 h-5"></i></div>
    <div class="label">${moduleMeta.activeLabel}</div>
  </a>`;
  const extras = moduleMeta.extraItems || [];
  // Item ativo (fila/tarefas deste módulo) fica na 3ª posição, espelhando o layout original.
  const before = extras.slice(0, 2).map(itemHtml).join('');
  const after = extras.slice(2).map(itemHtml).join('');
  return before + activeHtml + after;
}

/* ---- HTML Shell injection ---- */
function _buildShell() {
  const cfg = window.FLOW_CONFIG || {};
  const moduleMeta = _resolveModuleMeta(cfg);
  document.body.innerHTML = `
<aside class="sidebar">
  <div class="brand">${moduleMeta.brand}</div>
  ${_moduleNavItemsHtml(moduleMeta)}
  <div class="avatar" title="${cfg.operatorName || 'Daniele Ribeiro'}">${(cfg.operatorInitials || 'DR')}</div>
</aside>

<div class="main">
  <div class="topbar">
    <div class="topbar-right">
      <div class="notif-btn" id="notif-toggle">
        <i data-lucide="bell" class="w-5 h-5" style="color: var(--text-secondary)"></i>
        <span class="dot" id="notif-dot"></span>
      </div>
      <div class="notif-panel hidden" id="notif-panel">
        <div style="padding: 14px 16px; border-bottom: 1px solid var(--border); font-weight: 600;">Notificações</div>
        <div id="notif-list"></div>
        <div style="border-top: 1px solid var(--border); background: #3f3f46; padding: 10px 16px;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #fff; font-weight: 600; margin-bottom: 8px;">🛠 Controles do protótipo</div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <button onclick="simularRespostaCliente()" style="text-align: left; font-size: 12px; color: var(--text-primary); background: #fff; border: 1px solid var(--border); padding: 7px 10px; border-radius: 6px; cursor: pointer;">↩︎ Simular resposta do cliente</button>
            <button onclick="resetDemo()" style="text-align: left; font-size: 12px; color: var(--text-primary); background: #fff; border: 1px solid var(--border); padding: 7px 10px; border-radius: 6px; cursor: pointer;">⟲ Resetar demo</button>
            <!-- Caminho a partir da RAIZ, não relativo: o app é servido na raiz e este shell
                 roda também em páginas dentro de subpasta (os labs), onde "index.html" caía
                 no index da subpasta (ou em 404) em vez do menu de protótipos.
                 A raiz é a porta das versões (v0 · v1 · v3) desde 07/08 — e é pra lá que este
                 link vai, de QUALQUER tela: o mesmo shell roda dentro do v1 e do v3, então
                 mandar pro v0 jogaria quem está numa versão dentro de outra.
                 Ver decisoes/porta-de-entrada.md. -->
            <a href="/" style="text-align: left; font-size: 12px; color: var(--text-primary); background: #fff; border: 1px solid var(--border); padding: 7px 10px; border-radius: 6px; cursor: pointer; text-decoration: none; display: block;">← Voltar ao menu de protótipos</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="flex-1 p-8" id="screens-container">

    <!-- Home do operador: preenchida pelo módulo compartilhado (olMount) via renderHome -->
    <section class="screen" id="screen-home"></section>

    <section class="screen hidden" id="screen-task">
      <div class="container-wide">
        <div class="section-card" style="padding: 20px 28px;">
          <div class="flex items-center gap-3" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 20px;">
            <span class="cursor-pointer hover:text-rose-500" onclick="goHome()">← Voltar ao cockpit</span>
            <span>/</span>
            <span>Tarefa #<span id="task-id-label">—</span></span>
          </div>
          <div class="flex items-start gap-4" style="flex-wrap: wrap;">
            <div id="task-client-logo" style="display:none;">—</div>
            <div style="min-width: 0; flex: 1;">
              <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 4px;" id="task-type-label">—</h1>
              <div style="font-size: 13px;"><strong id="task-client-name" style="font-weight: 600; color: var(--text);">—</strong><span style="color: var(--text-tertiary);"> · </span><span style="color: var(--text-secondary); font-family: 'JetBrains Mono', monospace;" id="task-client-cnpj">—</span></div>
              <div id="task-meta-strip" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px;font-size:12px;color:var(--text-tertiary);"></div>
            </div>
          </div>
          <div style="border-top: 1px solid var(--border); margin: 12px 0;"></div>
          <div style="font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0;">
              <span><span id="task-solicitante-label">Solicitado por</span> <strong style="color: var(--text-primary); font-weight: 600;" id="task-solicitante">—</strong></span>
              <span id="task-solicitante-tags" style="display: inline-flex; gap: 4px;"></span>
              <span style="color: var(--text-tertiary);">·</span>
              <span id="task-timestamp" style="color: var(--text-tertiary);">—</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <span>Atribuído a <strong style="color: var(--text-primary); font-weight: 600;" id="task-assignee">—</strong></span>
              <button class="btn-return-queue" onclick="openReturnQueueModal()"><i data-lucide="corner-up-left" class="w-4 h-4"></i>Devolver à fila</button>
            </div>
          </div>
        </div>
        <div class="section-card" style="padding: 20px 28px;">
          <div class="timeline-horizontal" id="task-timeline"></div>
        </div>
        <div class="section-card hidden" id="activity-block">
          <div class="section-title"><i data-lucide="message-square"></i>Conversa com o cliente</div>
          <div class="activity-messages" id="activity-messages"></div>
          <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
            <button onclick="openAskClientModal()" style="font-size: 12.5px; color: var(--brand-pink); background: none; border: 1px solid var(--brand-pink); padding: 6px 14px; border-radius: 8px; cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;">
              <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>Responder ao cliente
            </button>
          </div>
        </div>
        <div class="section-card">
          <div class="section-title"><i data-lucide="file-text"></i>Dados da solicitação</div>
          <div id="form-collab-strip"></div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
            <div class="form-tabs" id="form-tabs"></div>
            <div id="form-edit-btn"></div>
          </div>
          <div id="form-content"></div>
        </div>
        <div class="section-card hidden" id="attachments-block">
          <div class="section-title"><i data-lucide="paperclip"></i>Anexos enviados pelo cliente<span id="attachments-count-badge" class="badge badge-neutral" style="margin-left: 8px; font-size: 10px;">0</span></div>
          <div class="flex flex-wrap gap-2" id="attachments-list"></div>
        </div>
        <div class="decision-card">
          <div class="decision-title">Validação — tem tudo que é necessário para processar?</div>
          <div class="decision-desc">Confira se os dados do formulário e os anexos do cliente estão completos e corretos para prosseguir com o processamento.</div>
          <div class="decision-btns">
            <button class="btn-decision-yes" onclick="aceitarTarefa()"><i data-lucide="check" class="w-4 h-4"></i>Sim, processar</button>
            <button class="btn-decision-no" onclick="openAskClientModal()"><i data-lucide="message-circle" class="w-4 h-4"></i>Não, pedir algo ao cliente</button>
          </div>
        </div>
      </div>
    </section>

    <section class="screen hidden" id="screen-execution">
      <div class="container-wide">
        <div class="section-card" style="padding: 20px 28px;">
          <div class="flex items-center gap-3" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 20px;">
            <span id="exec-bc-backs" style="display:contents;">
              <span class="cursor-pointer hover:text-rose-500" onclick="goHome()">← Voltar ao cockpit</span>
              <span>/</span>
              <span class="cursor-pointer hover:text-rose-500" onclick="voltarParaConferencia()">← Voltar para validação</span>
              <span>/</span>
            </span>
            <span>Processamento</span>
          </div>
          <div class="flex items-start gap-4" style="flex-wrap: wrap;">
            <div style="min-width: 0; flex: 1;">
              <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 4px;" id="exec-type-label">—</h1>
              <div style="font-size: 13px;"><strong id="exec-client-label" style="font-weight: 600; color: var(--text);">—</strong><span style="color: var(--text-tertiary);"> · </span><span style="color: var(--text-secondary); font-family: 'JetBrains Mono', monospace;" id="exec-client-cnpj">—</span></div>
              <div id="exec-meta-strip" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px;font-size:12px;color:var(--text-tertiary);"></div>
            </div>
          </div>
          <div style="border-top: 1px solid var(--border); margin: 12px 0;"></div>
          <div style="font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0;">
              <span><span id="exec-solicitante-label">Solicitado por</span> <strong style="color: var(--text-primary); font-weight: 600;" id="exec-solicitante">—</strong></span>
              <span id="exec-solicitante-tags" style="display: inline-flex; gap: 4px;"></span>
              <span style="color: var(--text-tertiary);">·</span>
              <span id="exec-timestamp" style="color: var(--text-tertiary);">—</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <span>Atribuído a <strong style="color: var(--text-primary); font-weight: 600;" id="exec-assignee">—</strong></span>
              <button class="btn-return-queue" onclick="openReturnQueueModal()"><i data-lucide="corner-up-left" class="w-4 h-4"></i>Devolver à fila</button>
            </div>
          </div>
        </div>
        <div class="section-card" style="padding: 20px 28px;">
          <div class="timeline-horizontal" id="exec-timeline"></div>
        </div>
        <div class="section-card">
          <div class="section-title"><i data-lucide="list-checks"></i>Passos de execução</div>
          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 20px;">Execute cada passo e marque como feito para avançar. Ao concluir o último, o cliente será notificado.</p>
          <div id="exec-steps"></div>
        </div>
        <div class="section-card" style="background: var(--surface-subtle);">
          <div class="flex items-start gap-3">
            <i data-lucide="info" class="w-5 h-5" style="color: var(--info); flex-shrink: 0; margin-top: 2px;"></i>
            <div style="font-size: 13px; color: var(--text-secondary);"><strong style="color: var(--text-primary);">Dica:</strong> as ações abrem em nova aba / simulam o arquivo. O botão <strong>Marcar como feito</strong> é o que avança o fluxo.</div>
          </div>
        </div>
      </div>
    </section>

    <section class="screen hidden" id="screen-success">
      <div class="container-wide" style="max-width: 720px;">
        <div class="success-hero">
          <div class="icon-circle"><i data-lucide="check" style="width: 36px; height: 36px;"></i></div>
          <h1>Solicitação concluída</h1>
        </div>
        <div class="summary-list" id="success-summary"></div>
        <div class="flex justify-center gap-3">
          <button class="btn btn-primary btn-lg" onclick="goHome()"><i data-lucide="arrow-left" class="w-4 h-4"></i>Voltar às minhas tarefas</button>
        </div>
      </div>
    </section>

  </div>
</div>

<!-- Modal: Pedir info ao cliente -->
<div class="modal-backdrop hidden" id="modal-ask-client">
  <div class="modal-panel">
    <div class="modal-header">
      <div>
        <div style="font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500;">Comunicação</div>
        <div style="font-size: 16px; font-weight: 600; margin-top: 2px;">Pedir informação ao cliente</div>
      </div>
      <button class="btn btn-ghost" onclick="closeAskClientModal()" style="padding: 6px;"><i data-lucide="x" class="w-4 h-4"></i></button>
    </div>
    <div class="modal-body">
      <div style="background: var(--surface-subtle); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; margin-bottom: 20px; font-size: 13px;" id="modal-task-context">—</div>
      <div class="field-label mb-2">Histórico da conversa</div>
      <div id="modal-history" style="max-height: 280px; overflow-y: auto; padding: 8px; background: var(--surface-subtle); border-radius: 10px; border: 1px solid var(--border); margin-bottom: 20px;"></div>
      <div class="field-label mb-2">Sua mensagem</div>
      <textarea id="modal-message-text" placeholder="Descreva o que você precisa do cliente…" style="width: 100%; min-height: 120px; padding: 12px; border: 1px solid var(--border-strong); border-radius: 10px; font-family: inherit; font-size: 13px; resize: vertical; outline: none;" onfocus="this.style.borderColor='var(--brand-pink)'" onblur="this.style.borderColor='var(--border-strong)'"></textarea>
      <input type="file" id="ask-client-file-input" style="display:none;" multiple onchange="handleAskClientFileSelect(event)" />
      <div id="ask-client-files" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;"></div>
      <div style="margin-top:12px;"><button type="button" onclick="document.getElementById('ask-client-file-input').click()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#fff;border:1px solid var(--border-strong);border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;color:var(--text-primary);"><i data-lucide="paperclip" style="width:14px;height:14px;"></i> Anexar documento (opcional)</button></div>
      <div class="mt-4 p-3" style="background: var(--warning-soft); border-radius: 8px; font-size: 12px; color: var(--warning); display: flex; gap: 8px; align-items: flex-start;">
        <i data-lucide="alert-triangle" class="w-4 h-4" style="flex-shrink: 0; margin-top: 1px;"></i>
        <div>Ao enviar, a tarefa será <strong>colocada em espera</strong> aguardando resposta do cliente.</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeAskClientModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="enviarPendenciaCliente()"><i data-lucide="send" class="w-4 h-4"></i>Enviar e colocar em espera</button>
    </div>
  </div>
</div>

<!-- Modal: Drawer -->
<div class="modal-backdrop hidden" id="modal-drawer">
  <div class="modal-panel" style="max-width: 620px;">
    <div class="modal-header">
      <div>
        <div style="font-size: 16px; font-weight: 600;" id="drawer-title">—</div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;" id="drawer-subtitle">—</div>
      </div>
      <button class="btn btn-ghost" onclick="closeDrawer()" style="padding: 6px;"><i data-lucide="x" class="w-4 h-4"></i></button>
    </div>
    <div class="modal-body" id="drawer-body"></div>
  </div>
</div>

<!-- Modal: Confirmar finalização -->
<div class="modal-backdrop hidden" id="modal-confirm-finish">
  <div class="modal-panel" style="max-width: 520px;">
    <div class="modal-header">
      <div>
        <div style="font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500;">Confirmação</div>
        <div style="font-size: 16px; font-weight: 600; margin-top: 2px;">Finalizar solicitação</div>
      </div>
      <button class="btn btn-ghost" onclick="closeConfirmFinish()" style="padding: 6px;"><i data-lucide="x" class="w-4 h-4"></i></button>
    </div>
    <div class="modal-body">
      <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 18px;">
        <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--success-soft); color: var(--success); display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i data-lucide="check-circle-2" class="w-6 h-6"></i></div>
        <div>
          <div style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">Você concluiu todas as etapas?</div>
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.55;" id="confirm-finish-detail">Ao confirmar, a tarefa será marcada como finalizada no Cockpit.</div>
        </div>
      </div>
      <div style="background: var(--info-soft); border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px; display: flex; gap: 10px; align-items: flex-start;">
        <i data-lucide="bell" class="w-4 h-4" style="color: var(--info); flex-shrink: 0; margin-top: 2px;"></i>
        <div style="font-size: 13px; color: #1e40af; line-height: 1.5;"><strong>O cliente será notificado</strong> automaticamente pelo HUB do empreendedor.</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeConfirmFinish()">Cancelar</button>
      <button class="btn btn-primary" onclick="confirmarFinalizacao()"><i data-lucide="check" class="w-4 h-4"></i>Confirmar e notificar cliente</button>
    </div>
  </div>
</div>

<!-- Modal: Devolver tarefa à fila -->
<div class="modal-backdrop hidden" id="modal-return-queue" onclick="closeReturnQueueModal(event)">
  <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="return-queue-title" onclick="event.stopPropagation()" style="max-width: 600px;">
    <div class="modal-header">
      <div>
        <div style="font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500;">Atribuição</div>
        <div id="return-queue-title" style="font-size: 16px; font-weight: 600; margin-top: 2px;">Devolver tarefa à fila?</div>
      </div>
      <button class="btn btn-ghost" onclick="closeReturnQueueModal()" style="padding: 6px;" aria-label="Fechar"><i data-lucide="x" class="w-4 h-4"></i></button>
    </div>
    <div class="modal-body">
      <div class="from-to-block">
        <div class="ft-side">
          <div class="ft-label">De</div>
          <div class="ft-card">
            <div class="av" id="return-queue-from-av">—</div>
            <div class="info">
              <div class="name" id="return-queue-from-name">—</div>
              <div class="role">Responsável atual</div>
            </div>
          </div>
        </div>
        <div class="ft-arrow"><i data-lucide="arrow-right" class="w-5 h-5"></i></div>
        <div class="ft-side">
          <div class="ft-label">Para</div>
          <div class="ft-card">
            <div class="av inbox"><i data-lucide="inbox" class="w-4 h-4"></i></div>
            <div class="info">
              <div class="name">Na fila</div>
              <div class="role">Sem responsável</div>
            </div>
          </div>
        </div>
      </div>
      <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.55; margin: 16px 0 0;">Ela perde a atribuição e fica disponível pra qualquer operador pegar.</p>
      <div style="background: var(--info-soft); border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 14px; display: flex; gap: 10px; align-items: flex-start; margin-top: 14px;">
        <i data-lucide="shield-check" class="w-4 h-4" style="color: var(--info); flex-shrink: 0; margin-top: 2px;"></i>
        <div id="return-queue-keep-text" style="font-size: 13px; color: #1e40af; line-height: 1.5;">Tudo que já foi salvo e editado, além das mensagens trocadas com o cliente, fica do jeito que está — nada é desfeito.</div>
      </div>
      <div id="return-queue-unsaved" class="hidden" style="background: var(--warning-soft); border: 1px solid #f59e0b; border-radius: 10px; padding: 12px 14px; display: flex; gap: 10px; align-items: flex-start; margin-top: 12px;">
        <i data-lucide="alert-triangle" class="w-4 h-4" style="color: var(--warning); flex-shrink: 0; margin-top: 2px;"></i>
        <div style="font-size: 13px; color: var(--warning); line-height: 1.5;"><strong>Há alterações não salvas no formulário.</strong> Elas <strong>não</strong> serão mantidas — é preciso salvar antes para preservá-las.</div>
      </div>
      <div style="margin-top: 18px; display: flex; flex-direction: column; gap: 12px;">
        <div class="ef-field">
          <div class="ef-label">Motivo da devolução</div>
          <select class="ef-select" id="return-queue-reason" onchange="onReturnReasonChange(this)">
            <option value="">— Selecione —</option>
            <option value="Peguei por engano">Peguei por engano</option>
            <option value="Fora da minha alçada">Fora da minha alçada</option>
            <option value="Redistribuição">Redistribuição</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
        <div class="ef-field">
          <div class="ef-label" id="return-queue-detail-label">Observações (opcional)</div>
          <textarea class="ef-textarea" id="return-queue-reason-detail" rows="2" style="resize: none; overflow: hidden;" oninput="autoGrowField(this); updateReturnConfirmState()" placeholder="Ex.: o que já foi feito nesta tarefa até aqui, pra quem pegar continuar"></textarea>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeReturnQueueModal()">Cancelar</button>
      <button class="btn btn-danger-solid" id="return-queue-confirm" onclick="devolverParaFila()" disabled><i data-lucide="corner-up-left" class="w-4 h-4"></i>Devolver à fila</button>
    </div>
  </div>
</div>
`;
}

