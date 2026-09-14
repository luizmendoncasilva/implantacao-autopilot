/*
  Listagem de empresas — portado de EmpresasList.jsx + FiliaisTable.jsx +
  hooks/useEmpresas.js (filtros, ordenação, paginação, expansão de matriz).
*/
(function () {
  const D = window.EmpresasData;

  const state = {
    busca: "",
    status: "todas",
    tipo: "todos",
    ordenarPor: "empresa",
    qtdVisivel: D.EMPRESAS_PAGE_SIZE,
    matrizesExpandidas: new Set(),
    buscaFiliaisPorMatriz: {},
    qtdVisivelFiliaisPorMatriz: {},
    filtroChaveAnterior: "",
  };

  function empresaCorrespondeABusca(empresa, busca) {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      empresa.nome.toLowerCase().includes(termo) ||
      empresa.codigo.toLowerCase().includes(termo) ||
      empresa.dadosGerais.cnpj.toLowerCase().includes(termo)
    );
  }
  function empresaCorrespondeAoStatus(empresa, status) {
    return status === "todas" || empresa.dadosGerais.statusCliente === status;
  }
  function valorParaOrdenacao(empresa, ordenarPor) {
    switch (ordenarPor) {
      case "codigo": return empresa.codigo;
      case "cnpj": return empresa.dadosGerais.cnpj;
      case "responsavel": return (D.resolveContadorResponsavel(empresa.codigo) || {}).nome || "";
      default: return empresa.nome;
    }
  }
  function compararEmpresas(a, b, ordenarPor) {
    return valorParaOrdenacao(a, ordenarPor).localeCompare(valorParaOrdenacao(b, ordenarPor), "pt-BR", { sensitivity: "base" });
  }
  function filtrarEOrdenar(empresas) {
    return empresas
      .filter((e) => empresaCorrespondeABusca(e, state.busca) && empresaCorrespondeAoStatus(e, state.status))
      .sort((a, b) => compararEmpresas(a, b, state.ordenarPor));
  }
  function paginarListas(qtd, ...listas) {
    let restante = qtd;
    return listas.map((lista) => {
      const fatia = lista.slice(0, Math.max(0, restante));
      restante -= fatia.length;
      return fatia;
    });
  }

  function centralInfo(codigo) {
    const mapa = D.getCentralizacao();
    return mapa[codigo] || { tipo: "não se aplica", vinculoCodigo: null };
  }

  function filiaisPorMatrizMap() {
    const mapa = new Map();
    D.EMPRESAS.forEach((e) => {
      const vinculo = centralInfo(e.codigo).vinculoCodigo;
      if (!vinculo) return;
      if (!mapa.has(vinculo)) mapa.set(vinculo, []);
      mapa.get(vinculo).push(e);
    });
    return mapa;
  }

  function abrirCadastro(codigo) {
    window.location.href = "dados-gerais.html?empresa=" + encodeURIComponent(codigo);
  }

  // Layout de colunas compartilhado pela tabela principal (index.html) e pela
  // subtabela de filiais abaixo — uma única definição em vez de duas cópias.
  const COLGROUP_HTML =
    '<col style="width:104px" /><col /><col style="width:170px" /><col style="width:280px" /><col style="width:90px" /><col style="width:40px" />';

  function rowMatrizHtml(m, filiais, expandida) {
    const contadorResp = D.resolveContadorResponsavel(m.codigo);
    return (
      '<tr class="row-clickable" data-abrir="' + m.codigo + '">' +
      '<td class="col-pad-sm">' + m.codigo + "</td>" +
      '<td><div class="flex items-center gap-2 min-w-0">' +
      '<button type="button" class="btn-icon-chev" data-toggle-matriz="' + m.codigo + '" aria-expanded="' + expandida + '">' +
      '<span style="display:inline-flex;transition:transform .2s ease-out;transform:rotate(' + (expandida ? 90 : 0) + 'deg);">' + Icon("chevron-right", "size-4") + "</span>" +
      "</button>" +
      '<span class="text-sm font-medium truncate" title="' + m.nome + '">' + m.nome + "</span>" +
      '<span class="badge badge-info shrink-0">Matriz</span>' +
      (filiais.length > 0 ? '<span class="text-xs shrink-0 text-muted">· ' + filiais.length + (filiais.length === 1 ? " filial" : " filiais") + "</span>" : "") +
      "</div></td>" +
      '<td class="col-pad-md">' + m.dadosGerais.cnpj + "</td>" +
      '<td class="col-pad-md" title="' + (contadorResp ? contadorResp.nome : "") + '">' + UI.truncatedCell(contadorResp ? contadorResp.nome : "—") + "</td>" +
      '<td class="col-pad-sm">' + D.situacaoBadge(m.dadosGerais) + "</td>" +
      '<td class="col-pad-end">' + Icon("arrow-right", "size-4") + "</td>" +
      "</tr>" +
      '<tr><td colspan="6" style="padding:0;">' +
      '<div data-filiais-region="' + m.codigo + '" style="display:' + (expandida ? "block" : "none") + ';">' +
      filiaisTableHtml(m, filiais) +
      "</div></td></tr>"
    );
  }

  // Nome cadastral genérico ("nome") é igual para a matriz e todas as suas
  // filiais — quem diferencia uma filial da outra é Razão social + Nome
  // fantasia (ex.: "Sigma Metais Anápolis" vs. "Sigma Metais Trindade"), por
  // isso é essa combinação que aparece na coluna "Filial", não `f.nome`.
  function nomeFilial(f) {
    return f.dadosGerais.razaoSocial + " — " + f.dadosGerais.nomeFantasia;
  }

  function filiaisTableHtml(m, filiais) {
    const busca = state.buscaFiliaisPorMatriz[m.codigo] || "";
    const filtradas = filiais.filter((f) => (nomeFilial(f) + " " + f.codigo).toLowerCase().includes(busca.toLowerCase()));
    const qtdVisivel = state.qtdVisivelFiliaisPorMatriz[m.codigo] || D.FILIAIS_PAGE_SIZE;
    const visiveis = filtradas.slice(0, qtdVisivel);

    let rows = "";
    if (visiveis.length === 0) {
      rows = '<tr><td colspan="6" class="row-empty-state">Nenhuma filial encontrada.</td></tr>';
    } else {
      rows = visiveis
        .map((f) => {
          const contadorResp = D.resolveContadorResponsavel(f.codigo);
          return (
            '<tr class="row-clickable" data-abrir="' + f.codigo + '">' +
            '<td class="col-pad-sm">' + f.codigo + "</td>" +
            '<td><div class="flex items-center gap-2 min-w-0"><span class="badge badge-secondary shrink-0">Filial</span><span class="text-sm truncate" title="' + nomeFilial(f) + '">' + nomeFilial(f) + "</span></div></td>" +
            '<td class="col-pad-md">' + f.dadosGerais.cnpj + "</td>" +
            '<td class="col-pad-md" title="' + (contadorResp ? contadorResp.nome : "") + '">' + UI.truncatedCell(contadorResp ? contadorResp.nome : "—") + "</td>" +
            '<td class="col-pad-sm">' + D.situacaoBadge(f.dadosGerais) + "</td>" +
            '<td class="col-pad-end">' + Icon("arrow-right", "size-4") + "</td>" +
            "</tr>"
          );
        })
        .join("");
    }

    return (
      '<div class="flex flex-col gap-2" style="padding:12px 12px 12px 40px; background:var(--muted);">' +
      (filiais.length > D.FILIAIS_PAGE_SIZE
        ? '<input class="field-input w-72" placeholder="Buscar filial por nome ou código..." data-busca-filial="' + m.codigo + '" value="' + busca + '" />'
        : "") +
      '<div class="table-wrap"><table class="dtable dtable-fixed dtable-compact">' +
      "<colgroup>" + COLGROUP_HTML + "</colgroup>" +
      "<thead><tr>" +
      '<th class="col-pad-sm">Código</th>' +
      "<th>Filial</th>" +
      '<th class="col-pad-md">CNPJ</th>' +
      '<th class="col-pad-md">Contador responsável</th>' +
      '<th class="col-pad-sm">Status</th>' +
      '<th class="col-pad-end"></th>' +
      "</tr></thead><tbody>" + rows + "</tbody></table></div>" +
      (filtradas.length > qtdVisivel
        ? '<button type="button" class="btn btn-ghost btn-sm w-fit" data-mais-filiais="' + m.codigo + '">Mostrar mais (' + (filtradas.length - qtdVisivel) + " restantes)</button>"
        : "") +
      "</div>"
    );
  }

  function rowSimplesHtml(e, badge) {
    const contadorResp = D.resolveContadorResponsavel(e.codigo);
    return (
      '<tr class="row-clickable" data-abrir="' + e.codigo + '">' +
      '<td class="col-pad-sm">' + e.codigo + "</td>" +
      "<td>" +
      (badge
        ? '<div class="flex items-center gap-2 min-w-0"><span class="badge badge-secondary shrink-0">Filial</span><span class="text-sm font-medium truncate" title="' + nomeFilial(e) + '">' + nomeFilial(e) + "</span></div>"
        : UI.truncatedCell(e.nome, null, "text-sm font-medium")) +
      "</td>" +
      '<td class="col-pad-md">' + e.dadosGerais.cnpj + "</td>" +
      '<td class="col-pad-md" title="' + (contadorResp ? contadorResp.nome : "") + '">' + UI.truncatedCell(contadorResp ? contadorResp.nome : "—") + "</td>" +
      '<td class="col-pad-sm">' + D.situacaoBadge(e.dadosGerais) + "</td>" +
      '<td class="col-pad-end">' + Icon("arrow-right", "size-4") + "</td>" +
      "</tr>"
    );
  }

  function render() {
    const matrizesTodas = D.EMPRESAS.filter((e) => centralInfo(e.codigo).tipo === "matriz");
    const avulsasTodas = D.EMPRESAS.filter((e) => {
      const t = centralInfo(e.codigo).tipo;
      return t !== "matriz" && t !== "filial";
    });
    const filiaisTodas = D.EMPRESAS.filter((e) => centralInfo(e.codigo).tipo === "filial");
    const filiaisMap = filiaisPorMatrizMap();

    const mostrarMatrizes = state.tipo !== "filial";
    const mostrarAvulsas = state.tipo === "todos";
    const mostrarFiliaisSoltas = state.tipo === "filial";

    const matrizesFiltradas = mostrarMatrizes ? filtrarEOrdenar(matrizesTodas) : [];
    const avulsasFiltradas = mostrarAvulsas ? filtrarEOrdenar(avulsasTodas) : [];
    const filiaisFiltradas = mostrarFiliaisSoltas ? filtrarEOrdenar(filiaisTodas) : [];

    const totalFiltrado = matrizesFiltradas.length + avulsasFiltradas.length + filiaisFiltradas.length;
    const [matrizesPag, avulsasPag, filiaisPag] = paginarListas(state.qtdVisivel, matrizesFiltradas, avulsasFiltradas, filiaisFiltradas);
    const totalPaginado = matrizesPag.length + avulsasPag.length + filiaisPag.length;
    const filtrosAtivos = state.busca.trim() !== "" || state.status !== "todas" || state.tipo !== "todos";

    let html = "";
    if (totalFiltrado === 0) {
      html =
        '<tr><td colspan="6" class="row-empty-state"><div class="flex flex-col items-center gap-2">' +
        "<span>Nenhuma empresa encontrada para os filtros selecionados.</span>" +
        (filtrosAtivos ? '<button type="button" id="btn-limpar-filtros" class="btn-link link-info">Limpar filtros</button>' : "") +
        "</div></td></tr>";
    } else {
      if (mostrarMatrizes) {
        matrizesPag.forEach((m) => {
          const filiais = filiaisMap.get(m.codigo) || [];
          html += rowMatrizHtml(m, filiais, state.matrizesExpandidas.has(m.codigo));
        });
      }
      if (mostrarAvulsas) avulsasPag.forEach((e) => (html += rowSimplesHtml(e, false)));
      if (mostrarFiliaisSoltas) filiaisPag.forEach((f) => (html += rowSimplesHtml(f, true)));
    }

    document.getElementById("tabela-empresas-body").innerHTML = html;

    const btnMais = document.getElementById("btn-mostrar-mais");
    if (totalFiltrado > totalPaginado) {
      btnMais.style.display = "";
      btnMais.textContent = "Mostrar mais (" + (totalFiltrado - totalPaginado) + " restantes)";
    } else {
      btnMais.style.display = "none";
    }

    wireRowEvents();
  }

  function wireRowEvents() {
    document.querySelectorAll("[data-abrir]").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-toggle-matriz]") || e.target.closest("[data-busca-filial]") || e.target.closest("[data-mais-filiais]")) return;
        abrirCadastro(el.getAttribute("data-abrir"));
      });
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("keydown", (e) => {
        if (e.target !== el) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirCadastro(el.getAttribute("data-abrir"));
        }
      });
    });

    document.querySelectorAll("[data-toggle-matriz]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const codigo = btn.getAttribute("data-toggle-matriz");
        if (state.matrizesExpandidas.has(codigo)) state.matrizesExpandidas.delete(codigo);
        else state.matrizesExpandidas.add(codigo);
        render();
      });
    });

    document.querySelectorAll("[data-busca-filial]").forEach((input) => {
      input.addEventListener("click", (e) => e.stopPropagation());
      input.addEventListener("input", (e) => {
        const codigo = input.getAttribute("data-busca-filial");
        state.buscaFiliaisPorMatriz[codigo] = e.target.value;
        state.qtdVisivelFiliaisPorMatriz[codigo] = D.FILIAIS_PAGE_SIZE;
        render();
        const novoInput = document.querySelector('[data-busca-filial="' + codigo + '"]');
        if (novoInput) {
          novoInput.focus();
          novoInput.selectionStart = novoInput.selectionEnd = novoInput.value.length;
        }
      });
    });

    document.querySelectorAll("[data-mais-filiais]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const codigo = btn.getAttribute("data-mais-filiais");
        state.qtdVisivelFiliaisPorMatriz[codigo] = (state.qtdVisivelFiliaisPorMatriz[codigo] || D.FILIAIS_PAGE_SIZE) + D.FILIAIS_PAGE_SIZE;
        render();
      });
    });

    const btnLimpar = document.getElementById("btn-limpar-filtros");
    if (btnLimpar) {
      btnLimpar.addEventListener("click", () => {
        state.busca = "";
        state.status = "todas";
        state.tipo = "todos";
        document.getElementById("f-busca").value = "";
        resetToggleGroup("f-status", "todas");
        resetToggleGroup("f-tipo", "todos");
        resetPaginacao();
        render();
      });
    }
  }

  function resetToggleGroup(id, value) {
    document.querySelectorAll("#" + id + " .toggle-item").forEach((i) => i.classList.toggle("is-on", i.getAttribute("data-value") === value));
  }
  function resetPaginacao() {
    state.qtdVisivel = D.EMPRESAS_PAGE_SIZE;
  }

  document.getElementById("f-busca").addEventListener("input", (e) => {
    state.busca = e.target.value;
    resetPaginacao();
    render();
  });
  document.getElementById("f-ordenar").addEventListener("change", (e) => {
    state.ordenarPor = e.target.value;
    resetPaginacao();
    render();
  });
  UI.initToggleGroup(document.getElementById("f-status"), (v) => {
    state.status = v;
    resetPaginacao();
    render();
  });
  UI.initToggleGroup(document.getElementById("f-tipo"), (v) => {
    state.tipo = v;
    resetPaginacao();
    render();
  });
  document.getElementById("btn-mostrar-mais").addEventListener("click", () => {
    state.qtdVisivel += D.EMPRESAS_PAGE_SIZE;
    render();
  });

  document.getElementById("tabela-empresas-colgroup").innerHTML = COLGROUP_HTML;
  render();
})();
