/*
  Esqueleto de página (sidebar + header) — portado de RegrasGeraisPage.jsx.
  Cada página HTML chama Shell.mount(rootEl, { base, active, crumb }) e define
  seu conteúdo dentro de <template id="page-content">.

  base  = prefixo relativo até a pasta prototype/ (ex.: "../" quando a página
          está em prototype/empresas/index.html).
  active = chave da seção ativa no menu: "empresas" | "cadastros-auxiliares" |
           "implantacao" | "implantacao-dp" | "implantacao-fiscal" |
           "implantacao-contabil" | "regras" | "fiscal" | "dp" | "folha" |
           "sindicato" | "contabil" | "docs". "dp" e "implantacao" são
           trilhas/menu agrupador sem página própria — só abrem/fecham o
           acordeão no clique (mesmo padrão pros dois); "implantacao"
           também é o `active` da dash geral (implantacao-geral.html), que
           continua existindo e é o alvo dos breadcrumbs "implantação de
           empresas", só não tem mais item de menu próprio (igual
           "Parâmetros" também não tem). "folha"/"sindicato" e
           "implantacao-dp"/"implantacao-fiscal"/"implantacao-contabil" são
           os componentes reais de cada trilha, cada um com sua própria
           rota.
  crumb  = texto exibido no breadcrumb do cabeçalho, sem link (ex.: "empresas").
  crumbs = alternativa navegável ao `crumb`: [{label, href?}]. O último item
           é a página atual (sem link); os demais só viram <a> quando `href`
           é informado, para nunca gerar link morto.
*/
(function (global) {
  // "dp" é a trilha/menu agrupador de Departamento Pessoal — não corresponde
  // a nenhuma página isolada na navegação (só ao Accordion pai). "folha" e
  // "sindicato" são os componentes reais da trilha, cada um com sua própria
  // rota (ver sidebarHtml). Antes desta correção, o item rotulado "DP"
  // apontava diretamente para a rota de Sindicato (sindicatos/index.html) e
  // usava a mesma chave "dp" que as páginas de Sindicato/Convenção também
  // usavam como `active` — por isso não existia uma chave própria para
  // "Sindicato/Convenção" (ver docs do relatório desta tarefa).
  const SUBMENU_OF = {
    fiscal: "parametros",
    dp: "parametros",
    contabil: "parametros",
    folha: "dp",
    sindicato: "dp",
    rubricas: "dp",
    "implantacao-dp": "implantacao",
    "implantacao-fiscal": "implantacao",
    "implantacao-contabil": "implantacao",
  };

  function sidebarHtml(base, active) {
    const parametrosOpen = SUBMENU_OF[active] === "parametros" || SUBMENU_OF[SUBMENU_OF[active]] === "parametros" || true; // aberto por padrão, igual ao estado inicial em React
    // O submenu de DP, diferente do de "Parâmetros", não fica sempre aberto:
    // só expande quando a página ativa é a própria DP (se um dia tiver rota
    // própria) ou um de seus filhos (Folha de Pagamento, Sindicato/Convenção).
    const dpOpen = active === "dp" || SUBMENU_OF[active] === "dp";
    // Mesmo padrão do DP acima — "Implantação de Empresas" é agrupador
    // (acordeão, abre/fecha no clique, igual "Parâmetros"), não link direto.
    const implantacaoOpen = active === "implantacao" || SUBMENU_OF[active] === "implantacao";

    function badgeHtml(disabled, badge) {
      if (badge) {
        const variantClass = badge.variant ? " sidebar-badge-" + badge.variant : "";
        return '<span class="sidebar-badge' + variantClass + '">' + badge.label + "</span>";
      }
      return disabled ? '<span class="sidebar-badge">em breve</span>' : "";
    }

    function btn(key, href, label, iconName, disabled, badge) {
      const isActive = active === key;
      return (
        '<li class="sidebar-menu-item"><a href="' +
        (disabled ? "#" : href) +
        '" class="sidebar-btn' +
        (isActive ? " is-active" : "") +
        '"' +
        (disabled ? ' aria-disabled="true" tabindex="-1"' : "") +
        ">" +
        Icon(iconName, "size-4") +
        " " +
        label +
        badgeHtml(disabled, badge) +
        "</a></li>"
      );
    }

    // O label vai num <span class="truncate sidebar-sub-btn-label"> — sem
    // isso, um label mais longo (ex.: "Folha de Pagamento") force-quebra em
    // duas linhas quando o item vive num terceiro nível de indentação (menos
    // largura disponível que o previsto quando .sidebar-sub-btn foi criado,
    // só para o 2º nível), encolhendo o ícone e sobrepondo o item seguinte.
    function subBtn(key, href, label, iconName, disabled, badge) {
      const isActive = active === key;
      return (
        '<li class="relative"><a href="' +
        (disabled ? "#" : href) +
        '" class="sidebar-sub-btn' +
        (isActive ? " is-active" : "") +
        '"' +
        (disabled ? ' aria-disabled="true" tabindex="-1"' : "") +
        ">" +
        Icon(iconName, "size-4") +
        '<span class="sidebar-sub-btn-label">' + label + "</span>" +
        badgeHtml(disabled, badge) +
        "</a></li>"
      );
    }

    return `
    <div class="sidebar-brand">
      <div class="sidebar-brand-mark">AP</div>
      <div>
        <div class="sidebar-brand-title">AutoPilot</div>
        <div class="sidebar-brand-sub">Regras por empresa</div>
      </div>
    </div>

    <div>
      <div class="sidebar-group-label">Plataforma</div>
      <ul class="sidebar-menu">
        ${btn("empresas", base + "empresas/index.html", "Empresas", "building-2", false, { label: "refinado", variant: "success" })}
        ${btn("cadastros-auxiliares", base + "cadastros-auxiliares/socios.html", "Cadastros Auxiliares", "folder", false, { label: "refinado", variant: "success" })}
      </ul>
    </div>

    <div class="sidebar-separator"></div>

    <div>
      <div class="sidebar-group-label">Regras</div>
      <ul class="sidebar-menu">
        ${btn("regras", base + "regras-gerais/index.html", "Regras Gerais", "book-open-check", false, { label: "em breve" })}
      </ul>
    </div>

    <div class="sidebar-separator"></div>

    <div>
      <div class="sidebar-group-label">Parâmetros</div>
      <ul class="sidebar-menu">
        <li class="sidebar-menu-item">
          <button type="button" class="sidebar-btn" data-toggle-submenu="parametros" aria-expanded="${parametrosOpen}">
            ${Icon("sliders-horizontal", "size-4")} Parâmetros
            <span class="sidebar-btn-trailing">
              <span class="sidebar-badge sidebar-badge-construction">em construção</span>
              <span class="chev">${Icon("chevron-right", "size-4")}</span>
            </span>
          </button>
          <ul class="sidebar-submenu" data-submenu="parametros" style="${parametrosOpen ? "" : "display:none;"}">
            ${subBtn("fiscal", base + "parametros-fiscais/index.html", "Fiscal", "receipt", false, { label: "em refinamento", variant: "info" })}
            <li class="sidebar-menu-item">
              <button type="button" class="sidebar-btn" data-toggle-submenu="dp" aria-expanded="${dpOpen}">
                ${Icon("users", "size-4")} DP
                <span class="sidebar-btn-trailing">
                  <span class="chev">${Icon("chevron-right", "size-4")}</span>
                </span>
              </button>
              <ul class="sidebar-submenu" data-submenu="dp" style="${dpOpen ? "" : "display:none;"}">
                ${subBtn("folha", base + "folha-pagamento/index.html", "Folha de Pagamento", "calendar", false, { label: "em refinamento", variant: "info" })}
                ${subBtn("sindicato", base + "sindicatos/index.html", "Sindicato / Convenção", "landmark", false, { label: "em refinamento", variant: "info" })}
                ${subBtn("rubricas", base + "rubricas/index.html", "Rubricas", "receipt", false, { label: "novo", variant: "info" })}
              </ul>
            </li>
            ${subBtn("contabil", base + "parametros/contabil.html", "Contábil", "landmark", false, { label: "em breve" })}
          </ul>
        </li>
      </ul>
    </div>

    <div class="sidebar-separator"></div>

    <!-- Grupo próprio, fora de "Plataforma"/"Cadastros Auxiliares": a
         Implantação de Empresas consome os mesmos cadastros, mas é um fluxo
         operacional à parte (fila de conciliação, não um cadastro mestre) —
         por isso vive na sua própria seção, mais abaixo no menu.

         Mesmo padrão de acordeão do submenu de Parâmetros (pedido de
         revisão, 14/09/2026: "clico em implantação de empresas e ele deve
         abrir os três abaixo ou fechar, assim como é em parâmetros") — o
         item pai é só agrupador (abre/fecha no clique), não link direto; o
         dash geral com as 3 frentes ainda existe (implantacao-geral.html),
         só não tem mais um item de menu próprio, igual "Parâmetros" também
         não tem página própria. Hoje só DP tem tela construída
         (alinhamento Andressa/Jeniffer, 10/09/2026); Fiscal e Contábil
         ficam "em breve" até terem o mesmo tratamento. -->
    <div>
      <div class="sidebar-group-label">Implantação</div>
      <ul class="sidebar-menu">
        <li class="sidebar-menu-item">
          <button type="button" class="sidebar-btn" data-toggle-submenu="implantacao" aria-expanded="${implantacaoOpen}">
            ${Icon("list-checks", "size-4")} Implantação de Empresas
            <span class="sidebar-btn-trailing">
              <span class="sidebar-badge sidebar-badge-info">novo</span>
              <span class="chev">${Icon("chevron-right", "size-4")}</span>
            </span>
          </button>
          <ul class="sidebar-submenu" data-submenu="implantacao" style="${implantacaoOpen ? "" : "display:none;"}">
            ${subBtn("implantacao-dp", base + "cadastros-auxiliares/implantacao-empresas.html", "DP", "users", false, { label: "novo", variant: "info" })}
            ${subBtn("implantacao-fiscal", base + "cadastros-auxiliares/implantacao-empresas.html", "Fiscal", "receipt", true, { label: "em breve" })}
            ${subBtn("implantacao-contabil", base + "cadastros-auxiliares/implantacao-empresas.html", "Contábil", "landmark", true, { label: "em breve" })}
          </ul>
        </li>
      </ul>
    </div>

    <div class="sidebar-separator"></div>

    <!-- Grupo próprio ("Apoio") em vez de dentro de "Plataforma": Documentação
         não é uma trilha de negócio (Empresas, Regras, Parâmetros) nem um
         cadastro mestre — é material de leitura sobre o protótipo em si, então
         fica separada ao final do menu, sem competir por espaço com as trilhas. -->
    <div>
      <div class="sidebar-group-label">Apoio</div>
      <ul class="sidebar-menu">
        ${btn("docs", base + "docs/index.html", "Documentação", "file-text", false)}
      </ul>
    </div>

    <div class="sidebar-footer">
      <div class="sidebar-separator"></div>
      <ul class="sidebar-menu">
        <li class="sidebar-menu-item">
          <button type="button" class="sidebar-user">
            <div class="sidebar-user-avatar">EC</div>
            <div class="flex flex-col min-w-0">
              <span class="sidebar-user-name truncate">Elaine Calazans</span>
              <span class="sidebar-user-email truncate">elaine.moreira@bhub.ai</span>
            </div>
          </button>
        </li>
      </ul>
    </div>
    `;
  }

  // crumbs = [{label, href}] — o último item é sempre a página atual (sem
  // link); itens anteriores só viram <a> quando `href` aponta para uma
  // página que de fato existe (evita link morto). `crumb` (string) segue
  // suportado para as trilhas que ainda não migraram para `crumbs`.
  function breadcrumbHtml(opts) {
    const crumbs = opts.crumbs || (opts.crumb ? [{ label: opts.crumb }] : []);
    const parts = crumbs.map((c, i) => {
      const isLast = i === crumbs.length - 1;
      if (!isLast && c.href) {
        return '<a href="' + c.href + '" class="breadcrumb-link">' + c.label + "</a>";
      }
      return isLast ? "<b>" + c.label + "</b>" : "<span>" + c.label + "</span>";
    });
    return '<div class="app-breadcrumb">autopilot.bhub.ai / ' + parts.join(" / ") + "</div>";
  }

  function headerHtml(opts) {
    return `
    ${breadcrumbHtml(opts)}
    <div class="app-header-actions">
      <span class="label">Visualizar como</span>
      <div class="toggle-group" data-toggle-group="role">
        <button type="button" class="toggle-item is-on" data-value="admin">Administrador</button>
        <button type="button" class="toggle-item" data-value="operador">Operador</button>
      </div>
    </div>
    `;
  }

  function mount(root, opts) {
    const base = opts.base || "";
    const active = opts.active || "";

    const aside = document.createElement("aside");
    aside.className = "app-sidebar";
    aside.innerHTML = sidebarHtml(base, active);

    const main = document.createElement("main");
    main.className = "app-main";
    main.innerHTML =
      '<div class="app-header">' +
      headerHtml(opts) +
      "</div>" +
      '<div class="app-content"><div class="app-content-inner">' +
      '<div class="alert alert-info gap-2" style="margin-bottom:20px;">' +
      Icon("info", "size-4") +
      '<div class="alert-desc"><b>Protótipo.</b> Os dados apresentados são fictícios e servem apenas para validação da experiência.</div>' +
      "</div>" +
      '<div id="page-content-mount"></div>' +
      "</div></div>";

    root.className = "app-shell";
    root.appendChild(aside);
    root.appendChild(main);

    const template = document.getElementById("page-content");
    if (template) {
      document.getElementById("page-content-mount").appendChild(template.content.cloneNode(true));
    }

    root.querySelectorAll("[data-toggle-submenu]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-toggle-submenu");
        const submenu = root.querySelector('[data-submenu="' + key + '"]');
        const expanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!expanded));
        submenu.style.display = expanded ? "none" : "";
      });
    });

    root.querySelectorAll('[data-toggle-group="role"] .toggle-item').forEach((item) => {
      item.addEventListener("click", () => {
        root.querySelectorAll('[data-toggle-group="role"] .toggle-item').forEach((i) => i.classList.remove("is-on"));
        item.classList.add("is-on");
      });
    });

    // FAB de ferramentas de prototipação — disponível em toda trilha que
    // inclua shared/js/fab-tools.js; opcional para não quebrar uma página que
    // ainda não tenha o script.
    if (global.FabTools) global.FabTools.mount();
  }

  // Atualiza o breadcrumb depois do mount inicial, sem remontar sidebar/header
  // — usado por trilhas com navegação interna via JS (troca de aba sem reload
  // de página, ex.: Parâmetros Fiscais) onde o "bloco atual" no breadcrumb
  // muda a cada clique em aba. Aceita o mesmo formato de `crumbs`/`crumb` de
  // Shell.mount.
  function updateBreadcrumb(opts) {
    const el = document.querySelector(".app-breadcrumb");
    if (!el) return;
    el.outerHTML = breadcrumbHtml(opts);
  }

  global.Shell = { mount, updateBreadcrumb };
})(window);
