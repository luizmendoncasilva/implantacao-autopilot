/*
  Dash geral de Implantação — as 3 frentes (DP/Fiscal/Contábil) lado a lado
  por empresa. Pedido da Andressa (10/09/2026): a implantação de empresas
  vira uma tela "termômetro" que mostra os 3 módulos antes de entrar na
  implantação específica de cada um. Hoje só DP existe de verdade —
  Fiscal/Contábil mostram um badge "em breve", sem barra nem link, até
  ganharem o mesmo console que o DP já tem.
*/
(function () {
  const D = window.EmpresasImplantacaoData;
  const E = window.EmpresasData;

  const state = { busca: "" };

  function empresaNome(codigo) {
    const empresa = E.findEmpresaByCodigo(codigo);
    return empresa ? empresa.nome : codigo;
  }
  function empresaCnpj(codigo) {
    const empresa = E.findEmpresaByCodigo(codigo);
    return empresa && empresa.dadosGerais ? empresa.dadosGerais.cnpj : "";
  }
  function apenasDigitos(v) {
    return (v || "").replace(/\D/g, "");
  }

  // Uma barra contínua por módulo (não segmentada por frente — isso já vive
  // no console de cada módulo), com o nome do módulo do lado. O percentual
  // só aparece no hover (UI.initSegbarTooltips, reaproveitado do segbar) —
  // pedido de revisão (10/09/2026): não deixar o número sempre visível,
  // só a barra + nome, com o detalhe no tooltip.
  function progressoModuloHtml(label, percentual) {
    const corClasse = percentual === 100 ? "is-success" : percentual > 0 ? "is-warning" : "";
    return (
      '<div class="flex items-center gap-2">' +
      '<span class="text-xs text-muted" style="width:52px; flex-shrink:0;">' + label + "</span>" +
      '<div class="progress-bar-wrap" style="flex:1;" data-tooltip="' + label + ": " + percentual + '% concluído">' +
      '<div class="progress-bar"><div class="progress-bar-fill ' + corClasse + '" style="width:' + Math.max(percentual, 2) + '%;"></div></div>' +
      "</div></div>"
    );
  }

  function moduloEmBreveHtml(label) {
    return (
      '<div class="flex items-center gap-2">' +
      '<span class="text-xs text-muted" style="width:52px; flex-shrink:0;">' + label + "</span>" +
      '<span class="badge badge-secondary">Em breve</span>' +
      "</div>"
    );
  }

  function rowHtml(empresaImplant) {
    const r = D.resumoCompleto(empresaImplant);
    const percentualDp = D.percentualConclusao(r);
    return (
      '<tr class="row-clickable" data-abrir-console="' + empresaImplant.empresaCodigo + '">' +
      '<td><span class="text-sm font-medium truncate">' + empresaNome(empresaImplant.empresaCodigo) + "</span></td>" +
      '<td class="col-pad-md">' + progressoModuloHtml("DP", percentualDp) + "</td>" +
      '<td class="col-pad-md">' + moduloEmBreveHtml("Fiscal") + "</td>" +
      '<td class="col-pad-md">' + moduloEmBreveHtml("Contábil") + "</td>" +
      '<td class="col-pad-end">' + Icon("arrow-right", "size-4") + "</td>" +
      "</tr>"
    );
  }

  function render() {
    const todas = D.EMPRESAS_IMPLANTACAO;
    const buscaNormalizada = state.busca.trim().toLowerCase();
    const digitosBusca = apenasDigitos(buscaNormalizada);
    const filtradas = todas
      .filter(
        (e) =>
          !buscaNormalizada ||
          empresaNome(e.empresaCodigo).toLowerCase().includes(buscaNormalizada) ||
          (digitosBusca !== "" && apenasDigitos(empresaCnpj(e.empresaCodigo)).includes(digitosBusca))
      )
      .sort((a, b) => empresaNome(a.empresaCodigo).localeCompare(empresaNome(b.empresaCodigo), "pt-BR", { sensitivity: "base" }));

    let html;
    if (filtradas.length === 0) {
      html = '<tr><td colspan="5" class="row-empty-state">Nenhuma empresa encontrada para os filtros selecionados.</td></tr>';
    } else {
      html = filtradas.map(rowHtml).join("");
    }
    document.getElementById("tabela-implantacao-geral-body").innerHTML = html;
    wireRowEvents();
    UI.initSegbarTooltips();
  }

  function wireRowEvents() {
    document.querySelectorAll("[data-abrir-console]").forEach((el) => {
      const codigo = el.getAttribute("data-abrir-console");
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("click", () => {
        window.location.href = "implantacao-console.html?empresa=" + encodeURIComponent(codigo);
      });
      el.addEventListener("keydown", (e) => {
        if (e.target !== el) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.href = "implantacao-console.html?empresa=" + encodeURIComponent(codigo);
        }
      });
    });
  }

  document.getElementById("f-busca-empresa-geral").addEventListener("input", (e) => {
    state.busca = e.target.value;
    render();
  });

  render();
})();
