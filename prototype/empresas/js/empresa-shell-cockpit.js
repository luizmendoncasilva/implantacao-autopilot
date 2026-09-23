/*
  Shell compartilhado pelas 7 páginas de detalhe de empresa, adaptado ao
  design system do Cockpit (assets/core). Equivalente Cockpit de
  detail-common.js + boot-detail.js do protótipo original: cabeçalho +
  barra de abas, breadcrumb no topbar, toast, drawer lateral genérico e o
  dialog "Refletir alterações no Cockpit?" (via showConfirmModal do core).
  Cada página de aba continua definindo window.ACTIVE_TAB implicitamente
  (passado para ApEmpresaShell.boot) e window.renderTabContent(empresa).
*/
(function (global) {
  const TABS = [
    { key: "geral", label: "Dados gerais", href: "dados-gerais.html" },
    { key: "atividades", label: "Atividades", href: "atividades.html" },
    { key: "responsavelLegal", label: "Responsável legal", href: "responsavel-legal.html" },
    { key: "societario", label: "Quadro societário", href: "socios.html" },
    { key: "contadores", label: "Contadores", href: "contadores.html" },
    { key: "centralizadora", label: "Empresa centralizadora", href: "centralizadora.html" },
    { key: "historico", label: "Histórico de alterações", href: "historico.html" },
  ];
  const TIPO_BADGE = {
    matriz: { label: "Matriz", cls: "badge-info" },
    filial: { label: "Filial", cls: "badge-neutral" },
  };

  function situacaoBadge(dg) {
    const ativo = dg.statusCliente === "ativo";
    return '<span class="badge ' + (ativo ? "badge-success" : "badge-neutral") + '">' + (ativo ? "Ativa" : "Inativa") + "</span>";
  }

  function tabLabel(key) {
    const t = TABS.find((t) => t.key === key);
    return t ? t.label : "";
  }

  function resolveEmpresaOrRedirect() {
    const D = global.EmpresasData;
    const codigo = D.getQueryParam("empresa");
    const empresa = codigo ? D.findEmpresaByCodigo(codigo) : null;
    if (!empresa) {
      window.location.replace("index.html");
      return null;
    }
    return empresa;
  }

  function renderCrumb(empresa, activeTab) {
    document.getElementById("ap-crumb").innerHTML =
      '<div class="ap-crumb">' +
      '<span style="color:var(--text-primary);font-weight:600;">Autopilot</span> <i data-lucide="chevron-right" style="width:12px;height:12px;"></i> ' +
      '<a href="index.html">Empresas</a> <i data-lucide="chevron-right" style="width:12px;height:12px;"></i> ' +
      '<a href="dados-gerais.html?empresa=' + encodeURIComponent(empresa.codigo) + '">' + esc(empresa.nome) + '</a> <i data-lucide="chevron-right" style="width:12px;height:12px;"></i> ' +
      "<span>" + tabLabel(activeTab) + "</span></div>";
  }

  // Dados Gerais/Atividades/Responsável Legal ficam somente leitura em v1
  // (decisão de Produto confirmada por Thais Lima de Souza, 15/09/2026 — ver
  // docs/RN-RF_CadastroEmpresasAuxiliares.md, seção 4-A / RN-01 / RF-201): a
  // edição dos campos de fonte Cockpit deixa de existir no Autopilot nesta
  // versão. O botão "Editar" fica oculto nas 3 abas; os drawers de edição e
  // o dialog "Refletir no Cockpit?" continuam implementados em cada página
  // (dados-gerais.html/atividades.html/responsavel-legal.html), só sem
  // ponto de entrada na tela — não remover esse código, o fluxo de "edição
  // com reflexo" fica pendente de levantamento de impactos antes de decidir
  // se volta, muda ou é descartado.
  function renderHeaderAndTabs(empresa, activeTab) {
    const D = global.EmpresasData;
    const centralInfo = D.getCentralizacao()[empresa.codigo] || {};
    const tipoBadge = TIPO_BADGE[centralInfo.tipo];
    const abaSomenteLeituraV1 = activeTab === "geral" || activeTab === "atividades" || activeTab === "responsavelLegal";
    const dg = empresa.dadosGerais;
    const titulo = dg.razaoSocial + " — " + dg.nomeFantasia + " — " + dg.cnpj;

    const modulosHabilitados = empresa.modulosHabilitados || [];
    const modulosHtml = modulosHabilitados.length
      ? D.MODULOS_DISPONIVEIS.filter((m) => modulosHabilitados.includes(m.key)).map((m) => '<span class="badge badge-success">' + m.label + "</span>").join("")
      : '<span style="font-size:12.5px;font-style:italic;color:var(--text-tertiary);">Nenhum módulo habilitado.</span>';

    const tabsHtml = TABS.map(
      (t) =>
        '<a href="' + t.href + "?empresa=" + encodeURIComponent(empresa.codigo) + '" class="form-tab' + (t.key === activeTab ? " active" : "") + '" style="text-decoration:none;">' + t.label + "</a>"
    ).join("");

    return (
      '<div style="margin-bottom:18px;">' +
      '<a href="index.html" class="flex items-center gap-1 ap-link-info" style="font-size:12.5px;width:fit-content;margin-bottom:10px;"><i data-lucide="chevron-left" style="width:14px;height:14px;"></i> voltar para a lista</a>' +
      '<div class="flex items-center justify-between gap-3 flex-wrap" style="min-height:32px;">' +
      '<div class="flex items-center gap-2 flex-wrap"><h2 style="font-size:17px;font-weight:700;color:var(--text-primary);margin:0;">' + esc(titulo) + "</h2>" +
      (tipoBadge ? '<span class="badge ' + tipoBadge.cls + '">' + tipoBadge.label + "</span>" : "") + "</div>" +
      (abaSomenteLeituraV1 ? '<span class="flex items-center gap-1" style="font-size:11.5px;color:var(--text-tertiary);"><i data-lucide="lock" style="width:12px;height:12px;"></i> Somente leitura nesta versão — fonte: Cockpit</span>' : "") +
      "</div>" +
      '<div class="flex items-center gap-2 flex-wrap" style="margin-top:8px;"><span style="font-size:11.5px;color:var(--text-tertiary);">Módulos:</span>' + modulosHtml + "</div>" +
      '<div class="form-tabs" style="margin-top:16px;overflow-x:auto;max-width:100%;">' + tabsHtml + "</div>" +
      "</div>" +
      '<div id="tab-content"></div>'
    );
  }

  function mount(empresa, rootMountId, activeTab) {
    document.getElementById(rootMountId).innerHTML = renderHeaderAndTabs(empresa, activeTab);
    renderCrumb(empresa, activeTab);
    const btnEditar = document.getElementById("btn-editar-empresa");
    if (btnEditar) btnEditar.addEventListener("click", () => { if (typeof window.abrirEdicaoEmpresa === "function") window.abrirEdicaoEmpresa(empresa); });
    refreshIcons();
  }

  /* ---- Toast (mesmo padrão sugerido no catálogo — container próprio, sem global no core) ---- */
  function toast(title, desc, variant) {
    const el = document.getElementById("ap-toast");
    if (!el) return;
    el.className = "ap-toast show" + (variant === "info" ? " info" : "");
    el.querySelector(".ap-toast-icon").innerHTML = '<i data-lucide="' + (variant === "info" ? "info" : "check") + '" style="width:12px;height:12px;"></i>';
    el.querySelector(".ap-toast-title").textContent = title;
    el.querySelector(".ap-toast-desc").textContent = desc || "";
    refreshIcons();
    clearTimeout(global._apToastTimer);
    global._apToastTimer = setTimeout(() => el.classList.remove("show"), 5000);
  }

  /* ---- Drawer lateral genérico (padrão do catálogo design-tokens-and-components.md) ---- */
  function abrirDrawer(overlayId, panelId) {
    document.getElementById(overlayId).classList.add("open");
    document.getElementById(panelId).classList.add("open");
    refreshIcons();
  }
  function fecharDrawer(overlayId, panelId) {
    document.getElementById(overlayId).classList.remove("open");
    document.getElementById(panelId).classList.remove("open");
  }

  /* ---- "Refletir estas alterações no Cockpit?" — usa showConfirmModal do core
     (cockpit-05), com um hook manual no botão de cancelar (o core só expõe
     onConfirm nativamente) para acionar o callback de descarte. ---- */
  function confirmarReflexoCockpit(onConfirmar, onDescartar) {
    showConfirmModal({
      title: "Refletir estas alterações no Cockpit?",
      message: "As alterações realizadas nesta empresa poderão ser refletidas no Cockpit. Escolha o que fazer com elas antes de continuar.",
      confirmLabel: "Salvar e refletir no Cockpit",
      cancelLabel: "Descartar alterações",
      onConfirm: onConfirmar,
    });
    const modal = document.getElementById("modal-confirm");
    if (modal) {
      const cancelBtn = modal.querySelector("button:not(#modal-confirm-ok)");
      if (cancelBtn) cancelBtn.addEventListener("click", () => { if (onDescartar) onDescartar(); });
    }
  }

  /* ---- Bootstrap comum às 7 páginas de detalhe ---- */
  function boot(activeTab) {
    const empresa = resolveEmpresaOrRedirect();
    if (!empresa) return;
    mount(empresa, "ap-empresa-shell", activeTab);
    if (typeof window.renderTabContent === "function") window.renderTabContent(empresa);
  }

  global.ApEmpresaShell = { resolveEmpresaOrRedirect, mount, tabLabel, situacaoBadge, toast, abrirDrawer, fecharDrawer, confirmarReflexoCockpit, boot };
})(window);
