/*
  Console geral da Implantação — única entrada da sidebar. Uma linha por
  empresa, com DP, Fiscal e Contábil lado a lado (pedido da Andressa,
  10/09/2026, de um "termômetro" geral com o percentual de cada frente). A
  empresa abre em implantacao-console.html, onde cada frente é uma aba; a
  célula de uma frente abre a empresa já nessa aba.
*/
(function () {
  const EI = window.EmpresasImplantacaoData;
  const FI = window.FiscalImplantacaoData;
  const F = window.ImplantacaoFrentes;

  const state = { busca: "", statuses: [], frente: "todas" };

  function apenasDigitos(v) {
    return (v || "").replace(/\D/g, "");
  }

  function urlConsole(codigo, frente) {
    return "implantacao-console.html?empresa=" + encodeURIComponent(codigo) + (frente ? "&frente=" + frente : "");
  }

  function linkFrente(codigo, frente, conteudo, rotulo) {
    return '<a href="' + urlConsole(codigo, frente) + '" class="frente-cell-link" aria-label="' + rotulo + '">' + conteudo + "</a>";
  }

  function celulaDp(codigo) {
    const s = F.situacaoDp(codigo);
    if (!s.aplica) return '<span class="badge badge-outline">Não contratado</span>';
    if (s.status === "implantada") {
      return linkFrente(codigo, "dp", '<span class="badge badge-success">' + Icon("check", "size-3") + " Implantada</span>", "Abrir DP: implantada");
    }
    const conteudo =
      '<div class="flex items-center gap-2 w-full">' + F.marcosDpHtml(codigo) +
      '<span class="text-xs font-medium tabular-nums" style="width:34px; text-align:right; flex-shrink:0;">' + s.percentual + "%</span></div>";
    return linkFrente(codigo, "dp", conteudo, "Abrir DP: " + s.percentual + "% concluído");
  }

  // Um segmento por competência da janela do Fator R.
  function classeMes(origem) {
    if (origem === "pendente") return "";
    if (origem === "nao_compoe") return "is-muted";
    return "is-success";
  }

  function celulaFiscal(codigo) {
    const s = F.situacaoFiscal(codigo);
    if (!s.aplica) return '<span class="badge badge-outline">Não se aplica</span>';
    if (s.status === "implantada") {
      return linkFrente(codigo, "fiscal", '<span class="badge badge-success">' + Icon("check", "size-3") + " Implantada</span>", "Abrir Fiscal: implantada");
    }
    const meses = FI.getImplantacao(codigo).meses;
    const r = s.resumo;
    const barra =
      '<div class="flex items-center gap-2 w-full">' +
      '<div class="segbar segbar-thin">' +
      meses.map((m) => '<div class="segbar-segment ' + classeMes(m.origem) + '" data-tooltip="' + m.competencia + " · " + FI.ROTULO_ORIGEM[m.origem] + '"></div>').join("") +
      "</div>" +
      '<span class="text-xs font-medium tabular-nums" style="white-space:nowrap;">' + (r.resolvidos) + "/" + r.janela + "</span>" +
      "</div>";
    return linkFrente(codigo, "fiscal", barra, "Abrir Fiscal: " + r.resolvidos + " de " + r.janela + " competências de CPP resolvidas");
  }

  function rowHtml(codigo) {
    const info = EI.infoEmpresa(codigo);
    return (
      '<tr class="row-clickable" data-abrir-console="' + codigo + '">' +
      '<td><div class="flex flex-col gap-0-5 min-w-0">' +
      '<span class="text-sm font-medium truncate">' + info.nome + "</span>" +
      '<span class="cell-mono text-muted">' + info.cnpj + "</span>" +
      "</div></td>" +
      '<td class="col-pad-md">' + celulaDp(codigo) + "</td>" +
      '<td class="col-pad-md">' + celulaFiscal(codigo) + "</td>" +
      '<td class="col-pad-md"><span class="badge badge-secondary">Em breve</span></td>' +
      '<td class="col-pad-md">' + F.badgeStatusGeral(F.statusGeral(codigo)) + "</td>" +
      '<td class="col-pad-end"><span class="text-muted">' + Icon("chevron-right", "size-4") + "</span></td>" +
      "</tr>"
    );
  }

  function renderDashboards(codigos) {
    const implantadas = codigos.filter((c) => F.statusGeral(c) === "implantada").length;
    const cppPendente = codigos.filter((c) => F.temPendencia(c, "fiscal")).length;
    const cards = [
      { label: "Empresas em implantação", value: codigos.length, classe: "" },
      { label: "Em andamento", value: codigos.length - implantadas, classe: "" },
      { label: "Implantadas", value: implantadas, classe: "stat-card-success" },
      { label: "Com CPP do Fator R pendente", value: cppPendente, classe: cppPendente ? "stat-card-warning" : "" },
    ];
    document.getElementById("dash-implantacao-geral-mount").innerHTML = cards
      .map((c) => '<div class="stat-card' + (c.classe ? " " + c.classe : "") + '"><span class="stat-card-value">' + c.value + '</span><span class="stat-card-label">' + c.label + "</span></div>")
      .join("");
  }

  function statusOptions(codigos) {
    const implantadas = codigos.filter((c) => F.statusGeral(c) === "implantada").length;
    return [
      { value: "em_andamento", label: "Em andamento", count: codigos.length - implantadas },
      { value: "implantada", label: "Implantadas", count: implantadas },
    ];
  }

  function render() {
    const todas = F.empresasNaImplantacao();
    renderDashboards(todas);

    const busca = state.busca.trim().toLowerCase();
    const digitos = apenasDigitos(busca);
    const filtradas = todas
      .filter((c) => state.statuses.length === 0 || state.statuses.length === 2 || state.statuses.indexOf(F.statusGeral(c)) !== -1)
      .filter((c) => state.frente === "todas" || F.temPendencia(c, state.frente))
      .filter((c) => {
        const info = EI.infoEmpresa(c);
        return !busca || info.nome.toLowerCase().includes(busca) || (digitos !== "" && apenasDigitos(info.cnpj).includes(digitos));
      })
      .sort((a, b) => EI.infoEmpresa(a).nome.localeCompare(EI.infoEmpresa(b).nome, "pt-BR", { sensitivity: "base" }));

    document.getElementById("tabela-implantacao-geral-body").innerHTML = filtradas.length
      ? filtradas.map(rowHtml).join("")
      : '<tr><td colspan="6" class="row-empty-state">Nenhuma empresa encontrada para os filtros selecionados.</td></tr>';
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
