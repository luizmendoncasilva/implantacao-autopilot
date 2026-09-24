/* ============================================================
   cockpit-09-cx-sidebar.js — Sidebar larga do Cockpit, réplica fiel (cores,
   fonte, classes Tailwind, ícones lucide, comportamento de retrair) da
   sidebar real inspecionada em
   https://cockpit-evolucoes.prototypes.bhub.ai/autopilot-v1/autopilot
   (Clientes / Tarefas (GTO) / Tarefas (novo) / Solicitações / GDocs,
   grupo "Ferramentas" com Autopilot em destaque, Faturamento interno,
   Relatórios) — com uma seção nova ABAIXO de "Relatórios" ("Protótipos ·
   Implantação") listando todas as telas deste protótipo, agrupadas por
   trilha, com links reais.

   Uso: incluir depois de cockpit-01-shell.js em qualquer página standalone
   que já tenha <div class="sidebar">...</div> + <div class="main">...</div>.
   Substitui o conteúdo da .sidebar existente e ajusta a margem do .main —
   nenhuma outra mudança é necessária na página.
   ============================================================ */
(function () {
  const BG = '#0F1727';
  const TXT_INACTIVE = '#A6A6A6';
  const TXT_ACTIVE = '#F9F9F9';
  const CORAL = '#f25461';

  // A sidebar real usa a fonte Lato — sem carregá-la, o texto cai pra uma
  // fonte padrão mais pesada e destoa visualmente da referência.
  if (!document.getElementById('cx-font-lato')) {
    const fontLink = document.createElement('link');
    fontLink.id = 'cx-font-lato';
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap';
    document.head.appendChild(fontLink);
  }

  const style = document.createElement('style');
  style.textContent = `
  .cx-nav { font-family: Lato, 'Inter', sans-serif; background: ${BG}; width: 236px; box-shadow: inset -1px 0 0 rgba(255,255,255,0.08); position: fixed; left: 0; top: 0; bottom: 0; z-index: 40; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; transition: width .2s ease-out; }
  .cx-nav.cx-collapsed { width: 64px; }
  .cx-nav ul { margin: 0; list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .cx-nav-top { display: flex; gap: 12px; padding: 24px 16px 0; flex-direction: row; align-items: center; padding-bottom: 30px; }
  .cx-brand-label { font-size: 1.2rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; transition: opacity .2s ease-out; }
  .cx-brand-label .dot { color: ${CORAL}; }
  .cx-collapse-btn { display: flex; width: 28px; height: 28px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 8px; color: #69727D; background: none; border: none; cursor: pointer; transition: all .15s ease-out; margin-left: auto; }
  .cx-collapse-btn:hover { background: rgba(255,255,255,.07); color: ${TXT_ACTIVE}; }
  .cx-collapse-btn svg { transition: transform .2s ease-out; }
  .cx-nav.cx-collapsed .cx-collapse-btn svg { transform: rotate(180deg); }
  .cx-scroll { min-height: 0; flex: 1; overflow-y: auto; overflow-x: hidden; scrollbar-color: rgba(255,255,255,0.16) transparent; scrollbar-width: thin; }
  .cx-scroll::-webkit-scrollbar { width: 6px; }
  .cx-scroll::-webkit-scrollbar-track { background: transparent; }
  .cx-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.16); border-radius: 999px; }
  .cx-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.28); }
  .cx-ul-section { padding: 8px 18px 14px; border-bottom: 1px solid rgba(255,255,255,.08); }
  .cx-ul-section:last-child { border-bottom: none; }
  .cx-item, .cx-group-trigger { position: relative; display: flex; width: 100%; align-items: flex-start; gap: 8px; border-radius: 8px; padding: 8px 10px; min-height: 32px; color: ${TXT_INACTIVE}; background: none; border: none; cursor: default; font-family: inherit; text-align: left; text-decoration: none; transition: background .15s ease-out, color .15s ease-out; }
  a.cx-item { cursor: pointer; }
  .cx-item:hover, .cx-group-trigger:hover { background: rgba(255,255,255,.07); color: ${TXT_ACTIVE}; }
  .cx-item.active, .cx-group-trigger.active { background: rgba(255,255,255,.07); color: ${TXT_ACTIVE}; }
  .cx-item.active .cx-item-label, .cx-group-trigger.active .cx-item-label { font-weight: 700; }
  .cx-item-icon { margin-top: 2px; display: inline-flex; flex-shrink: 0; transition: transform .2s ease-out; }
  .cx-item:hover .cx-item-icon, .cx-group-trigger:hover .cx-item-icon { transform: rotate(-6deg) scale(1.1); }
  .cx-item-icon svg { width: 16px; height: 16px; }
  .cx-item-label { flex: 1; overflow: hidden; text-align: left; font-size: 14px; line-height: 20px; white-space: nowrap; transition: opacity .2s ease-out; }
  .cx-chev { margin-top: 2px; flex-shrink: 0; color: #69727D; transition: transform .2s ease-out; }
  .cx-group.open > .cx-group-trigger .cx-chev { transform: rotate(90deg); }
  .cx-group-sub-wrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .2s ease-out; }
  /* Filho direto (">"), não descendente — com 3 níveis (Parâmetros > DP >
     Folha de Pagamento) um seletor descendente abriria também o
     cx-group-sub-wrap de um grupo aninhado fechado só por estar dentro de
     um grupo aberto mais externo. */
  .cx-group.open > .cx-group-sub-wrap { grid-template-rows: 1fr; }
  .cx-group-sub { margin-left: 14px; margin-top: 6px; min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: 6px; border-left: 1px solid rgba(255,255,255,.08); padding-left: 10px; }
  .cx-group-sub .cx-item, .cx-group-sub .cx-group-trigger { min-height: 28px; }
  /* Corpo do item: label em cima, tag embaixo (em vez de lado a lado) —
     pedido explícito pra caber labels longos sem a tag forçar quebra de
     linha estranha. Fica dentro do mesmo <a>/<button> que já tem
     icon + (body) [+ chevron, se for grupo]. */
  .cx-item-body { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; flex: 1 1 auto; min-width: 0; }
  .cx-item-label { flex: none; width: 100%; }
  .cx-tag { flex-shrink: 0; font-size: 9px; font-weight: 600; line-height: 1; padding: 2px 6px; border-radius: 999px; border: 1px solid; white-space: nowrap; text-transform: none; }
  .cx-nav.cx-collapsed .cx-tag { display: none; }
  .cx-proto-section + .cx-proto-section { margin-top: 4px; }
  .cx-proto-label { padding: 10px 10px 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: ${CORAL}; white-space: nowrap; overflow: hidden; }
  .cx-footer { display: flex; align-items: center; border-top: 1px solid rgba(255,255,255,.08); padding: 8px 14px; flex-shrink: 0; }
  .cx-footer-inner { display: flex; min-height: 56px; width: 100%; align-items: center; gap: 8px; border-radius: 8px; padding: 8px 2px; color: ${TXT_INACTIVE}; }
  .cx-avatar { display: flex; width: 32px; height: 32px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 50%; background: #1C2739; font-size: 11px; font-weight: 700; color: ${TXT_ACTIVE}; }
  .cx-footer-name { flex: 1; font-size: 14px; line-height: 20px; font-weight: 700; white-space: nowrap; overflow: hidden; transition: opacity .2s ease-out; }
  .cx-nav.cx-collapsed .cx-brand-label,
  .cx-nav.cx-collapsed .cx-item-label,
  .cx-nav.cx-collapsed .cx-chev,
  .cx-nav.cx-collapsed .cx-footer-name,
  .cx-nav.cx-collapsed .cx-group-sub-wrap { display: none; }
  /* Retraído, o rail fica idêntico ao da referência (termina em Relatórios) —
     a seção "Protótipos" (só nossa, não existe no produto real) some inteira
     em vez de sobrar como um bloco de ícones soltos sem rótulo pra explicar. */
  .cx-nav.cx-collapsed .cx-proto-section { display: none; }
  /* Logo + botão de retrair empilhados e centralizados (igual à referência),
     em vez de lado a lado disputando os 64px de largura. */
  .cx-nav.cx-collapsed .cx-nav-top { flex-direction: column; gap: 14px; padding: 22px 0 26px; }
  .cx-nav.cx-collapsed .cx-collapse-btn { margin-left: 0; }
  /* Cada ícone vira um quadrado fixo e centralizado (não o botão inteiro
     esticado pros 64px da barra) — é isso que fazia o hover/active parecer
     ocupar quase a largura toda e os ícones ficarem desalinhados. */
  .cx-nav.cx-collapsed .cx-ul-section,
  .cx-nav.cx-collapsed .cx-footer { padding-left: 12px; padding-right: 12px; }
  .cx-nav.cx-collapsed ul { gap: 8px; }
  .cx-nav.cx-collapsed .cx-item,
  .cx-nav.cx-collapsed .cx-group-trigger { width: 40px; height: 40px; padding: 0; margin: 0 auto; align-items: center; justify-content: center; }
  .cx-nav.cx-collapsed .cx-item-icon { margin-top: 0; }
  .cx-nav.cx-collapsed .cx-footer-inner { justify-content: center; padding: 0; }
  `;
  document.head.appendChild(style);

  const ICONS = {
    bhub: '<svg width="20" height="20" viewBox="0 0 32 31" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27.7557 0H3.26521C2.36377 0 1.54818.366052.955809.955166.366298 1.54714 0 2.36218 0 3.26301V27.737C0 28.6378.366298 29.4529.955809 30.0448 1.54532 30.6368 2.36377 31 3.26521 31H27.7557C28.6571 31 29.4727 30.6339 30.0651 30.0448 30.6574 29.4557 31.0209 28.6378 31.0209 27.737V3.26301C31.0209 2.36218 30.6546 1.54714 30.0651.955166 29.4756.366052 28.6571 0 27.7557 0ZM9.04871 23.3787C8.7282 23.699 8.30753 23.8591 7.88686 23.8591 7.46619 23.8591 7.04552 23.699 6.72501 23.3787L4.80194 21.4569 2.87888 19.5351C2.55836 19.2149 2.39811 18.7945 2.39811 18.3712 2.39811 17.948 2.55836 17.5304 2.87888 17.2101L5.38287 14.7078 7.88686 12.2055 10.9718 15.2884 14.0567 18.3712 11.5527 20.8735 9.04871 23.3758V23.3787ZM9.30626 10.8185L11.7902 8.33625 14.2742 5.85397C14.6061 5.52223 15.0411 5.35637 15.479 5.35637 15.9168 5.35637 16.3489 5.52223 16.6837 5.85397L19.1677 8.33625 21.6517 10.8185 18.5667 13.9014 15.4818 16.9842 12.3969 13.9014 9.31199 10.8185H9.30626ZM28.0819 19.4722L26.093 21.4598 24.1041 23.4473C23.8008 23.7505 23.403 23.902 23.0052 23.902 22.6075 23.902 22.2097 23.7505 21.9064 23.4473L19.368 20.9107 16.8297 18.3741 19.9146 15.2912 22.9995 12.2084 25.5379 14.745 28.0762 17.2816C28.3795 17.5848 28.5312 17.9823 28.5312 18.3798 28.5312 18.7773 28.3795 19.1748 28.0762 19.478L28.0819 19.4722Z" fill="currentColor"></path></svg>',
  };

  function lucide(name) {
    return '<i data-lucide="' + name + '" style="width:16px;height:16px;"></i>';
  }

  function tagHtml(tagKey) {
    if (!tagKey || !TAG_STYLES[tagKey]) return '';
    const s = TAG_STYLES[tagKey];
    return (
      '<span class="cx-tag" style="color:' + s.color + ';background:' + s.bg + ';border-color:' + s.border + ';">' +
      TAG_LABELS[tagKey] + '</span>'
    );
  }

  const NAV_TOP = [
    { icon: 'users', label: 'Clientes' },
    { icon: 'circle-check-big', label: 'Tarefas (GTO)' },
    { icon: 'list-checks', label: 'Tarefas (novo)' },
    { icon: 'send', label: 'Solicitações' },
    { icon: 'folder', label: 'GDocs' },
  ];

  const FERRAMENTAS_SUB = [
    { icon: 'clock', label: 'Agendar pagamentos' },
    { icon: 'file-search', label: 'Buscador de Extratos' },
    { icon: 'arrow-right-left', label: 'Conciliador' },
    { icon: 'receipt', label: 'Integrador de notas fiscais' },
    { icon: 'bot', label: 'Autopilot' },
  ];

  const NAV_FECHAMENTO = [
    { icon: 'dollar-sign', label: 'Faturamento interno' },
    { icon: 'chart-column', label: 'Relatórios' },
  ];

  /* Telas deste protótipo, agrupadas por trilha — mesmos títulos/caminhos
     do index.html hub. Todas as páginas ficam a 1 nível de profundidade da
     raiz de prototype/, então "../" + caminho funciona a partir de qualquer
     uma delas. */
  /* Mesmas etiquetas de status usadas no menu atual do sistema (refinado /
     em breve / em refinamento / novo / em construção) — só a cor/estilo do
     selo muda pra caber no fundo escuro da sidebar nova; o texto e o
     critério (maturidade de cada tela) são os mesmos. */
  const TAG_STYLES = {
    refinado: { color: '#4ade80', bg: 'rgba(74,222,128,.12)', border: 'rgba(74,222,128,.35)' },
    em_breve: { color: '#9ca3af', bg: 'rgba(156,163,175,.12)', border: 'rgba(156,163,175,.3)' },
    em_refinamento: { color: '#60a5fa', bg: 'rgba(96,165,250,.12)', border: 'rgba(96,165,250,.35)' },
    novo: { color: '#f9a8d4', bg: 'rgba(249,168,212,.12)', border: 'rgba(249,168,212,.35)' },
    em_construcao: { color: '#fbbf24', bg: 'rgba(251,191,36,.12)', border: 'rgba(251,191,36,.35)' },
  };
  const TAG_LABELS = {
    refinado: 'refinado',
    em_breve: 'em breve',
    em_refinamento: 'em refinamento',
    novo: 'novo',
    em_construcao: 'em construção',
  };

  /* Reorganizado em seções (Plataforma/Regras/Parâmetros/Implantação/Apoio),
     mesmo agrupamento visual usado no menu atual do sistema — pedido
     explícito do usuário em cima de um print de referência. Cada seção tem
     um rótulo simples (não é grupo clicável); dentro dela, os itens podem
     ter filhos (`children`), recursivamente, pra reproduzir o 3º nível do
     print (Parâmetros > DP > Folha de Pagamento). Só o item "folha" (sem
     `children`) vira link; com `children` vira grupo expansível — mesmo
     comportamento de toggle/abrir-item-ativo de antes, agora recursivo. */
  const SECTIONS = [
    {
      label: 'Plataforma',
      items: [
        { href: 'empresas/index.html', icon: 'building-2', label: 'Empresas', tag: 'refinado' },
        { href: 'cadastros-auxiliares/socios.html', icon: 'folder', label: 'Cadastros Auxiliares', tag: 'refinado' },
      ],
    },
    {
      label: 'Regras',
      items: [
        { href: 'regras-gerais/index.html', icon: 'clipboard-list', label: 'Regras Gerais', tag: 'em_breve' },
      ],
    },
    {
      label: 'Parâmetros',
      items: [
        {
          id: 'parametros', icon: 'sliders-horizontal', label: 'Parâmetros', tag: 'em_construcao',
          children: [
            { href: 'parametros-fiscais/index.html', icon: 'file-text', label: 'Fiscal', tag: 'em_refinamento' },
            {
              id: 'parametros-dp', icon: 'users', label: 'DP',
              children: [
                { href: 'folha-pagamento/index.html', icon: 'calendar', label: 'Folha de Pagamento', tag: 'em_refinamento' },
                { href: 'sindicatos/index.html', icon: 'landmark', label: 'Sindicato / Convenção', tag: 'em_refinamento' },
                { href: 'rubricas/index.html', icon: 'file-text', label: 'Rubricas', tag: 'novo' },
              ],
            },
            { href: 'parametros/contabil.html', icon: 'calculator', label: 'Contábil', tag: 'em_breve' },
          ],
        },
      ],
    },
    {
      label: 'Implantação',
      items: [
        {
          id: 'implantacao-empresas', icon: 'rocket', label: 'Implantação de Empresas', tag: 'novo',
          children: [
            { href: 'cadastros-auxiliares/implantacao-geral.html', icon: 'users', label: 'DP', tag: 'novo' },
            { icon: 'file-text', label: 'Fiscal', tag: 'em_breve' },
            { icon: 'calculator', label: 'Contábil', tag: 'em_breve' },
          ],
        },
      ],
    },
    {
      label: 'Apoio',
      items: [
        { href: 'docs/index.html', icon: 'file-text', label: 'Documentação' },
      ],
    },
  ];

  /* Persistência entre navegações (cada clique é uma troca de página real,
     não SPA) — sem isso, toda navegação reabre a sidebar do zero: perde a
     posição do scroll e fecha os grupos que o usuário tinha aberto,
     dando a sensação de "piscar e voltar pro Autopilot". Guardamos em
     sessionStorage (sobrevive só nesta aba/sessão) o scroll e quais
     grupos estão abertos. */
  function storageGet(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function storageSet(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  window.cxToggleGroup = function (btn) {
    const groupEl = btn.closest('.cx-group');
    groupEl.classList.toggle('open');
    const openGroups = storageGet('cxSidebarOpenGroups', {});
    openGroups[groupEl.getAttribute('data-group')] = groupEl.classList.contains('open');
    storageSet('cxSidebarOpenGroups', openGroups);
  };

  function currentPath() {
    const parts = location.pathname.split('/').filter(Boolean);
    // window.CX_SIDEBAR_BASE (definido pela página antes de incluir este script)
    // diz quantos "../" são necessários pra chegar na raiz de prototype/ — 1 nível
    // pelas páginas normais (ex.: empresas/x.html), 0 pelo próprio hub (index.html
    // na raiz). Usamos isso, em vez de contar segmentos da URL, porque o servidor
    // local pode estar montado em qualquer subpasta do disco.
    const depth = typeof window.CX_SIDEBAR_DEPTH === 'number' ? window.CX_SIDEBAR_DEPTH : 1;
    return parts.slice(-(depth + 1)).join('/');
  }

  function basePrefix() {
    const depth = typeof window.CX_SIDEBAR_DEPTH === 'number' ? window.CX_SIDEBAR_DEPTH : 1;
    return '../'.repeat(depth);
  }

  function plainItemHtml(it) {
    return (
      '<li><button type="button" class="cx-item' + (it.active ? ' active' : '') + '">' +
      '<span class="cx-item-icon">' + lucide(it.icon) + '</span>' +
      '<span class="cx-item-body"><span class="cx-item-label">' + it.label + '</span></span>' +
      '</button></li>'
    );
  }

  // Um nó de SECTIONS é folha (link, com href) ou grupo (com `children`,
  // expansível) — recursivo pra suportar os 3 níveis do print de
  // referência (Parâmetros > DP > Folha de Pagamento). `path` identifica o
  // grupo de forma estável entre navegações (pra abrir/fechar persistido em
  // sessionStorage), sem depender de índice de array.
  function nodeHasActive(node, cur) {
    if (node.href === cur) return true;
    if (!node.children) return false;
    return node.children.some(function (c) { return nodeHasActive(c, cur); });
  }

  function renderNode(node, cur, savedOpen, path) {
    const nodePath = path + '/' + (node.id || node.label);
    if (node.children) {
      const hasActive = nodeHasActive(node, cur);
      const isOpen = hasActive || (savedOpen[nodePath] !== undefined ? savedOpen[nodePath] : false);
      const childrenHtml = node.children.map(function (c) { return renderNode(c, cur, savedOpen, nodePath); }).join('');
      return (
        '<li class="cx-group' + (isOpen ? ' open' : '') + '" data-group="' + nodePath + '">' +
        '<button type="button" class="cx-group-trigger' + (hasActive ? ' active' : '') + '" onclick="cxToggleGroup(this)">' +
        '<span class="cx-item-icon">' + lucide(node.icon) + '</span>' +
        '<span class="cx-item-body"><span class="cx-item-label">' + node.label + '</span>' + tagHtml(node.tag) + '</span>' +
        '<span class="cx-chev">' + lucide('chevron-right') + '</span>' +
        '</button>' +
        '<div class="cx-group-sub-wrap"><ul class="cx-group-sub">' + childrenHtml + '</ul></div>' +
        '</li>'
      );
    }
    // Item sem href (ex.: "Fiscal"/"Contábil" da Implantação de Empresas,
    // tela ainda não existe) — mesmo visual, só não é clicável.
    const tag = node.href
      ? 'a href="' + basePrefix() + node.href + '" class="cx-item' + (node.href === cur ? ' active' : '') + '"'
      : 'span class="cx-item" style="cursor:default;"';
    const closeTag = node.href ? 'a' : 'span';
    return (
      '<li><' + tag + '>' +
      '<span class="cx-item-icon">' + lucide(node.icon) + '</span>' +
      '<span class="cx-item-body"><span class="cx-item-label">' + node.label + '</span>' + tagHtml(node.tag) + '</span>' +
      '</' + closeTag + '></li>'
    );
  }

  function buildSidebarHtml() {
    const cur = currentPath();
    const savedOpen = storageGet('cxSidebarOpenGroups', {});
    const topHtml = NAV_TOP.map(plainItemHtml).join('');
    const ferramentasHtml = FERRAMENTAS_SUB.map(plainItemHtml).join('');
    const fechamentoHtml = NAV_FECHAMENTO.map(plainItemHtml).join('');

    const sectionsHtml = SECTIONS.map(function (section) {
      const itemsHtml = section.items.map(function (it) { return renderNode(it, cur, savedOpen, section.label); }).join('');
      return (
        '<div class="cx-proto-section">' +
        '<div class="cx-proto-label">' + section.label + '</div>' +
        '<ul>' + itemsHtml + '</ul>' +
        '</div>'
      );
    }).join('');

    const ferramentasOpen = savedOpen.ferramentas !== undefined ? savedOpen.ferramentas : true;

    return (
      '<div class="cx-nav-top">' +
      '<span style="color:#F9F9F9;display:flex;">' + ICONS.bhub + '</span>' +
      '<span class="cx-brand-label">Cockpit<span class="dot">.</span></span>' +
      '<button type="button" class="cx-collapse-btn" id="cx-collapse-toggle" title="Retrair/expandir menu">' + lucide('panel-left') + '</button>' +
      '</div>' +
      '<div class="cx-scroll" id="cx-scroll">' +
      '<ul class="cx-ul-section" aria-label="Trabalho">' + topHtml + '</ul>' +
      '<ul class="cx-ul-section" aria-label="Ferramentas">' +
      '<li class="cx-group' + (ferramentasOpen ? ' open' : '') + '" data-group="ferramentas">' +
      '<button type="button" class="cx-group-trigger" onclick="cxToggleGroup(this)">' +
      '<span class="cx-item-icon">' + lucide('wrench') + '</span>' +
      '<span class="cx-item-body"><span class="cx-item-label">Ferramentas</span></span>' +
      '<span class="cx-chev">' + lucide('chevron-right') + '</span>' +
      '</button>' +
      '<div class="cx-group-sub-wrap"><ul class="cx-group-sub">' + ferramentasHtml + '</ul></div>' +
      '</li>' +
      '</ul>' +
      '<ul class="cx-ul-section" aria-label="Fechamento">' + fechamentoHtml + '</ul>' +
      '<div class="cx-ul-section" style="border-bottom:none;padding-top:4px;">' + sectionsHtml + '</div>' +
      '</div>' +
      '<div class="cx-footer">' +
      '<div class="cx-footer-inner">' +
      '<span class="cx-avatar">OB</span>' +
      '<span class="cx-footer-name">Operador BHub</span>' +
      '</div>' +
      '</div>'
    );
  }

  /* Boa parte das telas deste protótipo não foi construída com o wrapper
     .sidebar/.main (são páginas "de destino", chegadas por navegação a
     partir de outra tela, sem chrome próprio). Nesses casos, criamos os
     dois wrappers do zero e movemos todo o conteúdo existente do <body>
     para dentro de .main — este script roda por último (depois de
     cockpit-07), então nada mais vai rodar antes disso acontecer. */
  function ensureSidebarShell() {
    let sidebarEl = document.querySelector('.sidebar');
    let mainEl = document.querySelector('.main');
    if (sidebarEl && mainEl) return { sidebarEl, mainEl };

    sidebarEl = document.createElement('div');
    sidebarEl.className = 'sidebar';
    mainEl = document.createElement('div');
    mainEl.className = 'main';

    const existing = Array.prototype.slice.call(document.body.childNodes);
    existing.forEach(function (node) { mainEl.appendChild(node); });

    document.body.appendChild(sidebarEl);
    document.body.appendChild(mainEl);
    return { sidebarEl, mainEl };
  }

  function mountCxSidebar() {
    const shell = ensureSidebarShell();
    const sidebarEl = shell.sidebarEl;
    const mainEl = shell.mainEl;
    sidebarEl.className = 'cx-nav';
    sidebarEl.innerHTML = buildSidebarHtml();

    const collapsed = storageGet('cxSidebarCollapsed', false);
    if (collapsed) sidebarEl.classList.add('cx-collapsed');
    if (mainEl) mainEl.style.marginLeft = collapsed ? '64px' : '236px';

    const collapseBtn = document.getElementById('cx-collapse-toggle');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', function () {
        sidebarEl.classList.toggle('cx-collapsed');
        const isCollapsed = sidebarEl.classList.contains('cx-collapsed');
        if (mainEl) mainEl.style.marginLeft = isCollapsed ? '64px' : '236px';
        storageSet('cxSidebarCollapsed', isCollapsed);
      });
    }

    // Restaura a posição do scroll da navegação anterior (senão toda troca de
    // página volta o menu pro topo, dando a sensação de "piscar e voltar pro
    // Autopilot"). Sem valor salvo, rola até o item ativo em vez de ficar no topo.
    const scrollEl = document.getElementById('cx-scroll');
    if (scrollEl) {
      const savedScroll = storageGet('cxSidebarScroll', null);
      if (savedScroll !== null) {
        scrollEl.scrollTop = savedScroll;
      } else {
        const activeEl = scrollEl.querySelector('.cx-item.active, .cx-group-trigger.active');
        if (activeEl) activeEl.scrollIntoView({ block: 'center' });
      }
      let scrollSaveTimer = null;
      scrollEl.addEventListener('scroll', function () {
        clearTimeout(scrollSaveTimer);
        scrollSaveTimer = setTimeout(function () {
          storageSet('cxSidebarScroll', scrollEl.scrollTop);
        }, 120);
      });
      // Garante que o scroll fique salvo mesmo se a navegação acontecer antes
      // do debounce acima disparar (clique logo após rolar).
      scrollEl.addEventListener('click', function () {
        storageSet('cxSidebarScroll', scrollEl.scrollTop);
      }, true);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountCxSidebar);
  } else {
    mountCxSidebar();
  }
})();
