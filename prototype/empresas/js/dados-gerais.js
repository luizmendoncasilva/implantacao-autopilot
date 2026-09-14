/*
  Aba "Dados gerais" — portado de DadosGeraisCard.jsx + DadosGeraisEmpresa.jsx +
  HistoricoEmpresa.jsx + CertificadoDigital.jsx (Identificação, Inscrições,
  Contato e localização, Relacionamento, Complementares).
*/
(function () {
  const D = window.EmpresasData;

  function campo(label, value, wide) {
    return (
      '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '">' +
      '<span class="detail-field-label">' + label + "</span>" +
      '<div class="detail-field-value">' + value + "</div>" +
      "</div>"
    );
  }
  function secao(titulo, camposHtml) {
    return (
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">' + titulo + "</h3>" +
      '<div class="detail-grid">' + camposHtml + "</div>" +
      "</div>"
    );
  }

  // Grupo de Empresas — único campo editável dentro de Dados Gerais (o
  // restante da aba é somente leitura, espelho do Cockpit). É apenas um
  // agrupamento operacional (filtros/relatórios/comunicação futuros),
  // diferente de matriz/filial e de Empresa Centralizadora — por isso não
  // reaproveita CENTRALIZACAO_INICIAL nem cria vínculo entre empresas, só um
  // texto livre salvo por empresa (ver docs/cadastro-empresas-spec.md).
  function campoGrupoEmpresas(empresa) {
    const valor = empresa.dadosGerais.grupoEmpresas || "";
    const valorHtml = valor
      ? '<span id="grupo-empresas-valor">' + valor + "</span>"
      : '<span id="grupo-empresas-valor" class="italic text-muted">Nenhum grupo definido</span>';
    return (
      '<div class="detail-field" id="campo-grupo-empresas">' +
      '<span class="detail-field-label">Grupo de empresas</span>' +
      '<div class="detail-field-value flex items-center gap-2" id="grupo-empresas-view">' +
      valorHtml +
      '<button type="button" class="btn-link" id="btn-editar-grupo-empresas" style="color:var(--info-text);">editar</button>' +
      "</div>" +
      '<div class="flex items-center gap-2" id="grupo-empresas-edit" style="display:none;">' +
      '<input class="field-input" id="input-grupo-empresas" value="' + valor.replace(/"/g, "&quot;") + '" placeholder="Nome do grupo de empresas" />' +
      '<button type="button" class="btn-link" id="btn-salvar-grupo-empresas" style="color:var(--info-text);">salvar</button>' +
      '<button type="button" class="btn-link" id="btn-cancelar-grupo-empresas">cancelar</button>' +
      "</div>" +
      "</div>"
    );
  }

  // Contador Responsável — ação genérica de seleção/alteração, provisória
  // (ver docs/cadastro-empresas-spec.md, pendência "Contador Responsável"):
  // reutiliza o mesmo Registro de Contadores já usado pela aba Contadores
  // (empresas/js/contadores.js), sem criar um segundo cadastro. Mesmo padrão
  // visual de sheet + combobox já usado para "Vincular contador" naquela
  // aba. Não exige vínculo prévio via Contadores nem resolve prioridade
  // entre múltiplos contadores — essas regras permanecem em aberto.
  function campoContadorResponsavel(empresa) {
    const contador = D.resolveContadorResponsavel(empresa.codigo);
    const conteudo = contador
      ? '<span>' + contador.nome + " — " + contador.crc + "</span>" +
        '<a href="contadores.html?empresa=' + encodeURIComponent(empresa.codigo) + '" class="flex items-center gap-1 text-xs font-medium link-info">Ver em Contadores ' + Icon("arrow-right", "size-3-5") + "</a>" +
        '<button type="button" class="btn-link" id="btn-alterar-contador-responsavel" style="color:var(--info-text);">Alterar</button>'
      : '<span class="italic text-muted">Nenhum contador responsável definido</span>' +
        '<button type="button" class="btn-link" id="btn-alterar-contador-responsavel" style="color:var(--info-text);">Selecionar contador</button>';
    return (
      '<div class="detail-field detail-field-wide" id="campo-contador-responsavel">' +
      '<span class="detail-field-label">Contador responsável</span>' +
      '<div class="detail-field-value flex items-center gap-2 flex-wrap">' + conteudo + "</div>" +
      "</div>"
    );
  }

  let contadorResponsavelSelecionadoId = "";

  function contadorResponsavelOptions() {
    const contadores = window.ContadoresData ? window.ContadoresData.getContadores() : [];
    return contadores.map((c) => ({ value: String(c.id), label: c.nome + " — " + c.crc }));
  }

  function abrirSelecaoContadorResponsavel(empresa) {
    const atual = D.resolveContadorResponsavel(empresa.codigo);
    contadorResponsavelSelecionadoId = atual ? String(atual.id) : "";
    document.getElementById("cr-salvar").disabled = !contadorResponsavelSelecionadoId;
    UI.initCombobox(document.getElementById("cr-combobox"), contadorResponsavelOptions(), contadorResponsavelSelecionadoId, (value) => {
      contadorResponsavelSelecionadoId = value;
      document.getElementById("cr-salvar").disabled = !value;
    });
    UI.openSheet(document.getElementById("cr-overlay"), document.getElementById("cr-panel"));
  }

  function fecharSelecaoContadorResponsavel() {
    UI.closeSheet(document.getElementById("cr-overlay"), document.getElementById("cr-panel"));
  }

  function salvarContadorResponsavel(empresa) {
    if (!contadorResponsavelSelecionadoId) return;
    const contadorId = Number(contadorResponsavelSelecionadoId);
    EmpresaDetailShell.confirmarReflexoCockpit(
      () => {
        D.setContadorResponsavel(empresa.codigo, contadorId);
        fecharSelecaoContadorResponsavel();
        window.renderTabContent(empresa);
        UI.showToast("Contador responsável atualizado e sincronizado com o Cockpit", "O contador responsável de " + empresa.nome + " foi atualizado.");
      },
      () => {
        fecharSelecaoContadorResponsavel();
        UI.showToast("Alteração descartada", "Nenhuma alteração foi salva para " + empresa.nome + ".", "info");
      }
    );
  }

  let contadorResponsavelSheetWired = false;
  // Empresa da renderização mais recente — o sheet é criado uma única vez
  // (mesmo padrão do drawer "Editar empresa" acima), então o listener de
  // "Salvar" precisa ler a empresa em vigor no momento do clique, não a que
  // existia quando o listener foi registrado.
  let empresaContadorResponsavel = null;

  function wireContadorResponsavel(empresa) {
    empresaContadorResponsavel = empresa;
    const btn = document.getElementById("btn-alterar-contador-responsavel");
    if (btn) btn.addEventListener("click", () => abrirSelecaoContadorResponsavel(empresa));

    if (contadorResponsavelSheetWired) return;
    contadorResponsavelSheetWired = true;
    document.getElementById("cr-close").innerHTML = Icon("x", "size-4");
    document.querySelector("#cr-combobox .chev").innerHTML = Icon("chevron-down", "size-4");
    document.querySelector("#cr-combobox .search-icon").innerHTML = Icon("search", "size-4");
    document.getElementById("cr-overlay").addEventListener("click", fecharSelecaoContadorResponsavel);
    document.getElementById("cr-close").addEventListener("click", fecharSelecaoContadorResponsavel);
    document.getElementById("cr-cancelar").addEventListener("click", fecharSelecaoContadorResponsavel);
    document.getElementById("cr-salvar").addEventListener("click", () => salvarContadorResponsavel(empresaContadorResponsavel));
  }

  function wireGrupoEmpresas(empresa) {
    const view = document.getElementById("grupo-empresas-view");
    const edit = document.getElementById("grupo-empresas-edit");
    const input = document.getElementById("input-grupo-empresas");

    document.getElementById("btn-editar-grupo-empresas").addEventListener("click", () => {
      view.style.display = "none";
      edit.style.display = "";
      input.focus();
    });
    document.getElementById("btn-cancelar-grupo-empresas").addEventListener("click", () => {
      input.value = empresa.dadosGerais.grupoEmpresas || "";
      edit.style.display = "none";
      view.style.display = "";
    });
    document.getElementById("btn-salvar-grupo-empresas").addEventListener("click", () => {
      const valor = input.value.trim();
      D.setGrupoEmpresas(empresa.codigo, valor);
      window.renderTabContent(empresa);
      UI.showToast("Grupo de empresas salvo", "O grupo de " + empresa.nome + " foi atualizado.");
    });
  }

  // Drawer "Editar empresa" — cobre só os campos hoje espelhados do Cockpit
  // nesta aba (Identificação, Inscrições, Contato e localização,
  // Complementares). CNPJ, Certificado digital, Contador responsável e
  // Contrato ficam bloqueados no drawer (ver detail-common.js e
  // sheet-field-locked-value em components.css). "Grupo de empresas" não
  // entra aqui — continua com sua própria edição inline (campoGrupoEmpresas
  // acima), por ser um dado nativo do Autopilot, não um espelho do Cockpit.
  let empresaAtual = null;
  let drawerWired = false;

  // Catálogo do Select de Regime tributário federal — montado uma única vez
  // a partir de EmpresasData.REGIME_TRIBUTARIO_FEDERAL_OPCOES (fonte única do
  // catálogo, compartilhável futuramente com Fiscal/Contábil). Regimes fora
  // do escopo atual (todos exceto Simples Nacional) permanecem visíveis,
  // porém com `disabled`, para não serem selecionáveis. Se o valor atual da
  // empresa não constar no catálogo (dado legado/mock), ele é adicionado como
  // opção extra desabilitada, só para não quebrar a exibição do valor salvo.
  function preencherOpcoesRegimeTributario(valorAtual) {
    const select = document.getElementById("edit-regime-tributario");
    const opcoes = D.REGIME_TRIBUTARIO_FEDERAL_OPCOES;
    const existeNoCatalogo = opcoes.some((o) => o.value === valorAtual);
    const lista = existeNoCatalogo || !valorAtual ? opcoes : opcoes.concat([{ value: valorAtual, disabled: true }]);
    select.innerHTML = lista
      .map((o) => '<option value="' + o.value + '"' + (o.disabled ? " disabled" : "") + ">" + o.value + "</option>")
      .join("");
  }

  function preencherDrawer(empresa) {
    const dg = empresa.dadosGerais;
    const contador = D.resolveContadorResponsavel(empresa.codigo);
    document.getElementById("edit-razao-social").value = dg.razaoSocial || "";
    document.getElementById("edit-nome-fantasia").value = dg.nomeFantasia || "";
    document.getElementById("edit-natureza-juridica").value = dg.naturezaJuridica || "";
    document.getElementById("edit-cnpj-locked").innerHTML = Icon("lock", "size-3-5") + "<span>" + dg.cnpj + "</span>";
    preencherOpcoesRegimeTributario(dg.regimeTributarioFederal);
    document.getElementById("edit-regime-tributario").value = dg.regimeTributarioFederal || "";
    document.getElementById("edit-ie").value = dg.ie || "";
    document.getElementById("edit-im").value = dg.im || "";
    document.getElementById("edit-telefone").value = dg.telefone || "";
    document.getElementById("edit-email").value = dg.email || "";
    document.getElementById("edit-logradouro").value = dg.logradouro || "";
    document.getElementById("edit-numero").value = dg.numero || "";
    document.getElementById("edit-complemento").value = dg.complemento || "";
    document.getElementById("edit-bairro").value = dg.bairro || "";
    document.getElementById("edit-municipio").value = dg.municipio || "";
    document.getElementById("edit-uf").value = dg.uf || "";
    document.getElementById("edit-cep").value = dg.cep || "";
    document.getElementById("edit-contador-locked").innerHTML =
      Icon("lock", "size-3-5") + "<span>" + (contador ? contador.nome + " — " + contador.crc : "Nenhum contador responsável definido") + "</span>";
    document.getElementById("edit-contrato-locked").innerHTML =
      Icon("lock", "size-3-5") +
      "<span>Cliente desde " + dg.clienteDesde + " · " + (dg.statusCliente === "ativo" ? "Ativa" : "Inativa") + " · " + dg.duracaoContrato + "</span>";
    document.getElementById("edit-certificado-locked").innerHTML = Icon("lock", "size-3-5") + "<span>" + dg.certificadoDigital + "</span>";
    document.getElementById("edit-observacoes").value = dg.observacoesGerais || "";
  }

  function abrirEdicaoEmpresa(empresa) {
    empresaAtual = empresa;
    preencherDrawer(empresa);
    UI.openSheet(document.getElementById("edit-empresa-overlay"), document.getElementById("edit-empresa-panel"));
  }

  function fecharDrawerEdicao() {
    UI.closeSheet(document.getElementById("edit-empresa-overlay"), document.getElementById("edit-empresa-panel"));
  }

  function coletarValoresDrawer() {
    return {
      razaoSocial: document.getElementById("edit-razao-social").value.trim(),
      nomeFantasia: document.getElementById("edit-nome-fantasia").value.trim(),
      naturezaJuridica: document.getElementById("edit-natureza-juridica").value.trim(),
      regimeTributarioFederal: document.getElementById("edit-regime-tributario").value.trim(),
      ie: document.getElementById("edit-ie").value.trim(),
      im: document.getElementById("edit-im").value.trim(),
      telefone: document.getElementById("edit-telefone").value.trim(),
      email: document.getElementById("edit-email").value.trim(),
      logradouro: document.getElementById("edit-logradouro").value.trim(),
      numero: document.getElementById("edit-numero").value.trim(),
      complemento: document.getElementById("edit-complemento").value.trim(),
      bairro: document.getElementById("edit-bairro").value.trim(),
      municipio: document.getElementById("edit-municipio").value.trim(),
      uf: document.getElementById("edit-uf").value.trim(),
      cep: document.getElementById("edit-cep").value.trim(),
      observacoesGerais: document.getElementById("edit-observacoes").value.trim(),
    };
  }

  function salvarEdicaoEmpresa() {
    const novosValores = coletarValoresDrawer();
    EmpresaDetailShell.confirmarReflexoCockpit(
      () => {
        D.setDadosGeraisEmpresa(empresaAtual.codigo, novosValores);
        fecharDrawerEdicao();
        window.renderTabContent(empresaAtual);
        UI.showToast("Alterações salvas e sincronizadas com o Cockpit", "Os dados de " + empresaAtual.nome + " foram atualizados.");
      },
      () => {
        fecharDrawerEdicao();
        UI.showToast("Alterações descartadas", "Nenhuma alteração foi salva para " + empresaAtual.nome + ".", "info");
      }
    );
  }

  function wireDrawerEdicao() {
    if (drawerWired) return;
    drawerWired = true;
    document.getElementById("edit-empresa-close").innerHTML = Icon("x", "size-4");
    document.querySelector("#edit-empresa-panel .field-select-wrap .chev").innerHTML = Icon("chevron-down", "size-4");
    document.getElementById("edit-empresa-overlay").addEventListener("click", fecharDrawerEdicao);
    document.getElementById("edit-empresa-close").addEventListener("click", fecharDrawerEdicao);
    document.getElementById("edit-empresa-cancelar").addEventListener("click", fecharDrawerEdicao);
    document.getElementById("edit-empresa-salvar").addEventListener("click", salvarEdicaoEmpresa);
  }

  window.abrirEdicaoEmpresa = abrirEdicaoEmpresa;

  window.renderTabContent = function (empresa) {
    wireDrawerEdicao();
    const dg = empresa.dadosGerais;

    const identificacao = secao(
      "Identificação",
      campo("Razão social", dg.razaoSocial, true) +
        campo("Nome fantasia", dg.nomeFantasia) +
        campoGrupoEmpresas(empresa) +
        campo("Natureza jurídica", dg.naturezaJuridica) +
        campo("CNPJ", dg.cnpj) +
        campo("Regime tributário federal", dg.regimeTributarioFederal)
    );
    const inscricoes = secao("Inscrições", campo("Inscrição estadual", dg.ie) + campo("Inscrição municipal", dg.im));
    const contato = secao(
      "Contato e localização",
      campo("Telefone", dg.telefone) + campo("E-mail", dg.email) + campo("Endereço completo", D.formatarEndereco(dg), true)
    );

    // Separado de "Contrato" (decisão de UX: eram 6 campos de dois assuntos
    // diferentes sob um único rótulo "Relacionamento").
    const contadorResponsavel = secao("Contador responsável", campoContadorResponsavel(empresa));
    const contrato = secao(
      "Contrato",
      campo("Cliente desde", dg.clienteDesde) +
        campo("Status do cliente", D.situacaoBadge(dg)) +
        campo("Início de atividade", dg.inicioAtividade) +
        (dg.statusCliente === "inativo" ? campo("Data de inativação", dg.dataInativacao) : "") +
        campo("Duração do contrato", dg.duracaoContrato)
    );

    const complementares = secao(
      "Complementares",
      campo("Certificado digital", dg.certificadoDigital) +
        campo("Observações gerais", dg.observacoesGerais || '<span class="italic text-muted">Nenhuma observação cadastrada.</span>', true)
    );

    document.getElementById("tab-content").innerHTML =
      '<div class="card">' +
      '<div class="card-header"><div class="card-title">Dados gerais</div></div>' +
      '<div class="card-content flex flex-col gap-6">' +
      identificacao + inscricoes + contato + contadorResponsavel + contrato + complementares +
      "</div>" +
      "</div>";

    wireGrupoEmpresas(empresa);
    wireContadorResponsavel(empresa);
  };
})();
