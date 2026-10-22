/* Cockpit wide sidebar (collapsible), styled as the BSystem AppSidebar (Bushido Night, active
   item in sidebar-accent with the coral indicator outside the pill). Only Autopilot ›
   Implantação navigates in this prototype. Colors come from shared/css/tokens.css.
   Exposes CxSidebar.mount({ base, active, onToggle }). The user lives in the topbar (chassi.js). */
(function () {
  const STORAGE_PREFIX = 'autopilot_prototype_cx_';

  // Flag the collapsed state before first paint so the placeholder matches it.
  try {
    if (JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + 'collapsed'))) document.documentElement.classList.add('cx-collapsed-pre');
  } catch (e) {}

  const style = document.createElement('style');
  style.textContent = `
  /* Dark placeholder where the sidebar will be, so the first frame is never a white screen. */
  html:not(.cx-mounted) body::before { content: ''; position: fixed; inset: 0 auto 0 0; width: 236px; background: var(--sidebar); z-index: 39; }
  html.cx-collapsed-pre:not(.cx-mounted) body::before { width: 64px; }
  .cx-nav { font-family: var(--font-sans); background: var(--sidebar); color: var(--sidebar-foreground); width: 236px; position: fixed; left: 0; top: 0; bottom: 0; z-index: 40; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; transition: width .2s ease-out; }
  .cx-nav.cx-collapsed { width: 64px; }
  .cx-nav ul { margin: 0; list-style: none; padding: 0; display: flex; flex-direction: column; gap: 2px; }
  .cx-nav-top { display: flex; gap: 10px; padding: 20px 16px 20px 20px; flex-direction: row; align-items: center; }
  .cx-brand-label { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: var(--sidebar-accent-foreground); white-space: nowrap; overflow: hidden; }
  .cx-brand-label .dot { color: var(--sidebar-highlight); }
  .cx-collapse-btn { position: relative; display: flex; width: 28px; height: 28px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: var(--radius-lg); color: var(--sidebar-muted); background: none; border: none; cursor: pointer; transition: background .15s ease-out, color .15s ease-out; }
  .cx-sino { margin-left: auto; }
  .cx-sino.is-open { background: var(--sidebar-accent); color: var(--sidebar-accent-foreground); }
  /* Ponto de novidade: coral (--sidebar-highlight), detalhe de marca, nunca estado. */
  .cx-sino.has-novidade::after { content: ''; position: absolute; top: 4px; right: 4px; width: 7px; height: 7px; border-radius: 50%; background: var(--sidebar-highlight); box-shadow: 0 0 0 2px var(--sidebar); }
  .cx-collapse-btn:hover { background: var(--sidebar-accent); color: var(--sidebar-accent-foreground); }
  .cx-collapse-btn:focus-visible, .cx-item:focus-visible { outline: 3px solid var(--sidebar-ring); outline-offset: 2px; }
  .cx-collapse-btn svg { transition: transform .2s ease-out; }
  .cx-nav.cx-collapsed .cx-collapse-btn svg { transform: rotate(180deg); }
  .cx-scroll { min-height: 0; flex: 1; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: color-mix(in oklab, var(--sidebar-foreground) 25%, transparent) transparent; }
  .cx-scroll::-webkit-scrollbar { width: 6px; }
  .cx-scroll::-webkit-scrollbar-thumb { background: color-mix(in oklab, var(--sidebar-foreground) 25%, transparent); border-radius: 999px; }
  .cx-nav .cx-ul-section { padding: 4px 16px 12px; }
  .cx-section-label { display: block; padding: 8px 10px 6px; font-family: var(--font-mono); font-size: 10px; line-height: 15px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sidebar-muted); white-space: nowrap; }
  .cx-item { position: relative; display: flex; width: 100%; align-items: center; gap: 10px; border-radius: var(--radius-lg); padding: 8px 10px; min-height: 36px; color: var(--sidebar-foreground); background: none; border: none; font-family: inherit; text-align: left; text-decoration: none; cursor: pointer; transition: background .15s ease-out, color .15s ease-out; }
  .cx-item:hover { background: color-mix(in oklab, var(--sidebar-accent) 70%, transparent); color: var(--sidebar-accent-foreground); }
  .cx-item.active { background: var(--sidebar-accent); color: var(--sidebar-accent-foreground); }
  .cx-item.active .cx-item-label { font-weight: 600; }
  /* Coral indicator outside the pill (BSystem --sidebar-indicator); hidden when collapsed. */
  .cx-item.active::before { content: ''; position: absolute; left: -12px; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background: var(--sidebar-indicator); }
  .cx-item-icon { display: inline-flex; flex-shrink: 0; }
  .cx-item-icon svg { width: 16px; height: 16px; }
  .cx-item-label { flex: 1; overflow: hidden; font-size: 14px; line-height: 20px; white-space: nowrap; text-overflow: ellipsis; }
  .cx-nav.cx-collapsed .cx-brand-label,
  .cx-nav.cx-collapsed .cx-item-label,
  .cx-nav.cx-collapsed .cx-section-label,
  .cx-nav.cx-collapsed .cx-item.active::before { display: none; }
  .cx-nav.cx-collapsed .cx-nav-top { flex-direction: column; gap: 14px; padding: 20px 0; }
  .cx-nav.cx-collapsed .cx-sino { margin-left: 0; }
  .cx-nav.cx-collapsed .cx-ul-section { padding-left: 12px; padding-right: 12px; }
  .cx-nav.cx-collapsed .cx-item { width: 40px; height: 40px; padding: 0; margin: 0 auto; justify-content: center; gap: 0; }
  `;
  document.head.appendChild(style);

  const BHUB_LOGO =
    '<svg width="20" height="20" viewBox="0 0 32 31" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27.7557 0H3.26521C2.36377 0 1.54818.366052.955809.955166.366298 1.54714 0 2.36218 0 3.26301V27.737C0 28.6378.366298 29.4529.955809 30.0448 1.54532 30.6368 2.36377 31 3.26521 31H27.7557C28.6571 31 29.4727 30.6339 30.0651 30.0448 30.6574 29.4557 31.0209 28.6378 31.0209 27.737V3.26301C31.0209 2.36218 30.6546 1.54714 30.0651.955166 29.4756.366052 28.6571 0 27.7557 0ZM9.04871 23.3787C8.7282 23.699 8.30753 23.8591 7.88686 23.8591 7.46619 23.8591 7.04552 23.699 6.72501 23.3787L4.80194 21.4569 2.87888 19.5351C2.55836 19.2149 2.39811 18.7945 2.39811 18.3712 2.39811 17.948 2.55836 17.5304 2.87888 17.2101L5.38287 14.7078 7.88686 12.2055 10.9718 15.2884 14.0567 18.3712 11.5527 20.8735 9.04871 23.3758V23.3787ZM9.30626 10.8185L11.7902 8.33625 14.2742 5.85397C14.6061 5.52223 15.0411 5.35637 15.479 5.35637 15.9168 5.35637 16.3489 5.52223 16.6837 5.85397L19.1677 8.33625 21.6517 10.8185 18.5667 13.9014 15.4818 16.9842 12.3969 13.9014 9.31199 10.8185H9.30626ZM28.0819 19.4722L26.093 21.4598 24.1041 23.4473C23.8008 23.7505 23.403 23.902 23.0052 23.902 22.6075 23.902 22.2097 23.7505 21.9064 23.4473L19.368 20.9107 16.8297 18.3741 19.9146 15.2912 22.9995 12.2084 25.5379 14.745 28.0762 17.2816C28.3795 17.5848 28.5312 17.9823 28.5312 18.3798 28.5312 18.7773 28.3795 19.1748 28.0762 19.478L28.0819 19.4722Z" fill="currentColor"></path></svg>';

  function icon(name) {
    return '<i data-lucide="' + name + '" style="width:16px;height:16px;"></i>';
  }

  // Leaves have `key` (matches Shell.mount's `active`) + `href` (relative to prototype/).
  const SECTIONS = [
    {
      label: 'Autopilot',
      items: [{ key: 'implantacao', href: 'cadastros-auxiliares/implantacao-geral.html', icon: 'layers', label: 'Implantação' }],
    },
  ];

  function storageGet(key, fallback) {
    try {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function storageSet(key, value) {
    try {
      sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {}
  }

  function itemHtml(it, ctx) {
    const active = it.key === ctx.active;
    return (
      '<li><a href="' + ctx.base + it.href + '" class="cx-item' + (active ? ' active' : '') + '"' +
      (active ? ' aria-current="page"' : '') + ' title="' + it.label + '">' +
      '<span class="cx-item-icon">' + icon(it.icon) + '</span>' +
      '<span class="cx-item-label">' + it.label + '</span>' +
      '</a></li>'
    );
  }

  function buildHtml(opts) {
    const ctx = { base: opts.base || '', active: opts.active || '' };

    return (
      '<div class="cx-nav-top">' +
      '<span style="color:var(--sidebar-accent-foreground);display:flex;">' + BHUB_LOGO + '</span>' +
      '<span class="cx-brand-label">Cockpit<span class="dot">.</span></span>' +
      '<button type="button" class="cx-collapse-btn cx-sino" id="cx-sino" title="Atividades" aria-label="Atividades" aria-expanded="false">' + icon('bell') + '</button>' +
      '<button type="button" class="cx-collapse-btn" id="cx-collapse-toggle" title="Retrair/expandir menu" aria-label="Retrair ou expandir menu">' + icon('panel-left') + '</button>' +
      '</div>' +
      '<div class="cx-scroll" id="cx-scroll">' +
      SECTIONS.map(function (sec) {
        return (
          '<ul class="cx-ul-section" aria-label="' + sec.label + '">' +
          '<li><span class="cx-section-label">' + sec.label + '</span></li>' +
          sec.items.map(function (it) { return itemHtml(it, ctx); }).join('') +
          '</ul>'
        );
      }).join('') +
      '</div>'
    );
  }

  function wire(nav, onToggle) {
    const collapsed = storageGet('collapsed', false);
    if (collapsed) nav.classList.add('cx-collapsed');
    if (onToggle) onToggle(collapsed);

    nav.querySelector('#cx-collapse-toggle').addEventListener('click', function () {
      nav.classList.toggle('cx-collapsed');
      const isCollapsed = nav.classList.contains('cx-collapsed');
      storageSet('collapsed', isCollapsed);
      if (onToggle) onToggle(isCollapsed);
    });
  }

  function mount(opts) {
    const nav = document.createElement('nav');
    nav.className = 'cx-nav';
    nav.innerHTML = buildHtml(opts);
    return {
      element: nav,
      // Call after the nav is in the DOM so icons render.
      activate: function () {
        document.documentElement.classList.add('cx-mounted');
        wire(nav, opts.onToggle);
        if (window.lucide) window.lucide.createIcons();
        if (window.Chassi) window.Chassi.wireSino(nav.querySelector('#cx-sino'));
      },
    };
  }

  window.CxSidebar = { mount: mount };
})();
