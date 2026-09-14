/*
  Listagem de Sindicatos — busca somente por Nome (Razão Social), conforme
  especificação de UX aprovada §4. Sem filtros de status/tipo (nenhuma
  classificação equivalente a Ativas/Inativas ou Matriz/Filial existe na
  especificação para Sindicato — "não inventar filtro sem justificativa").

  "Novo sindicato" abre o Drawer compartilhado (js/sindicato-form.js) — o
  mesmo reaproveitado pela Tela do Sindicato para "Editar".
*/
(function () {
  const D = window.SindicatosData;
  const PAGE_SIZE = 25;

  const state = { busca: "", qtdVisivel: PAGE_SIZE };

  function correspondeABusca(sindicato, busca) {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return sindicato.nome.toLowerCase().includes(termo);
  }

  function abrirSindicato(codigo) {
    window.location.href = "sindicato.html?sindicato=" + encodeURIComponent(codigo);
  }

  function abrirNovoSindicato() {
    SindicatoFormSheet.abrirNovo(() => {
      state.busca = "";
      document.getElementById("f-busca").value = "";
      render();
    });
  }

  function rowHtml(s) {
    return (
      '<tr class="row-clickable" data-abrir="' + s.codigo + '" tabindex="0" role="button">' +
      '<td class="col-pad-sm">' + s.codigo + "</td>" +
      "<td>" + UI.truncatedCell(s.nome, null, "text-sm font-medium") + "</td>" +
      '<td class="col-pad-md">' + s.cnpj + "</td>" +
      '<td class="col-pad-md">' + s.tipoEntidade + "</td>" +
      '<td class="col-pad-md">' + s.cidade + "/" + s.uf + "</td>" +
      '<td class="col-pad-end">' + Icon("arrow-right", "size-4") + "</td>" +
      "</tr>"
    );
  }

  function render() {
    const todos = D.getSindicatos();
    const filtrados = todos
      .filter((s) => correspondeABusca(s, state.busca))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
    const visiveis = filtrados.slice(0, state.qtdVisivel);

    let html = "";
    if (filtrados.length === 0) {
      html =
        '<tr><td colspan="6" class="row-empty-state"><div class="flex flex-col items-center gap-2">' +
        (todos.length === 0
          ? '<span>Nenhum sindicato cadastrado.</span><button type="button" class="btn btn-sm" id="btn-empty-novo">' + Icon("plus", "size-3-5") + " Novo sindicato</button>"
          : '<span>Nenhum sindicato encontrado para a busca informada.</span><button type="button" class="btn-link link-info" id="btn-limpar-busca">Limpar busca</button>') +
        "</div></td></tr>";
    } else {
      html = visiveis.map(rowHtml).join("");
    }
    document.getElementById("tabela-sindicatos-body").innerHTML = html;

    const btnMais = document.getElementById("btn-mostrar-mais");
    if (filtrados.length > visiveis.length) {
      btnMais.style.display = "";
      btnMais.textContent = "Mostrar mais (" + (filtrados.length - visiveis.length) + " restantes)";
    } else {
      btnMais.style.display = "none";
    }

    wireRowEvents();
  }

  function wireRowEvents() {
    document.querySelectorAll("[data-abrir]").forEach((el) => {
      el.addEventListener("click", () => abrirSindicato(el.getAttribute("data-abrir")));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirSindicato(el.getAttribute("data-abrir"));
        }
      });
    });
    const btnEmptyNovo = document.getElementById("btn-empty-novo");
    if (btnEmptyNovo) btnEmptyNovo.addEventListener("click", abrirNovoSindicato);
    const btnLimpar = document.getElementById("btn-limpar-busca");
    if (btnLimpar) {
      btnLimpar.addEventListener("click", () => {
        state.busca = "";
        document.getElementById("f-busca").value = "";
        render();
      });
    }
  }

  document.getElementById("f-busca").addEventListener("input", (e) => {
    state.busca = e.target.value;
    state.qtdVisivel = PAGE_SIZE;
    render();
  });
  document.getElementById("btn-mostrar-mais").addEventListener("click", () => {
    state.qtdVisivel += PAGE_SIZE;
    render();
  });
  document.getElementById("btn-novo-sindicato").addEventListener("click", abrirNovoSindicato);

  render();
})();
