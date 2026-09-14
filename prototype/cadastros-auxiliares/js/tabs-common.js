/*
  Abas do módulo "Cadastros Auxiliares" — análogo a
  empresas/js/detail-common.js, mas sem contexto de empresa (sem querystring,
  sem botão "Editar" de edição de empresa). Cada página
  (socios.html, contadores.html) só implementa o conteúdo da própria aba,
  dentro do mesmo <template id="page-content">.

  Só existe UM título + subtítulo na página: o da aba ativa (ex.: "Sócios" +
  descrição, já presente no template de cada tela — não duplicado aqui).
  "Cadastros Auxiliares" aparece só como rótulo pequeno acima das abas
  (o breadcrumb no topo da página já reforça esse contexto), para não
  competir em peso visual com o título da aba.
*/
(function (global) {
  const TABS = [
    { key: "socios", label: "Sócios", href: "socios.html" },
    { key: "contadores", label: "Registro de Contadores", href: "contadores.html" },
  ];

  function renderHeaderAndTabs(activeTab) {
    const tabsHtml = TABS.map(
      (t) =>
        '<a href="' + t.href + '" class="tabs-trigger' + (t.key === activeTab ? " is-active" : "") + '">' + t.label + "</a>"
    ).join("");

    return `
    <div class="flex flex-col gap-2" style="margin-bottom:20px;">
      <span class="text-xs font-semibold uppercase tracking-wide text-muted">Cadastros Auxiliares</span>
      <div class="tabs-list" style="overflow-x:auto; max-width:100%;">${tabsHtml}</div>
    </div>
    `;
  }

  function mount(rootMountId, activeTab) {
    document.getElementById(rootMountId).innerHTML = renderHeaderAndTabs(activeTab);
  }

  function tabLabel(key) {
    const tab = TABS.find((t) => t.key === key);
    return tab ? tab.label : "";
  }

  global.CadastrosAuxiliaresShell = { mount, tabLabel, TABS };
})(window);
