/*
  Lista de empresas em Implantação DP — porta de entrada do console (Épico 6,
  CTB-269). Cada linha leva para implantacao-console.html?empresa=CODE, que
  amarra as 5 frentes (Épicos 1 a 5) daquela empresa numa tela só com abas.
*/
(function () {
  const D = window.EmpresasImplantacaoData;
  const E = window.EmpresasData;

  const state = { status: "em_andamento", busca: "" };

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

  function renderFiltroStatus(lista) {
    const resumo = D.contarPorStatusEmpresa(lista);
    const select = document.getElementById("f-status-empresa");
    select.innerHTML =
      '<option value="em_andamento">Em andamento (' + resumo.emAndamento + ")</option>" +
      '<option value="implantada">Implantadas (' + resumo.implantada + ")</option>" +
      '<option value="todos">Todos (' + resumo.total + ")</option>";
    select.value = state.status;
  }

  function statusBadge(empresa) {
    if (empresa.status === "implantada") {
      return '<span class="badge badge-success">' + Icon("check", "size-3-5") + " Implantada</span>";
    }
    return '<span class="badge badge-info">' + Icon("clock", "size-3-5") + " Em andamento</span>";
  }

  // Um segmento por frente (Épicos 1 a 4 — Histórico não tem "progresso",
  // é log). Verde = frente concluída, âmbar = em andamento, cinza (padrão
  // do .segbar-segment) = nada feito ainda. O texto de cada frente só
  // aparece no tooltip (data-tooltip), pra não competir com a barra.
  function segmento(classe, tooltip) {
    return '<div class="segbar-segment' + (classe ? " " + classe : "") + '" data-tooltip="' + escapeHtml(tooltip) + '"></div>';
  }

  // Só 3 frentes bloqueiam a implantação (Andressa, 10/09/2026) —
  // colaboradores, histórico de folha e cálculo em paralelo. Rubricas saiu
  // da barra: sem de-para, virou aba informativa.
  function progressoHtml(r) {
    const col = r.colaboradores.total === 0 ? "" : r.colaboradores.prontos === r.colaboradores.total ? "is-success" : r.colaboradores.prontos === 0 ? "" : "is-warning";
    const fin = r.financeiro.necessarias === 0 ? "" : r.financeiro.carregadas === r.financeiro.necessarias ? "is-success" : r.financeiro.carregadas === 0 ? "" : "is-warning";
    const calc =
      r.calculoParalelo.total === 0
        ? ""
        : r.calculoParalelo.comDivergencia > 0
        ? "is-warning"
        : r.calculoParalelo.validadas === r.calculoParalelo.total
        ? "is-success"
        : "";
    return (
      '<div class="flex items-center gap-2">' +
      '<div class="segbar">' +
      segmento(col, "Colaboradores: " + r.colaboradores.prontos + "/" + r.colaboradores.total + " prontos") +
      segmento(fin, "Competências de folha: " + r.financeiro.carregadas + "/" + r.financeiro.necessarias + " carregadas") +
      segmento(calc, "Cálculo em paralelo: " + r.calculoParalelo.validadas + "/" + r.calculoParalelo.total + " validadas" + (r.calculoParalelo.comDivergencia ? " · " + r.calculoParalelo.comDivergencia + " com divergência" : "")) +
      "</div>" +
      '<span class="text-xs text-muted">' + D.percentualConclusao(r) + "%</span>" +
      "</div>"
    );
  }

  function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  function rowHtml(empresa) {
    const r = D.resumoCompleto(empresa);
    return (
      '<tr class="row-clickable" data-abrir-console="' + empresa.empresaCodigo + '">' +
      "<td><div class=\"flex flex-col gap-1-5 min-w-0\">" +
      '<span class="text-sm font-medium truncate">' + empresaNome(empresa.empresaCodigo) + "</span>" +
      progressoHtml(r) +
      "</div></td>" +
      '<td class="col-pad-md">' + UI.truncatedCell(empresa.etapaAtual, null, "text-sm") + "</td>" +
      '<td class="col-pad-md">' + statusBadge(empresa) + "</td>" +
      '<td class="col-pad-end">' + Icon("arrow-right", "size-4") + "</td>" +
      "</tr>"
    );
  }

  function render() {
    const todas = D.EMPRESAS_IMPLANTACAO;
    renderFiltroStatus(todas);

    const buscaNormalizada = state.busca.trim().toLowerCase();
    const digitosBusca = apenasDigitos(buscaNormalizada);
    const filtradas = todas
      .filter((e) => state.status === "todos" || e.status === state.status)
      .filter(
        (e) =>
          !buscaNormalizada ||
          empresaNome(e.empresaCodigo).toLowerCase().includes(buscaNormalizada) ||
          (digitosBusca !== "" && apenasDigitos(empresaCnpj(e.empresaCodigo)).includes(digitosBusca))
      )
      .sort((a, b) => empresaNome(a.empresaCodigo).localeCompare(empresaNome(b.empresaCodigo), "pt-BR", { sensitivity: "base" }));

    let html;
    if (filtradas.length === 0) {
      html = '<tr><td colspan="4" class="row-empty-state">Nenhuma empresa encontrada para os filtros selecionados.</td></tr>';
    } else {
      html = filtradas.map(rowHtml).join("");
    }
    document.getElementById("tabela-empresas-implantacao-body").innerHTML = html;
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

  document.getElementById("f-status-empresa").addEventListener("change", (e) => {
    state.status = e.target.value;
    render();
  });

  document.getElementById("f-busca-empresa").addEventListener("input", (e) => {
    state.busca = e.target.value;
    render();
  });

  render();
})();
