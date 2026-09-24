/*
  Comportamentos genéricos de componentes interativos (Sheet, Dialog, Toast,
  ToggleGroup, Combobox) — portados de src/components/ui/index.jsx. Qualquer
  trilha de protótipo reaproveita estas funções, em vez de reimplementar
  abrir/fechar drawer, popover, etc.
*/
(function (global) {
  function openSheet(overlayEl, panelEl) {
    overlayEl.classList.add("is-open");
    panelEl.classList.add("is-open");
  }
  function closeSheet(overlayEl, panelEl) {
    overlayEl.classList.remove("is-open");
    panelEl.classList.remove("is-open");
  }

  function openDialog(overlayEl) {
    overlayEl.classList.add("is-open");
  }
  function closeDialog(overlayEl) {
    overlayEl.classList.remove("is-open");
  }

  let toastTimer = null;
  // iconName: "circle-check" (padrão, confirmação de sucesso) | "info" (aviso neutro).
  function showToast(title, description, iconName) {
    const el = document.getElementById("toast");
    if (!el) return;
    const icon = iconName || "circle-check";
    const iconEl = el.querySelector(".toast-icon");
    iconEl.innerHTML = Icon(icon, "size-4");
    iconEl.style.color = icon === "info" ? "var(--info-text)" : "";
    el.querySelector(".toast-title").textContent = title;
    const descEl = el.querySelector(".toast-desc");
    if (description) {
      descEl.textContent = description;
      descEl.style.display = "";
    } else {
      descEl.style.display = "none";
    }
    el.classList.add("is-open");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-open"), 3500);
  }

  // Rótulo truncado (reticências + tooltip) como conteúdo único de uma célula
  // de tabela — substitui a marcação repetida à mão em cada trilha/tela.
  // maxWidthPx é opcional: numa tabela com table-layout:fixed o <colgroup> já
  // limita a largura, então basta omitir. extraClass é opcional (ex.:
  // "text-sm font-medium"). Para truncar um item dentro de uma linha flex com
  // outros elementos (ex.: nome + badge lado a lado), use a classe .truncate
  // direto num item flex com min-w-0 em vez desta função.
  function truncatedCell(text, maxWidthPx, extraClass) {
    const cls = "truncate block" + (extraClass ? " " + extraClass : "");
    const style = maxWidthPx ? ' style="max-width:' + maxWidthPx + 'px;"' : "";
    return '<span class="' + cls + '"' + style + ' title="' + text + '">' + text + "</span>";
  }

  function initToggleGroup(root, onChange) {
    root.querySelectorAll(".toggle-item").forEach((item) => {
      item.addEventListener("click", () => {
        root.querySelectorAll(".toggle-item").forEach((i) => i.classList.remove("is-on"));
        item.classList.add("is-on");
        onChange(item.getAttribute("data-value"));
      });
    });
  }

  // Combobox simples: root precisa dos filhos .combobox-trigger, .combobox-panel,
  // .combobox-search input, .combobox-list — mesma estrutura usada no Sheet de
  // Sócios. `options` = [{value, label, sublabel}]; onSelect(value).
  function initCombobox(root, options, currentValue, onSelect) {
    const trigger = root.querySelector(".combobox-trigger");
    const panel = root.querySelector(".combobox-panel");
    const searchInput = root.querySelector(".combobox-search input");
    const list = root.querySelector(".combobox-list");

    function renderList(filterText) {
      const termo = (filterText || "").toLowerCase();
      const filtrados = options.filter((o) => (o.label + " " + (o.sublabel || "")).toLowerCase().includes(termo));
      list.innerHTML = "";
      if (filtrados.length === 0) {
        list.innerHTML = '<div class="combobox-empty">' + (root.getAttribute("data-empty-text") || "Nenhum resultado encontrado.") + "</div>";
        return;
      }
      filtrados.forEach((o) => {
        const isSel = String(o.value) === String(currentValue);
        const item = document.createElement("div");
        item.className = "combobox-item" + (isSel ? " is-selected" : "");
        item.innerHTML =
          '<span class="check">' + Icon("check", "size-4") + "</span>" +
          '<div class="flex flex-col min-w-0"><span class="truncate">' + o.label + "</span>" +
          (o.sublabel ? '<span class="combobox-item-sub truncate">' + o.sublabel + "</span>" : "") +
          "</div>";
        item.addEventListener("click", () => {
          currentValue = o.value;
          onSelect(o.value, o.label);
          trigger.querySelector(".combobox-label").textContent = o.label;
          trigger.classList.add("has-value");
          root.classList.remove("is-open");
          searchInput.value = "";
          renderList("");
        });
        list.appendChild(item);
      });
    }

    trigger.addEventListener("click", () => {
      root.classList.toggle("is-open");
      if (root.classList.contains("is-open")) {
        searchInput.value = "";
        renderList("");
        searchInput.focus();
      }
    });
    searchInput.addEventListener("input", (e) => renderList(e.target.value));
    document.addEventListener("click", (e) => {
      if (!root.contains(e.target)) root.classList.remove("is-open");
    });

    renderList("");
    const selecionado = options.find((o) => String(o.value) === String(currentValue));
    if (selecionado) {
      trigger.querySelector(".combobox-label").textContent = selecionado.label;
      trigger.classList.add("has-value");
    }
  }

  // Multi-select popover — mesma estrutura do Combobox acima (trigger +
  // panel + list), mas cada item é marcável independente sem fechar o
  // painel, e o rótulo do trigger resume quantos estão marcados. Pedido do
  // Luiz na revisão de 10/09/2026 ("talvez até colocar uma multi select
  // aqui seria bom") para o filtro de status da lista de Implantação de
  // Empresas. `options` = [{value, label, count}]; `currentValues` = array
  // de value já selecionados; onChange(novoArrayDeValues) — array vazio (ou
  // com todas as opções) equivale a "todos", sem filtro aplicado.
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

  const MESES_PT = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const MESES_ABREV_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  function dataBrParaDate(dataBr) {
    const partes = (dataBr || "").split("/");
    if (partes.length !== 3) return null;
    const data = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
    return Number.isNaN(data.getTime()) ? null : data;
  }
  function dataParaBr(data) {
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    return dia + "/" + mes + "/" + data.getFullYear();
  }

  // Date Picker: root precisa dos filhos .date-picker-trigger (com
  // .date-picker-label dentro), .date-picker-panel > .date-picker-header
  // (botões [data-nav="prev"/"next"] + .date-picker-caption) + .date-picker-grid
  // — mesma estrutura usada no Sheet de Sócios. onChange(dataBr|null) é chamado
  // só em interação do usuário; use o `.setValue()` retornado para refletir um
  // valor vindo de fora (ex.: reabrir o drawer em modo edição) sem disparar onChange.
  //
  // opts.granularity: "day" (padrão, comportamento original — grade de 42
  // dias, valor "DD/MM/AAAA") | "month" (grade de 12 meses do ano em
  // "visão", value "AAAA-MM" — mesmo formato do <input type="month"> nativo,
  // para competências como "Competência atual (MM/AAAA)" da Folha de
  // Pagamento). Nenhum caso existente no projeto precisava de granularidade
  // mensal antes da Folha; a estrutura visual (trigger/painel/header/grid) é
  // exatamente a mesma — só o conteúdo da grade e a unidade de navegação
  // (mês↔ano) mudam. `.date-picker-weekdays` some no modo mês (não há
  // cabeçalho de dia da semana quando a grade é de meses).
  function initDatePicker(root, onChange, opts) {
    const granularity = (opts && opts.granularity) || "day";
    const trigger = root.querySelector(".date-picker-trigger");
    const label = root.querySelector(".date-picker-label");
    const grid = root.querySelector(".date-picker-grid");
    const caption = root.querySelector(".date-picker-caption");
    const weekdays = root.querySelector(".date-picker-weekdays");

    if (granularity === "month") {
      grid.classList.add("is-month-grid");
      if (weekdays) weekdays.style.display = "none";
    }

    function mesAnoParaValor(ano, mes) {
      return ano + "-" + String(mes + 1).padStart(2, "0");
    }
    function valorParaMesAno(valor) {
      const partes = (valor || "").split("-");
      if (partes.length !== 2) return null;
      const ano = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      return Number.isNaN(ano) || Number.isNaN(mes) ? null : { ano, mes };
    }
    function formatarMesAno(valor) {
      const ma = valorParaMesAno(valor);
      return ma ? String(ma.mes + 1).padStart(2, "0") + "/" + ma.ano : "";
    }

    let selecionada = null; // "day": Date | null. "month": {ano, mes} | null.
    let visao = new Date();

    function atualizarTrigger() {
      const textoVazio = granularity === "month" ? "Selecione o mês" : "Selecione uma data";
      const textoSelecionado = granularity === "month" ? (selecionada ? formatarMesAno(mesAnoParaValor(selecionada.ano, selecionada.mes)) : "") : selecionada ? dataParaBr(selecionada) : "";
      label.textContent = selecionada ? textoSelecionado : textoVazio;
      trigger.classList.toggle("is-empty", !selecionada);
    }

    function renderGridDia() {
      const ano = visao.getFullYear();
      const mes = visao.getMonth();
      caption.textContent = MESES_PT[mes] + " de " + ano;

      const primeiroDoMes = new Date(ano, mes, 1);
      const inicioGrade = new Date(ano, mes, 1 - primeiroDoMes.getDay());
      const hojeBr = dataParaBr(new Date());
      const selecionadaBr = selecionada ? dataParaBr(selecionada) : null;

      grid.innerHTML = "";
      for (let i = 0; i < 42; i++) {
        const data = new Date(inicioGrade.getFullYear(), inicioGrade.getMonth(), inicioGrade.getDate() + i);
        const dataBr = dataParaBr(data);
        const outside = data.getMonth() !== mes;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "date-picker-day" +
          (outside ? " is-outside" : "") +
          (dataBr === hojeBr ? " is-today" : "") +
          (dataBr === selecionadaBr ? " is-selected" : "");
        btn.textContent = String(data.getDate());
        btn.addEventListener("click", () => {
          selecionada = dataBr === selecionadaBr ? null : data;
          atualizarTrigger();
          onChange(selecionada ? dataParaBr(selecionada) : null);
          root.classList.remove("is-open");
        });
        grid.appendChild(btn);
      }
    }

    function renderGridMes() {
      const ano = visao.getFullYear();
      caption.textContent = String(ano);

      grid.innerHTML = "";
      for (let mes = 0; mes < 12; mes++) {
        const isSelecionada = !!selecionada && selecionada.ano === ano && selecionada.mes === mes;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "date-picker-day" + (isSelecionada ? " is-selected" : "");
        btn.textContent = MESES_ABREV_PT[mes];
        btn.addEventListener("click", () => {
          selecionada = isSelecionada ? null : { ano, mes };
          atualizarTrigger();
          onChange(selecionada ? mesAnoParaValor(selecionada.ano, selecionada.mes) : null);
          root.classList.remove("is-open");
        });
        grid.appendChild(btn);
      }
    }

    const renderGrid = granularity === "month" ? renderGridMes : renderGridDia;

    trigger.addEventListener("click", () => {
      const abrindo = !root.classList.contains("is-open");
      root.classList.toggle("is-open");
      if (abrindo) {
        visao = granularity === "month" ? (selecionada ? new Date(selecionada.ano, selecionada.mes, 1) : new Date()) : selecionada || new Date();
        renderGrid();
      }
    });
    root.querySelector('[data-nav="prev"]').addEventListener("click", () => {
      visao = granularity === "month" ? new Date(visao.getFullYear() - 1, visao.getMonth(), 1) : new Date(visao.getFullYear(), visao.getMonth() - 1, 1);
      renderGrid();
    });
    root.querySelector('[data-nav="next"]').addEventListener("click", () => {
      visao = granularity === "month" ? new Date(visao.getFullYear() + 1, visao.getMonth(), 1) : new Date(visao.getFullYear(), visao.getMonth() + 1, 1);
      renderGrid();
    });
    document.addEventListener("click", (e) => {
      if (!root.contains(e.target)) root.classList.remove("is-open");
    });

    atualizarTrigger();

    return {
      setValue(valor) {
        if (granularity === "month") {
          selecionada = valorParaMesAno(valor);
          visao = selecionada ? new Date(selecionada.ano, selecionada.mes, 1) : new Date();
        } else {
          selecionada = dataBrParaDate(valor);
          visao = selecionada || new Date();
        }
        atualizarTrigger();
      },
    };
  }

  // Tooltip da barra de progresso segmentada (Implantação DP por empresa,
  // ver .segbar em components.css) — monta um elemento solto em <body>,
  // position:fixed, em vez de um ::after no próprio segmento. Um ::after
  // fica preso ao recorte do ancestral mais próximo com overflow != visible
  // (aqui, .table-wrap, que precisa do overflow-x:auto para rolagem
  // horizontal — e isso recorta o eixo Y também, por especificação).
  // Chame de novo depois de qualquer re-render da tabela/lista que contenha
  // segbars, igual iniTole/initCombobox — não fica "escutando" mudança de
  // DOM sozinho.
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

  global.UI = { openSheet, closeSheet, openDialog, closeDialog, showToast, truncatedCell, initToggleGroup, initCombobox, initMultiSelect, initDatePicker, initSegbarTooltips };
})(window);
