/*
  Listagem de sócios + drawer de novo/editar — linha inteira clicável com a
  mesma seta de abrir cadastro de empresas/js/list.js (row-clickable + ícone
  arrow-right em .col-pad-end). O drawer abre sempre editável: visualizar e
  editar são a mesma tela, sem alternância de modo.
*/
(function () {
  const D = window.SociosData;
  const E = window.EmpresasData;

  const state = { nome: "", cpf: "" };
  let socioAtualId = null;

  function apenasDigitos(v) {
    return (v || "").replace(/\D/g, "");
  }

  // ===== Listagem =====

  function socioCorrespondeAosFiltros(socio) {
    const nome = state.nome.trim().toLowerCase();
    const cpf = apenasDigitos(state.cpf);
    const nomeOk = !nome || socio.nome.toLowerCase().includes(nome);
    const cpfOk = !cpf || apenasDigitos(socio.cpf).includes(cpf);
    return nomeOk && cpfOk;
  }

  function empresasVinculadasHtml(socio) {
    const qtd = D.participacoesAtivas(socio).length;
    if (qtd === 0) return '<span class="text-sm text-muted">Nenhuma empresa</span>';
    return '<span class="badge badge-secondary">' + qtd + (qtd === 1 ? " empresa" : " empresas") + "</span>";
  }

  function rowHtml(socio) {
    return (
      '<tr class="row-clickable" data-abrir="' + socio.id + '">' +
      "<td>" + UI.truncatedCell(socio.nome, null, "text-sm font-medium") + "</td>" +
      '<td class="col-pad-md">' + socio.cpf + "</td>" +
      '<td class="col-pad-md">' + empresasVinculadasHtml(socio) + "</td>" +
      '<td class="col-pad-end">' + Icon("arrow-right", "size-4") + "</td>" +
      "</tr>"
    );
  }

  function render() {
    const socios = D.getSocios();
    const filtrados = socios.filter(socioCorrespondeAosFiltros).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
    const filtrosAtivos = state.nome.trim() !== "" || state.cpf.trim() !== "";

    let html;
    if (filtrados.length === 0) {
      html =
        '<tr><td colspan="4" class="row-empty-state"><div class="flex flex-col items-center gap-2">' +
        "<span>Nenhum sócio encontrado para os filtros selecionados.</span>" +
        (filtrosAtivos ? '<button type="button" id="btn-limpar-filtros" class="btn-link link-info">Limpar filtros</button>' : "") +
        "</div></td></tr>";
    } else {
      html = filtrados.map(rowHtml).join("");
    }

    document.getElementById("tabela-socios-body").innerHTML = html;
    wireRowEvents();
  }

  function wireRowEvents() {
    document.querySelectorAll("[data-abrir]").forEach((el) => {
      el.addEventListener("click", () => abrirDrawer(encontrarSocio(el.getAttribute("data-abrir"))));
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("keydown", (e) => {
        if (e.target !== el) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirDrawer(encontrarSocio(el.getAttribute("data-abrir")));
        }
      });
    });
    const btnLimpar = document.getElementById("btn-limpar-filtros");
    if (btnLimpar) {
      btnLimpar.addEventListener("click", () => {
        state.nome = "";
        state.cpf = "";
        document.getElementById("f-nome").value = "";
        document.getElementById("f-cpf").value = "";
        render();
      });
    }
  }

  function encontrarSocio(id) {
    return D.getSocios().find((s) => s.id === Number(id));
  }

  // ===== Drawer (novo / editar-e-visualizar) =====

  const campoNome = document.getElementById("socio-nome");
  const campoCpf = document.getElementById("socio-cpf");
  const campoEmail = document.getElementById("socio-email");
  const campoTelefone = document.getElementById("socio-telefone");
  const cpfErro = document.getElementById("socio-cpf-erro");
  const btnSalvar = document.getElementById("socio-salvar");
  const overlay = document.getElementById("socio-overlay");
  const panel = document.getElementById("socio-panel");

  function preencherCampos(socio) {
    campoNome.value = socio ? socio.nome : "";
    campoCpf.value = socio ? socio.cpf : "";
    campoEmail.value = socio && socio.email ? socio.email : "";
    campoTelefone.value = socio && socio.telefone ? socio.telefone : "";
  }

  // Cada participação vira um link real para o cadastro da empresa (aba
  // Dados gerais, de onde as demais abas ficam a um clique) — a mesma
  // pessoa clicada aqui é a fonte usada no combobox de Quadro Societário.
  function empresaVinculoRowHtml(participacao) {
    const empresa = E.findEmpresaByCodigo(participacao.empresaCodigo);
    const nomeEmpresa = empresa ? empresa.nome : participacao.empresaCodigo;
    return (
      '<div class="list-row">' +
      '<div class="flex flex-col gap-0-5 min-w-0">' +
      '<span class="text-sm font-medium truncate">' + nomeEmpresa + "</span>" +
      '<span class="text-xs text-muted">' + participacao.percentual + "% · " + (participacao.tipoSocio || "—") + "</span>" +
      "</div>" +
      (empresa
        ? '<a href="../empresas/dados-gerais.html?empresa=' + encodeURIComponent(empresa.codigo) + '" class="flex items-center gap-1 text-xs font-medium link-info shrink-0">Abrir cadastro ' + Icon("arrow-up-right", "size-3-5") + "</a>"
        : "") +
      "</div>"
    );
  }

  function mostrarEmpresasVinculadas(socio) {
    const grupo = document.getElementById("socio-grupo-empresas");
    if (!socio) {
      grupo.style.display = "none";
      return;
    }
    grupo.style.display = "";
    const ativas = D.participacoesAtivas(socio);
    document.getElementById("socio-empresas-lista").innerHTML =
      ativas.length === 0 ? '<span class="text-sm text-muted">Nenhuma empresa vinculada</span>' : ativas.map(empresaVinculoRowHtml).join("");
  }

  function validar() {
    const nomeOk = campoNome.value.trim().length > 0;
    const digitosCpf = campoCpf.value.replace(/\D/g, "");
    const cpfCompleto = digitosCpf.length === 11;
    const cpfDuplicado = cpfCompleto && D.cpfJaCadastrado(campoCpf.value, socioAtualId);
    cpfErro.style.display = cpfDuplicado ? "" : "none";
    btnSalvar.disabled = !(nomeOk && cpfCompleto && !cpfDuplicado);
  }

  function abrirDrawer(socio) {
    socioAtualId = socio ? socio.id : null;
    document.getElementById("socio-title").textContent = socio ? socio.nome : "Novo sócio";
    preencherCampos(socio);
    mostrarEmpresasVinculadas(socio);
    cpfErro.style.display = "none";
    validar();
    UI.openSheet(overlay, panel);
  }

  function fecharDrawer() {
    UI.closeSheet(overlay, panel);
  }

  function salvar() {
    const socios = D.getSocios();
    if (socioAtualId) {
      const atualizados = socios.map((s) =>
        s.id !== socioAtualId
          ? s
          : Object.assign({}, s, {
              nome: campoNome.value.trim(),
              cpf: campoCpf.value,
              email: campoEmail.value.trim(),
              telefone: campoTelefone.value.trim(),
            })
      );
      D.setSocios(atualizados);
      fecharDrawer();
      render();
      UI.showToast("Sócio atualizado", campoNome.value.trim() + " foi atualizado com sucesso.");
    } else {
      const novoId = socios.reduce((max, s) => Math.max(max, s.id), 0) + 1;
      socios.push({
        id: novoId,
        nome: campoNome.value.trim(),
        cpf: campoCpf.value,
        email: campoEmail.value.trim(),
        telefone: campoTelefone.value.trim(),
        participacoes: [],
      });
      D.setSocios(socios);
      fecharDrawer();
      render();
      UI.showToast("Sócio cadastrado", campoNome.value.trim() + " foi adicionado ao registro de sócios.");
    }
  }

  // ===== Setup =====

  D.ensureToast();
  document.getElementById("icon-plus").innerHTML = Icon("plus", "size-3-5");
  document.getElementById("socio-close").innerHTML = Icon("x", "size-4");

  document.getElementById("btn-novo-socio").addEventListener("click", () => abrirDrawer(null));
  document.getElementById("socio-close").addEventListener("click", fecharDrawer);
  document.getElementById("socio-cancelar").addEventListener("click", fecharDrawer);
  overlay.addEventListener("click", fecharDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("is-open")) fecharDrawer();
  });
  document.getElementById("socio-salvar").addEventListener("click", salvar);
  campoNome.addEventListener("input", validar);
  campoCpf.addEventListener("input", (e) => {
    e.target.value = D.formatarCpfInput(e.target.value);
    validar();
  });

  document.getElementById("f-nome").addEventListener("input", (e) => {
    state.nome = e.target.value;
    render();
  });
  document.getElementById("f-cpf").addEventListener("input", (e) => {
    e.target.value = D.formatarCpfInput(e.target.value);
    state.cpf = e.target.value;
    render();
  });

  render();
})();
