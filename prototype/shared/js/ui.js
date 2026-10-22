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
  // Pode ser chamado de novo no mesmo root (ex.: a cada abertura de um sheet,
  // ou ao trocar as opções): os listeners são ligados uma vez só e leem
  // opções/valor/onSelect atuais de root._combobox — antes, cada nova chamada
  // empilhava outro listener no trigger e o segundo clique fechava a lista.
  function initCombobox(root, options, currentValue, onSelect) {
    const trigger = root.querySelector(".combobox-trigger");
    const searchInput = root.querySelector(".combobox-search input");
    const list = root.querySelector(".combobox-list");
    const state = { options: options, currentValue: currentValue, onSelect: onSelect };
    root._combobox = state;

    function renderList(filterText) {
      const termo = (filterText || "").toLowerCase();
      const filtrados = state.options.filter((o) => (o.label + " " + (o.sublabel || "")).toLowerCase().includes(termo));
      list.innerHTML = "";
      if (filtrados.length === 0) {
        list.innerHTML = '<div class="combobox-empty">' + (root.getAttribute("data-empty-text") || "Nenhum resultado encontrado.") + "</div>";
        return;
      }
      filtrados.forEach((o) => {
        const isSel = String(o.value) === String(state.currentValue);
        const item = document.createElement("div");
        item.className = "combobox-item" + (isSel ? " is-selected" : "");
        item.innerHTML =
          '<span class="check">' + Icon("check", "size-4") + "</span>" +
          '<div class="flex flex-col min-w-0"><span class="truncate">' + o.label + "</span>" +
          (o.sublabel ? '<span class="combobox-item-sub truncate">' + o.sublabel + "</span>" : "") +
          "</div>";
        item.addEventListener("click", () => {
          state.currentValue = o.value;
          state.onSelect(o.value, o.label);
          trigger.querySelector(".combobox-label").textContent = o.label;
          trigger.classList.add("has-value");
          root.classList.remove("is-open");
          searchInput.value = "";
          renderList("");
        });
        list.appendChild(item);
      });
    }
    state.renderList = renderList;

    if (!root._comboboxWired) {
      root._comboboxWired = true;
      trigger.addEventListener("click", () => {
        root.classList.toggle("is-open");
        if (root.classList.contains("is-open")) {
          searchInput.value = "";
          root._combobox.renderList("");
          searchInput.focus();
        }
      });
      searchInput.addEventListener("input", (e) => root._combobox.renderList(e.target.value));
      document.addEventListener("click", (e) => {
        if (!root.contains(e.target)) root.classList.remove("is-open");
      });
      // O texto inicial do trigger é o placeholder; guardado para quando o valor for limpo.
      root._comboboxPlaceholder = trigger.querySelector(".combobox-label").textContent;
    }

    root.classList.remove("is-open");
    renderList("");
    const selecionado = state.options.find((o) => String(o.value) === String(state.currentValue));
    trigger.querySelector(".combobox-label").textContent = selecionado ? selecionado.label : root._comboboxPlaceholder;
    trigger.classList.toggle("has-value", !!selecionado);
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

  // Tabs that are separate pages reload the whole screen; this keeps the tab body behind a skeleton for a
  // short simulated load (same idea as FISCAL_LOADING_DELAY_MS), so the switch reads as content loading.
  const TAB_LOADING_DELAY_MS = 450;

  function skeletonBar(width, height) {
    return '<span class="skeleton" style="width:' + width + "; height:" + height + ';"></span>';
  }

  function tabSkeletonHtml(variant) {
    const header = '<div class="flex flex-col gap-2">' + skeletonBar("200px", "22px") + skeletonBar("320px", "13px") + "</div>";
    if (variant === "list") {
      const rows = [1, 2, 3, 4, 5].map(() => skeletonBar("100%", "40px")).join("");
      return header + '<div class="flex items-end gap-3">' + skeletonBar("280px", "36px") + skeletonBar("200px", "36px") + "</div>" + '<div class="flex flex-col gap-2">' + rows + "</div>";
    }
    const field = '<div class="flex flex-col gap-2">' + skeletonBar("90px", "10px") + skeletonBar("70%", "15px") + "</div>";
    const grid = '<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:18px 24px;">' + [1, 2, 3, 4, 5, 6].map(() => field).join("") + "</div>";
    return header + skeletonBar("100%", "1px") + grid + skeletonBar("100%", "1px") + grid;
  }

  // contentEl stays rendered but hidden, so the tab logic runs untouched; only its visibility is deferred.
  function showTabSkeleton(contentEl, opts) {
    if (!contentEl) return;
    const options = opts || {};
    const skeleton = document.createElement("div");
    skeleton.className = "card";
    skeleton.setAttribute("role", "status");
    skeleton.setAttribute("aria-busy", "true");
    skeleton.style.marginTop = getComputedStyle(contentEl).marginTop;
    skeleton.innerHTML =
      '<span class="sr-only">Carregando…</span><div class="card-content flex flex-col gap-4">' + tabSkeletonHtml(options.variant) + "</div>";
    contentEl.classList.add("hidden");
    contentEl.parentNode.insertBefore(skeleton, contentEl);
    window.setTimeout(() => {
      skeleton.remove();
      contentEl.classList.remove("hidden");
    }, options.delayMs || TAB_LOADING_DELAY_MS);
  }

  global.UI = { openSheet, closeSheet, openDialog, closeDialog, showToast, truncatedCell, initToggleGroup, initCombobox, initDatePicker, showTabSkeleton };
})(window);
