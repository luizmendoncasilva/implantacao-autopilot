/*
  Cabeçalho + barra de abas do cadastro de empresa — portado de EmpresaDetalhe.jsx.
  Compartilhado pelas 7 páginas de detalhe (dados-gerais, atividades,
  responsavel-legal, socios, contadores, centralizadora, historico). Cada página só
  implementa o conteúdo da própria aba; navegar de aba é navegar de arquivo HTML,
  preservando ?empresa=. A aba "Módulos" foi descontinuada — os módulos
  habilitados agora aparecem direto no cabeçalho (ver renderHeaderAndTabs),
  visíveis em qualquer aba sem precisar navegar até uma tela própria.
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
    matriz: { label: "Matriz", variant: "info" },
    filial: { label: "Filial", variant: "secondary" },
  };

  // Abas em que a edição da empresa (via drawer lateral no Autopilot) fica
  // disponível no cabeçalho. "Empresa centralizadora" fica de fora: mostra só
  // a relação matriz/filial entre empresas já cadastradas, controlada pelo
  // Cockpit, sem campo próprio desta empresa para editar aqui.
  function renderHeaderAndTabs(empresa, activeTab) {
    const D = global.EmpresasData;
    const centralInfo = D.getCentralizacao()[empresa.codigo] || {};
    const tipoBadge = TIPO_BADGE[centralInfo.tipo];
    const mostrarBotaoEditar = activeTab === "geral" || activeTab === "atividades" || activeTab === "responsavelLegal";
    const dg = empresa.dadosGerais;
    const titulo = dg.razaoSocial + " — " + dg.nomeFantasia + " — " + dg.cnpj;

    const modulosHabilitados = empresa.modulosHabilitados || [];
    const modulosHtml = modulosHabilitados.length
      ? D.MODULOS_DISPONIVEIS.filter((m) => modulosHabilitados.includes(m.key))
          .map((m) => '<span class="badge badge-success">' + m.label + "</span>")
          .join("")
      : '<span class="text-sm italic text-muted">Nenhum módulo habilitado.</span>';

    const tabsHtml = TABS.map(
      (t) =>
        '<a href="' + t.href + "?empresa=" + encodeURIComponent(empresa.codigo) + '" class="tabs-trigger' +
        (t.key === activeTab ? " is-active" : "") +
        '">' + t.label + "</a>"
    ).join("");

    return `
    <div class="flex flex-col gap-3">
      <div class="flex flex-col gap-2">
        <a href="index.html" class="flex items-center gap-1 text-sm font-medium link-info w-fit">
          ${Icon("chevron-left", "size-3-5")} voltar para a lista
        </a>
        <div class="flex items-center justify-between gap-3 flex-wrap" style="min-height:32px;">
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-lg font-semibold">${titulo}</h2>
            ${tipoBadge ? '<span class="badge badge-' + tipoBadge.variant + '">' + tipoBadge.label + "</span>" : ""}
          </div>
          ${
            mostrarBotaoEditar
              ? '<button type="button" class="btn btn-outline btn-sm" id="btn-editar-empresa">' + Icon("pencil", "size-3-5") + " Editar</button>"
              : ""
          }
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-muted">Módulos:</span>
          ${modulosHtml}
        </div>
      </div>
      <div class="tabs-list" style="overflow-x:auto; max-width:100%;">${tabsHtml}</div>
    </div>
    <div id="tab-content" class="flex flex-col gap-3" style="margin-top:12px;"></div>
    `;
  }

  // Resolve a empresa da query string; se não existir, volta para a listagem.
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

  // Toast compartilhado pelas 6 abas de detalhe — evita duplicar o markup em
  // cada página HTML (antes só existia, hardcoded, em socios.html).
  function ensureToast() {
    if (document.getElementById("toast")) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.innerHTML =
      '<span class="toast-icon"></span>' +
      '<div class="flex flex-col gap-0-5">' +
      '<span class="toast-title"></span>' +
      '<span class="toast-desc"></span>' +
      "</div>";
    document.body.appendChild(toast);
  }

  function mount(empresa, rootMountId, activeTab) {
    document.getElementById(rootMountId).innerHTML = renderHeaderAndTabs(empresa, activeTab);
    ensureToast();
    // Cada aba que tem o botão "Editar" define seu próprio
    // window.abrirEdicaoEmpresa (dados-gerais.js, atividades.js,
    // responsavel-legal.js) — a edição é sempre feita aqui no Autopilot, num
    // drawer lateral próprio da aba, nunca no Cockpit.
    const btnEditar = document.getElementById("btn-editar-empresa");
    if (btnEditar) {
      btnEditar.addEventListener("click", () => {
        if (typeof window.abrirEdicaoEmpresa === "function") window.abrirEdicaoEmpresa(empresa);
      });
    }
  }

  // Dialog de confirmação compartilhado pelas abas com drawer de edição —
  // pergunta explicitamente se as alterações devem também ser refletidas no
  // Cockpit antes de salvar, em vez de um "Salvar"/"Cancelar" genérico que não
  // deixaria esse impacto claro. Injetado uma única vez por página (mesmo
  // princípio de ensureToast acima), reaproveitado pelas 3 abas editáveis.
  const REFLEXO_OVERLAY_ID = "dialog-reflexo-cockpit";
  function ensureReflexoCockpitDialog() {
    if (document.getElementById(REFLEXO_OVERLAY_ID)) return;
    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay";
    overlay.id = REFLEXO_OVERLAY_ID;
    overlay.innerHTML =
      '<div class="dialog-content" role="dialog" aria-modal="true" aria-labelledby="reflexo-cockpit-title">' +
      '<button type="button" class="dialog-close" id="reflexo-cockpit-close" aria-label="Fechar">' + Icon("x", "size-4") + "</button>" +
      '<div class="flex flex-col gap-1">' +
      '<h2 class="dialog-title" id="reflexo-cockpit-title">Refletir estas alterações no Cockpit?</h2>' +
      '<p class="dialog-description">As alterações realizadas nesta empresa poderão ser refletidas no Cockpit. Escolha o que fazer com elas antes de continuar.</p>' +
      "</div>" +
      '<div class="dialog-footer">' +
      '<button type="button" class="btn btn-outline" id="reflexo-cockpit-descartar">Descartar alterações</button>' +
      '<button type="button" class="btn" id="reflexo-cockpit-confirmar">Salvar e refletir no Cockpit</button>' +
      "</div>" +
      "</div>";
    document.body.appendChild(overlay);
  }

  // onConfirmar: aplica as alterações (Autopilot + Cockpit). onDescartar: as
  // alterações são descartadas por completo — nenhuma das duas é acionada
  // silenciosamente; fechar o dialog sem escolher (X, Esc, clique fora) conta
  // como descartar, mesmo comportamento de "Cancelar" nos demais dialogs
  // desta trilha.
  function confirmarReflexoCockpit(onConfirmar, onDescartar) {
    ensureReflexoCockpitDialog();
    const overlay = document.getElementById(REFLEXO_OVERLAY_ID);
    const btnClose = document.getElementById("reflexo-cockpit-close");
    const btnDescartar = document.getElementById("reflexo-cockpit-descartar");
    const btnConfirmar = document.getElementById("reflexo-cockpit-confirmar");

    function cleanup() {
      btnClose.removeEventListener("click", descartar);
      btnDescartar.removeEventListener("click", descartar);
      btnConfirmar.removeEventListener("click", confirmar);
      overlay.removeEventListener("click", onOverlayClick);
      document.removeEventListener("keydown", onKeydown);
    }
    function confirmar() {
      UI.closeDialog(overlay);
      cleanup();
      if (onConfirmar) onConfirmar();
    }
    function descartar() {
      UI.closeDialog(overlay);
      cleanup();
      if (onDescartar) onDescartar();
    }
    function onOverlayClick(e) {
      if (e.target === overlay) descartar();
    }
    function onKeydown(e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) descartar();
    }

    btnClose.addEventListener("click", descartar);
    btnDescartar.addEventListener("click", descartar);
    btnConfirmar.addEventListener("click", confirmar);
    overlay.addEventListener("click", onOverlayClick);
    document.addEventListener("keydown", onKeydown);
    UI.openDialog(overlay);
  }

  function tabLabel(key) {
    const tab = TABS.find((t) => t.key === key);
    return tab ? tab.label : "";
  }

  global.EmpresaDetailShell = { resolveEmpresaOrRedirect, mount, tabLabel, confirmarReflexoCockpit };
})(window);
