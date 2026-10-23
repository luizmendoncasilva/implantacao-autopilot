/*
  Console geral da Implantação — única entrada da sidebar. Lista todas as
  empresas do Cockpit (RF-101), com o status no Cockpit e DP, Fiscal e
  Contábil lado a lado. O filtro de status (não iniciada, em andamento,
  implantada) é de seleção múltipla e abre em "em andamento" (RF-102). A
  Nova implantação fica dentro de cada aba da empresa (Discovery 23/10/2026);
  a célula de uma frente abre a empresa já nessa aba.
*/
(function () {
  const EI = window.EmpresasImplantacaoData;
  const FI = window.FiscalImplantacaoData;
  const F = window.ImplantacaoFrentes;

  const state = { busca: "", statuses: ["em_andamento"], frente: "todas" };

  function apenasDigitos(v) {
    return (v || "").replace(/\D/g, "");
  }

  function urlConsole(codigo, frente) {
    return "implantacao-console.html?empresa=" + encodeURIComponent(codigo) + (frente ? "&frente=" + frente : "");
  }

  function linkFrente(codigo, frente, conteudo, rotulo) {
    return '<a href="' + urlConsole(codigo, frente) + '" class="frente-cell-link" aria-label="' + rotulo + '">' + conteudo + "</a>";
  }

  // Status que vêm do Cockpit: situação do cliente, DP (hr_status) e Fiscal (tax_status).
  function cockpitHtml(codigo) {
    const sc = EI.statusCockpit(codigo);
    return (
      '<div class="cockpit-cell">' + F.badgeCockpit("cliente", sc.cliente) +
      '<span class="cockpit-cell-linha"><span class="cockpit-cell-rotulo">DP</span>' + F.badgeCockpit("hr", sc.hr) + "</span>" +
      '<span class="cockpit-cell-linha"><span class="cockpit-cell-rotulo">Fiscal</span>' + F.badgeCockpit("tax", sc.tax) + "</span>" +
      "</div>"
    );
  }

  function celulaDp(codigo) {
    const s = F.situacaoDp(codigo);
    if (s.status === "nao_opera") return '<div class="flex flex-col gap-1 items-start"><span class="badge badge-outline">Não opera DP</span>' + "</div>";
    if (s.status === "nao_iniciada") return '<div class="flex flex-col gap-1 items-start">' + linkFrente(codigo, "dp", '<span class="badge badge-secondary">Não iniciada</span>', "Abrir DP: não iniciada") + "</div>";
    if (s.status === "implantada") {
      return '<div class="flex flex-col gap-1 items-start">' + linkFrente(codigo, "dp", '<span class="badge badge-success">' + Icon("check", "size-3") + " Implantada</span>", "Abrir DP: implantada") + "</div>";
    }
    const conteudo =
      '<div class="flex items-center gap-2 w-full">' + F.marcosDpHtml(codigo) +
      '<span class="text-xs font-medium tabular-nums" style="width:34px; text-align:right; flex-shrink:0;">' + s.percentual + "%</span></div>";
    return '<div class="flex flex-col gap-1">' + linkFrente(codigo, "dp", conteudo, "Abrir DP: " + s.percentual + "% concluído") + (s.semMovimento ? '<span class="badge badge-secondary">' + Icon("info", "size-3") + " Sem movimento</span>" : "") + "</div>";
  }

  // Um segmento por período (caixa) da janela do Fator R.
  function classeMes(m) {
    if (m.origemCpp === "nao_compoe") return "is-muted";
    if (m.origemCpp === "pendente" || (m.origemFolha === "dp_fora" && m.folha === null)) return "";
    return "is-success";
  }

  function celulaFiscal(codigo) {
    const s = F.situacaoFiscal(codigo);
    if (s.status === "nao_opera") return '<div class="flex flex-col gap-1 items-start"><span class="badge badge-outline">Não opera Fiscal</span></div>';
    if (s.status === "nao_aplica") return '<div class="flex flex-col gap-1 items-start"><span class="badge badge-outline">Não se aplica</span>' + "</div>";
    if (s.status === "nao_iniciada") return '<div class="flex flex-col gap-1 items-start">' + linkFrente(codigo, "fiscal", '<span class="badge badge-secondary">Não iniciada</span>', "Abrir Fiscal: não iniciada") + "</div>";
    if (s.status === "implantada") {
      return '<div class="flex flex-col gap-1 items-start">' + linkFrente(codigo, "fiscal", '<span class="badge badge-success">' + Icon("check", "size-3") + " Implantada</span>", "Abrir Fiscal: implantada") + "</div>";
    }
    const meses = FI.getImplantacao(codigo).meses;
    const r = s.resumo;
    const barra =
      '<div class="flex items-center gap-2 w-full">' +
      '<div class="segbar segbar-thin">' +
      meses.map((m) => '<div class="segbar-segment ' + classeMes(m) + '" data-tooltip="Período ' + m.periodo + " · " + FI.ROTULO_ORIGEM_CPP[m.origemCpp] + '"></div>').join("") +
      "</div>" +
      '<span class="text-xs font-medium tabular-nums" style="white-space:nowrap;">' + r.resolvidos + "/" + r.exigidos + "</span>" +
      "</div>";
    return '<div class="flex flex-col gap-1">' + linkFrente(codigo, "fiscal", barra, "Abrir Fiscal: " + r.resolvidos + " de " + r.exigidos + " períodos resolvidos") + "</div>";
  }

  function rowHtml(codigo) {
    const info = EI.infoEmpresa(codigo);
    return (
      '<tr class="row-clickable" data-abrir-console="' + codigo + '">' +
      '<td><div class="flex flex-col gap-0-5 min-w-0">' +
      '<span class="text-sm font-medium truncate">' + info.nome + "</span>" +
      '<span class="cell-mono text-muted">' + info.cnpj + "</span>" +
      "</div></td>" +
      '<td class="col-pad-md">' + cockpitHtml(codigo) + "</td>" +
      '<td class="col-pad-md">' + celulaDp(codigo) + "</td>" +
      '<td class="col-pad-md">' + celulaFiscal(codigo) + "</td>" +
      '<td class="col-pad-md"><span class="badge badge-secondary">Em breve</span></td>' +
      '<td class="col-pad-md">' + F.badgeStatusGeral(F.statusGeral(codigo)) + "</td>" +
      '<td class="col-pad-end"><span class="text-muted">' + Icon("chevron-right", "size-4") + "</span></td>" +
      "</tr>"
    );
  }

  function contar(codigos, status) {
    return codigos.filter((c) => F.statusGeral(c) === status).length;
  }

  function renderDashboards(codigos) {
    const cppPendente = codigos.filter((c) => F.temPendencia(c, "fiscal")).length;
    const cards = [
      { label: "Não iniciadas", value: contar(codigos, "nao_iniciada"), classe: "" },
      { label: "Em andamento", value: contar(codigos, "em_andamento"), classe: "" },
      { label: "Implantadas", value: contar(codigos, "implantada"), classe: "stat-card-success" },
      { label: "Com saldos de CPP pendentes", value: cppPendente, classe: cppPendente ? "stat-card-warning" : "" },
    ];
    document.getElementById("dash-implantacao-geral-mount").innerHTML = cards
      .map((c) => '<div class="stat-card' + (c.classe ? " " + c.classe : "") + '"><span class="stat-card-value">' + c.value + '</span><span class="stat-card-label">' + c.label + "</span></div>")
      .join("");
  }

  function statusOptions(codigos) {
    return [
      { value: "nao_iniciada", label: "Não iniciada", count: contar(codigos, "nao_iniciada") },
      { value: "em_andamento", label: "Em andamento", count: contar(codigos, "em_andamento") },
      { value: "implantada", label: "Implantada", count: contar(codigos, "implantada") },
    ];
  }

  function render() {
    const todas = F.empresasNaImplantacao();
    renderDashboards(todas);

    const busca = state.busca.trim().toLowerCase();
    const digitos = apenasDigitos(busca);
    const filtradas = todas
      .filter((c) => state.statuses.length === 0 || state.statuses.indexOf(F.statusGeral(c)) !== -1)
      .filter((c) => state.frente === "todas" || F.temPendencia(c, state.frente))
      .filter((c) => {
        const info = EI.infoEmpresa(c);
        return !busca || info.nome.toLowerCase().includes(busca) || (digitos !== "" && apenasDigitos(info.cnpj).includes(digitos));
      })
      .sort((a, b) => EI.infoEmpresa(a).nome.localeCompare(EI.infoEmpresa(b).nome, "pt-BR", { sensitivity: "base" }));

    document.getElementById("tabela-implantacao-geral-body").innerHTML = filtradas.length
      ? filtradas.map(rowHtml).join("")
      : '<tr><td colspan="7" class="row-empty-state">Nenhuma empresa encontrada para os filtros selecionados.</td></tr>';
    wireRowEvents();
    UI.initSegbarTooltips();
  }

  function wireRowEvents() {
    document.querySelectorAll("[data-abrir-console]").forEach((el) => {
      const codigo = el.getAttribute("data-abrir-console");
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "link");
      el.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        window.location.href = urlConsole(codigo);
      });
      el.addEventListener("keydown", (e) => {
        if (e.target !== el) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.href = urlConsole(codigo);
        }
      });
    });
  }

  document.getElementById("f-busca-empresa-geral").addEventListener("input", (e) => {
    state.busca = e.target.value;
    render();
  });

  document.querySelectorAll("[data-frente-filtro]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.frente = btn.getAttribute("data-frente-filtro");
      document.querySelectorAll("[data-frente-filtro]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-checked", on ? "true" : "false");
      });
      render();
    });
  });


  UI.initMultiSelect(document.getElementById("combo-status-geral"), statusOptions(F.empresasNaImplantacao()), state.statuses, (valores) => {
    state.statuses = valores;
    render();
  });

  render();
})();
