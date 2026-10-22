/*
  Listagem de sócios/responsáveis legais + drawer de novo/editar — linha
  inteira clicável com a mesma seta de abrir cadastro de empresas/js/list.js
  (row-clickable + ícone arrow-right em .col-pad-end). O drawer abre sempre
  editável: visualizar e editar são a mesma tela, sem alternância de modo.
*/
(function () {
  const D = window.SociosData;
  const E = window.EmpresasData;

  const state = { nome: "", cpf: "", tipo: "" };
  let socioAtualId = null;
  let tiposSelecionados = [];

  function apenasDigitos(v) {
    return (v || "").replace(/\D/g, "");
  }

  // ===== Listagem =====

  function socioCorrespondeAosFiltros(socio) {
    const nome = state.nome.trim().toLowerCase();
    const cpf = apenasDigitos(state.cpf);
    const nomeOk = !nome || socio.nome.toLowerCase().includes(nome);
    const cpfOk = !cpf || apenasDigitos(socio.cpf).includes(cpf);
    const tipoOk = !state.tipo || D.temTipo(socio, state.tipo);
    return nomeOk && cpfOk && tipoOk;
  }

  // Empresa onde a pessoa é sócia (participação ativa) e/ou responsável
  // legal conta uma vez só.
  function codigosEmpresasVinculadas(socio) {
    const codigos = D.participacoesAtivas(socio).map((p) => p.empresaCodigo);
    E.empresasDoResponsavelLegal(socio.id).forEach((e) => {
      if (!codigos.includes(e.codigo)) codigos.push(e.codigo);
    });
    return codigos;
  }

  function empresasVinculadasHtml(socio) {
    const qtd = codigosEmpresasVinculadas(socio).length;
    if (qtd === 0) return '<span class="text-sm text-muted">Nenhuma empresa</span>';
    return '<span class="badge badge-secondary">' + qtd + (qtd === 1 ? " empresa" : " empresas") + "</span>";
  }

  function rowHtml(socio) {
    return (
      '<tr class="row-clickable" data-abrir="' + socio.id + '">' +
      "<td>" + UI.truncatedCell(socio.nome, null, "text-sm font-medium") + "</td>" +
      '<td class="col-pad-md cell-mono">' + socio.cpf + "</td>" +
      '<td class="col-pad-md">' + (D.tiposLabel(socio) || "—") + "</td>" +
      '<td class="col-pad-md">' + empresasVinculadasHtml(socio) + "</td>" +
      '<td class="col-pad-end">' + Icon("arrow-right", "size-4") + "</td>" +
      "</tr>"
    );
  }

  function render() {
    const socios = D.getSocios();
    const filtrados = socios.filter(socioCorrespondeAosFiltros).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
    const filtrosAtivos = state.nome.trim() !== "" || state.cpf.trim() !== "" || state.tipo !== "";

    let html;
    if (filtrados.length === 0) {
      html =
        '<tr><td colspan="5" class="row-empty-state"><div class="flex flex-col items-center gap-2">' +
        "<span>Nenhum cadastro encontrado para os filtros selecionados.</span>" +
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
        state.tipo = "";
        document.getElementById("f-nome").value = "";
        document.getElementById("f-cpf").value = "";
        document.getElementById("f-tipo").value = "";
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

  // Uma linha por empresa, com o papel da pessoa nela (participação e/ou
  // responsável legal); o link abre a aba Sócios/Resp. legal da empresa.
  function empresaVinculoRowHtml(socio, codigo) {
    const empresa = E.findEmpresaByCodigo(codigo);
    const nomeEmpresa = empresa ? empresa.nome : codigo;
    const papeis = [];
    const participacao = D.participacoesAtivas(socio).find((p) => p.empresaCodigo === codigo);
    if (participacao) papeis.push("Sócio · " + participacao.percentual + "% · " + (participacao.tipoSocio || "—"));
    const rl = E.getResponsavelLegal(codigo);
    if (rl && rl.pessoa.id === socio.id) papeis.push("Resp. legal" + (rl.cargo ? " · " + rl.cargo : ""));
    return (
      '<div class="list-row">' +
      '<div class="flex flex-col gap-0-5 min-w-0">' +
      '<span class="text-sm font-medium truncate">' + nomeEmpresa + "</span>" +
      papeis.map((t) => '<span class="text-xs text-muted">' + t + "</span>").join("") +
      "</div>" +
      (empresa
        ? '<a href="../empresas/socios.html?empresa=' + encodeURIComponent(empresa.codigo) + '" class="flex items-center gap-1 text-xs font-medium link-info shrink-0">Abrir cadastro ' + Icon("arrow-up-right", "size-3-5") + "</a>"
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
    const codigos = codigosEmpresasVinculadas(socio);
    document.getElementById("socio-empresas-lista").innerHTML =
      codigos.length === 0
        ? '<span class="text-sm text-muted">Nenhuma empresa vinculada</span>'
        : codigos.map((c) => empresaVinculoRowHtml(socio, c)).join("");
  }

  // Tipo em uso não pode ser desmarcado: sócio com participação ativa ou
  // responsável legal de alguma empresa — sem isso, tabela e empresas
  // ficariam contraditórias (mesma lógica do bloqueio de exclusão com vínculo).
  function bloqueioDoTipo(socio, tipo) {
    if (!socio) return "";
    const qtd = tipo === D.TIPOS.SOCIO ? D.participacoesAtivas(socio).length : E.empresasDoResponsavelLegal(socio.id).length;
    if (!qtd) return "";
    const empresas = qtd + (qtd === 1 ? " empresa" : " empresas");
    return tipo === D.TIPOS.SOCIO
      ? "Sócio ativo em " + empresas + " — desvincule antes de remover este tipo."
      : "Responsável legal de " + empresas + " — troque o responsável antes de remover este tipo.";
  }

  // No formulário o rótulo vai por extenso; a coluna e o filtro usam TIPO_LABEL (abreviado).
  const TIPO_LABEL_COMPLETO = { socio: "Sócio", responsavelLegal: "Responsável legal" };

  function renderTipos(socio) {
    const container = document.getElementById("socio-tipos");
    container.innerHTML = [D.TIPOS.SOCIO, D.TIPOS.RESPONSAVEL_LEGAL]
      .map((tipo) => {
        const marcado = tiposSelecionados.includes(tipo);
        const bloqueio = marcado ? bloqueioDoTipo(socio, tipo) : "";
        return (
          '<label class="ucheckbox' + (bloqueio ? " is-disabled" : "") + '" data-tipo="' + tipo + '" tabindex="0" role="checkbox" aria-checked="' + marcado + '"' + (bloqueio ? ' aria-disabled="true"' : "") + ">" +
          '<span class="ucheckbox-box' + (marcado ? " is-checked" : "") + '">' + Icon("check", "size-4") + "</span>" +
          '<span class="ucheckbox-label">' + TIPO_LABEL_COMPLETO[tipo] + (bloqueio ? '<span class="ucheckbox-hint">' + bloqueio + "</span>" : "") + "</span>" +
          "</label>"
        );
      })
      .join("");
    container.querySelectorAll("[data-tipo]").forEach((el) => {
      function alternar(e) {
        e.preventDefault();
        if (el.classList.contains("is-disabled")) return;
        const tipo = el.getAttribute("data-tipo");
        tiposSelecionados = tiposSelecionados.includes(tipo) ? tiposSelecionados.filter((t) => t !== tipo) : tiposSelecionados.concat([tipo]);
        renderTipos(socio);
        validar();
        container.querySelector('[data-tipo="' + tipo + '"]').focus();
      }
      el.addEventListener("click", alternar);
      el.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") alternar(e);
      });
    });
  }

  function validar() {
    const nomeOk = campoNome.value.trim().length > 0;
    const digitosCpf = campoCpf.value.replace(/\D/g, "");
    const cpfCompleto = digitosCpf.length === 11;
    const cpfDuplicado = cpfCompleto && D.cpfJaCadastrado(campoCpf.value, socioAtualId);
    cpfErro.style.display = cpfDuplicado ? "" : "none";
    btnSalvar.disabled = !(nomeOk && cpfCompleto && !cpfDuplicado && tiposSelecionados.length > 0);
  }

  function abrirDrawer(socio) {
    socioAtualId = socio ? socio.id : null;
    document.getElementById("socio-title").textContent = socio ? socio.nome : "Novo cadastro";
    preencherCampos(socio);
    tiposSelecionados = socio ? (socio.tipos || []).slice() : [];
    renderTipos(socio);
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
              tipos: tiposSelecionados.slice(),
            })
      );
      D.setSocios(atualizados);
      fecharDrawer();
      render();
      UI.showToast("Cadastro atualizado", campoNome.value.trim() + " foi atualizado com sucesso.");
    } else {
      const novoId = socios.reduce((max, s) => Math.max(max, s.id), 0) + 1;
      socios.push({
        id: novoId,
        tipos: tiposSelecionados.slice(),
        nome: campoNome.value.trim(),
        cpf: campoCpf.value,
        email: campoEmail.value.trim(),
        telefone: campoTelefone.value.trim(),
        participacoes: [],
      });
      D.setSocios(socios);
      fecharDrawer();
      render();
      UI.showToast("Cadastro criado", campoNome.value.trim() + " foi adicionado ao registro de sócios e responsáveis legais.");
    }
  }

  // ===== Setup =====

  D.ensureToast();
  document.getElementById("icon-plus").innerHTML = Icon("plus", "size-3-5");
  document.getElementById("socio-close").innerHTML = Icon("x", "size-4");
  document.querySelector(".field-select-wrap .chev").innerHTML = Icon("chevron-down", "size-4");

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
  document.getElementById("f-tipo").addEventListener("change", (e) => {
    state.tipo = e.target.value;
    render();
  });

  render();
})();
