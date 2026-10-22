/*
  Page skeleton (Cockpit sidebar + topbar + content). Each HTML page calls
  Shell.mount(rootEl, { base, active, crumb | crumbs }) and defines its content
  inside <template id="page-content">.

  base   = relative prefix up to prototype/ (e.g. "../" from empresas/index.html).
  active = key of the highlighted sidebar leaf: "empresas" | "cadastros-auxiliares" |
           "feriados" | "fiscal" | "folha" | "sindicato" | "rubricas" | "contabil" | "docs".
           Any other value ("dp", "regras") highlights nothing.
  crumb  = breadcrumb text without link ("parâmetros / dp" becomes two segments).
  crumbs = navigable alternative: [{label, href?}]. The last item is the current
           page (no link); earlier items only become <a> when `href` is given,
           so there are never dead links.

  The sidebar itself lives in core/cockpit-09-cx-sidebar.js.
*/
(function (global) {
  function capitalize(text) {
    if (text.length <= 2) return text.toUpperCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function breadcrumbHtml(opts) {
    const crumbs = opts.crumbs || (opts.crumb ? opts.crumb.split(" / ").map((label) => ({ label })) : []);
    const sep = '<span class="app-breadcrumb-sep">' + Icon("chevron-right", "size-3") + "</span>";
    const parts = crumbs.map((c, i) => {
      const label = capitalize(c.label);
      const isLast = i === crumbs.length - 1;
      if (!isLast && c.href) return '<a href="' + c.href + '" class="breadcrumb-link">' + label + "</a>";
      return '<span class="' + (isLast ? "app-breadcrumb-current" : "") + '">' + label + "</span>";
    });
    return (
      '<div class="app-breadcrumb"><span class="app-breadcrumb-root">Autopilot</span>' +
      parts.map((p) => sep + p).join("") +
      "</div>"
    );
  }

  // Esquerda: onde você está. Direita: o que vale em qualquer tela — buscar e você (chassi.js).
  function topbarHtml(opts) {
    return breadcrumbHtml(opts) + (global.Chassi ? global.Chassi.topbarDireitaHtml() : "");
  }

  function mount(root, opts) {
    const base = opts.base || "";
    const active = opts.active || "";

    root.className = "app-shell";

    const sidebar = global.CxSidebar
      ? global.CxSidebar.mount({
          base,
          active,
          onToggle: (collapsed) => root.classList.toggle("is-sidebar-collapsed", collapsed),
        })
      : null;
    if (sidebar) root.appendChild(sidebar.element);

    const main = document.createElement("main");
    main.className = "app-main";
    main.innerHTML =
      '<div class="app-topbar">' +
      topbarHtml(opts) +
      "</div>" +
      '<div class="app-content"><div class="app-content-inner">' +
      '<div id="page-content-mount"></div>' +
      "</div></div>";
    root.appendChild(main);

    const template = document.getElementById("page-content");
    if (template) {
      document.getElementById("page-content-mount").appendChild(template.content.cloneNode(true));
    }

    if (global.Chassi) global.Chassi.mount({ base, shellEl: root });
    if (sidebar) sidebar.activate();

    // Prototyping FAB: optional so a page without fab-tools.js still works.
    if (global.FabTools) global.FabTools.mount();
  }

  // Refreshes the breadcrumb without remounting, for tracks that switch tabs in JS (Fiscal, Folha).
  function updateBreadcrumb(opts) {
    const el = document.querySelector(".app-breadcrumb");
    if (!el) return;
    el.outerHTML = breadcrumbHtml(opts);
  }

  global.Shell = { mount, updateBreadcrumb };
})(window);
