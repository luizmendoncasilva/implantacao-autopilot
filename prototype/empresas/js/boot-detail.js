/*
  Bootstrap comum às 7 páginas de detalhe de empresa. Cada página define
  `window.ACTIVE_TAB` e `window.renderTabContent(empresa)` antes de incluir
  este script (que deve ser o último <script> do <body>).
*/
(function () {
  const empresa = EmpresaDetailShell.resolveEmpresaOrRedirect();
  if (!empresa) return;

  Shell.mount(document.getElementById("shell-root"), {
    base: "../",
    active: "empresas",
    crumbs: [
      { label: "empresas", href: "index.html" },
      { label: empresa.nome, href: "dados-gerais.html?empresa=" + encodeURIComponent(empresa.codigo) },
      { label: EmpresaDetailShell.tabLabel(window.ACTIVE_TAB) },
    ],
  });

  EmpresaDetailShell.mount(empresa, "detail-shell-mount", window.ACTIVE_TAB);

  if (typeof window.renderTabContent === "function") {
    window.renderTabContent(empresa);
  }
})();
