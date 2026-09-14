/*
  FAB de ferramentas de prototipação — fixo no canto inferior direito, montado
  automaticamente em toda trilha por Shell.mount() (shared/js/shell.js), desde
  que a página inclua este script. Usa os componentes Dialog e Icon já
  existentes em shared/ — não duplica markup nem transição.

  Catálogo de ferramentas: cada entrada de TOOLS vira um item do menu. Para
  adicionar uma nova ferramenta (ex.: "Exportar estado", "Importar estado"),
  basta acrescentar um objeto {id, label, icon, run} — nenhuma outra parte
  deste arquivo, do CSS ou de outra trilha precisa mudar.
*/
(function (global) {
  const NAMESPACE_PREFIX = "autopilot_prototype_";

  function clearNamespacedStorage(storage) {
    Object.keys(storage)
      .filter((key) => key.startsWith(NAMESPACE_PREFIX))
      .forEach((key) => storage.removeItem(key));
  }

  // Remove só as chaves do protótipo (nunca localStorage.clear()) e recarrega
  // a página — cada data.js de trilha já cai de volta no seed inicial quando
  // a chave não existe, então não é preciso recriar nada manualmente aqui.
  function restorePrototypeData() {
    clearNamespacedStorage(window.localStorage);
    clearNamespacedStorage(window.sessionStorage);
    window.location.reload();
  }

  const TOOLS = [
    {
      id: "restore",
      label: "Restaurar dados do protótipo",
      icon: "rotate-ccw",
      run: openRestoreDialog,
    },
  ];

  function menuItemHtml(tool) {
    return (
      '<button type="button" class="fab-tools-item" data-tool="' +
      tool.id +
      '" role="menuitem">' +
      Icon(tool.icon, "size-4") +
      " " +
      tool.label +
      "</button>"
    );
  }

  function ensureMarkup() {
    const fab = document.createElement("div");
    fab.className = "fab-tools";
    fab.id = "fab-tools";
    fab.innerHTML =
      '<div class="fab-tools-menu" id="fab-tools-menu" role="menu" aria-hidden="true">' +
      '<div class="fab-tools-menu-label">Ferramentas de prototipação</div>' +
      TOOLS.map(menuItemHtml).join("") +
      "</div>" +
      '<button type="button" class="fab-tools-trigger" id="fab-tools-trigger" aria-haspopup="true" aria-expanded="false" aria-label="Ferramentas de prototipação">' +
      Icon("wrench", "size-5") +
      "</button>";
    document.body.appendChild(fab);

    const dialog = document.createElement("div");
    dialog.className = "dialog-overlay";
    dialog.id = "fab-restore-dialog";
    dialog.innerHTML =
      '<div class="dialog-content" role="dialog" aria-modal="true" aria-labelledby="fab-restore-title">' +
      '<button type="button" class="dialog-close" id="fab-restore-close" aria-label="Fechar">' +
      Icon("x", "size-4") +
      "</button>" +
      '<div class="flex flex-col gap-1">' +
      '<h2 class="dialog-title" id="fab-restore-title">Restaurar dados do protótipo?</h2>' +
      '<p class="dialog-description">Todas as alterações feitas durante esta navegação serão descartadas e os dados voltam ao estado inicial do protótipo. Essa ação não pode ser desfeita.</p>' +
      "</div>" +
      '<div class="dialog-footer">' +
      '<button type="button" class="btn btn-outline" id="fab-restore-cancel">Cancelar</button>' +
      '<button type="button" class="btn btn-destructive" id="fab-restore-confirm">Restaurar dados</button>' +
      "</div>" +
      "</div>";
    document.body.appendChild(dialog);
  }

  function closeMenu() {
    const trigger = document.getElementById("fab-tools-trigger");
    const menu = document.getElementById("fab-tools-menu");
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    const trigger = document.getElementById("fab-tools-trigger");
    const menu = document.getElementById("fab-tools-menu");
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
  }

  function openRestoreDialog() {
    closeMenu();
    UI.openDialog(document.getElementById("fab-restore-dialog"));
  }

  function wireEvents() {
    const trigger = document.getElementById("fab-tools-trigger");
    const menu = document.getElementById("fab-tools-menu");
    const dialog = document.getElementById("fab-restore-dialog");

    trigger.addEventListener("click", () => {
      if (menu.classList.contains("is-open")) closeMenu();
      else openMenu();
    });

    menu.querySelectorAll(".fab-tools-item").forEach((item) => {
      const tool = TOOLS.find((t) => t.id === item.getAttribute("data-tool"));
      if (tool) item.addEventListener("click", tool.run);
    });

    document.addEventListener("click", (e) => {
      if (!document.getElementById("fab-tools").contains(e.target)) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (dialog.classList.contains("is-open")) UI.closeDialog(dialog);
      else closeMenu();
    });

    document.getElementById("fab-restore-cancel").addEventListener("click", () => UI.closeDialog(dialog));
    document.getElementById("fab-restore-close").addEventListener("click", () => UI.closeDialog(dialog));
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) UI.closeDialog(dialog);
    });
    document.getElementById("fab-restore-confirm").addEventListener("click", restorePrototypeData);
  }

  function mount() {
    if (document.getElementById("fab-tools")) return;
    ensureMarkup();
    wireEvents();
  }

  global.FabTools = { mount };
})(window);
