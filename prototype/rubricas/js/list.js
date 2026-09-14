/*
  Listagem de Rubricas — busca por código/nome + filtros de Situação e Tipo,
  mesmo padrão de prototype/sindicatos/js/list.js (paginação incremental via
  "Mostrar mais", estado vazio com CTA quando não há nenhuma rubrica ainda ou
  mensagem de busca vazia quando os filtros não encontram nada).

  "Nova rubrica" navega para a tela de detalhe em modo de criação (sem
  Drawer — decisão de UX registrada no diagnóstico desta tarefa: o volume de
  campos da especificação não cabe confortavelmente num Drawer, mesmo
  critério já usado para Convenção Coletiva).
*/
(function () {
  const D = window.RubricasData;
  const PAGE_SIZE = 25;

  const state = { busca: "", situacao: "", tipo: "", qtdVisivel: PAGE_SIZE };

  function correspondeABusca(rubrica, busca) {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return rubrica.codigo.toLowerCase().includes(termo) || rubrica.nome.toLowerCase().includes(termo);
  }

  function tipoLabel(value) {
    const found = D.O.tipoRubrica.find((o) => o.value === value);
    return found ? found.label : value;
  }

  function abrirRubrica(codigo) {
    window.location.href = "rubrica.html?rubrica=" + encodeURIComponent(codigo);
  }

  function abrirNovaRubrica() {
    window.location.href = "rubrica.html";
  }

  function rowHtml(r) {
    const badgeClass = r.situacao === "Ativo" ? "badge-success" : "badge-outline";
    return (
      '<tr class="row-clickable" data-abrir="' + r.codigo + '" tabindex="0" role="button">' +
      '<td class="col-pad-sm">' + r.codigo + "</td>" +
      "<td>" + UI.truncatedCell(r.nome, null, "text-sm font-medium") + "</td>" +
      '<td class="col-pad-md">' + tipoLabel(r.geral.tipoRubrica) + "</td>" +
      '<td class="col-pad-md"><span class="badge ' + badgeClass + '">' + r.situacao + "</span></td>" +
      '<td class="col-pad-end">' + Icon("arrow-right", "size-4") + "</td>" +
      "</tr>"
    );
  }

  function render() {
    const todos = D.getRubricas();
    const filtrados = todos
      .filter((r) => correspondeABusca(r, state.busca))
      .filter((r) => !state.situacao || r.situacao === state.situacao)
      .filter((r) => !state.tipo || r.geral.tipoRubrica === state.tipo)
      .sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR", { numeric: true }));
    const visiveis = filtrados.slice(0, state.qtdVisivel);

    let html = "";
    if (filtrados.length === 0) {
      const semFiltro = !state.busca && !state.situacao && !state.tipo;
      html =
        '<tr><td colspan="5" class="row-empty-state"><div class="flex flex-col items-center gap-2">' +
        (todos.length === 0 || semFiltro
          ? (todos.length === 0
              ? '<span>Nenhuma rubrica cadastrada.</span><button type="button" class="btn btn-sm" id="btn-empty-nova">' + Icon("plus", "size-3-5") + " Nova rubrica</button>"
              : '<span>Nenhuma rubrica encontrada para os filtros informados.</span><button type="button" class="btn-link link-info" id="btn-limpar-filtros">Limpar filtros</button>')
          : '<span>Nenhuma rubrica encontrada para os filtros informados.</span><button type="button" class="btn-link link-info" id="btn-limpar-filtros">Limpar filtros</button>') +
        "</div></td></tr>";
    } else {
      html = visiveis.map(rowHtml).join("");
    }
    document.getElementById("tabela-rubricas-body").innerHTML = html;

    const btnMais = document.getElementById("btn-mostrar-mais");
    if (filtrados.length > visiveis.length) {
      btnMais.style.display = "";
      btnMais.textContent = "Mostrar mais (" + (filtrados.length - visiveis.length) + " restantes)";
    } else {
      btnMais.style.display = "none";
    }

    wireRowEvents();
  }

  function limparFiltros() {
    state.busca = "";
    state.situacao = "";
    state.tipo = "";
    document.getElementById("f-busca").value = "";
    document.getElementById("f-situacao").value = "";
    document.getElementById("f-tipo").value = "";
    render();
  }

  function wireRowEvents() {
    document.querySelectorAll("[data-abrir]").forEach((el) => {
      el.addEventListener("click", () => abrirRubrica(el.getAttribute("data-abrir")));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirRubrica(el.getAttribute("data-abrir"));
        }
      });
    });
    const btnEmptyNova = document.getElementById("btn-empty-nova");
    if (btnEmptyNova) btnEmptyNova.addEventListener("click", abrirNovaRubrica);
    const btnLimpar = document.getElementById("btn-limpar-filtros");
    if (btnLimpar) btnLimpar.addEventListener("click", limparFiltros);
  }

  document.getElementById("f-busca").addEventListener("input", (e) => {
    state.busca = e.target.value;
    state.qtdVisivel = PAGE_SIZE;
    render();
  });
  document.getElementById("f-situacao").addEventListener("change", (e) => {
    state.situacao = e.target.value;
    state.qtdVisivel = PAGE_SIZE;
    render();
  });
  document.getElementById("f-tipo").addEventListener("change", (e) => {
    state.tipo = e.target.value;
    state.qtdVisivel = PAGE_SIZE;
    render();
  });
  document.getElementById("btn-mostrar-mais").addEventListener("click", () => {
    state.qtdVisivel += PAGE_SIZE;
    render();
  });
  document.getElementById("btn-nova-rubrica").addEventListener("click", abrirNovaRubrica);

  render();
})();
