/* Extensões de UI exclusivas das telas de Implantação. Carregado depois de icons.js e ui.js;
   não altera esses arquivos: apenas acrescenta ícones e dois helpers que o shared não tem. */
(function (global) {
  const EXTRA_ICONS = {
    list: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
    "list-checks": '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    "git-compare": '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  };
  const baseIcon = global.Icon;
  global.Icon = function (name, className) {
    if (!EXTRA_ICONS[name]) return baseIcon(name, className);
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" class="' + (className || "size-4") + '" aria-hidden="true">' +
      EXTRA_ICONS[name] + "</svg>"
    );
  };

  function initMultiSelect(root, options, currentValues, onChange) {
    const trigger = root.querySelector(".combobox-trigger");
    const list = root.querySelector(".combobox-list");
    let selected = currentValues.slice();

    function labelTrigger() {
      const labelEl = trigger.querySelector(".combobox-label");
      if (selected.length === 0 || selected.length === options.length) {
        labelEl.textContent = root.getAttribute("data-all-label") || "Todos";
      } else if (selected.length === 1) {
        const o = options.find((x) => x.value === selected[0]);
        labelEl.textContent = o ? o.label : selected[0];
      } else {
        labelEl.textContent = selected.length + " selecionados";
      }
      trigger.classList.add("has-value");
    }

    function renderList() {
      list.innerHTML = "";
      options.forEach((o) => {
        const isSel = selected.indexOf(o.value) !== -1;
        const item = document.createElement("div");
        item.className = "combobox-item" + (isSel ? " is-selected" : "");
        item.innerHTML =
          '<span class="check">' + Icon("check", "size-4") + "</span>" +
          '<span class="truncate">' + o.label + (typeof o.count === "number" ? ' <span class="combobox-item-sub" style="display:inline;">(' + o.count + ")</span>" : "") + "</span>";
        item.addEventListener("click", () => {
          selected = isSel ? selected.filter((v) => v !== o.value) : selected.concat([o.value]);
          renderList();
          labelTrigger();
          onChange(selected.slice());
        });
        list.appendChild(item);
      });
    }

    trigger.addEventListener("click", () => root.classList.toggle("is-open"));
    document.addEventListener("click", (e) => {
      if (!root.contains(e.target)) root.classList.remove("is-open");
    });

    renderList();
    labelTrigger();
  }

  function initSegbarTooltips(root) {
    let tooltipEl = null;
    function remover() {
      if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
      }
    }
    (root || document).querySelectorAll(".segbar-segment[data-tooltip], .progress-bar-wrap[data-tooltip]").forEach((seg) => {
      seg.addEventListener("mouseenter", () => {
        remover();
        tooltipEl = document.createElement("div");
        tooltipEl.className = "segbar-tooltip";
        tooltipEl.textContent = seg.getAttribute("data-tooltip");
        document.body.appendChild(tooltipEl);
        const rectSeg = seg.getBoundingClientRect();
        const rectTip = tooltipEl.getBoundingClientRect();
        let top = rectSeg.top - rectTip.height - 8;
        // Perto do topo da viewport (linha 1 da tabela) não cabe em cima —
        // desce pra baixo do segmento em vez de cortar contra o teto.
        if (top < 4) top = rectSeg.bottom + 8;
        tooltipEl.style.left = Math.max(4, rectSeg.left + rectSeg.width / 2 - rectTip.width / 2) + "px";
        tooltipEl.style.top = top + "px";
      });
      seg.addEventListener("mouseleave", remover);
    });
  }

  global.UI.initMultiSelect = initMultiSelect;
  global.UI.initSegbarTooltips = initSegbarTooltips;
})(window);
