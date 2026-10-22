/*
  Aba "Contábil × Fiscal" — implementação de conteúdo, exclusiva da trilha
  Fiscal. MVP (docs/02-parametros-fiscais.md, seção 10, campos Essenciais):
  "Gerar lançamentos contábeis automaticamente", "Tipo de lançamento
  contábil" e "Conta cliente/fornecedor em pagamento à vista" (Regra
  fixa/Sistema, somente leitura) + "Classificação de conta — Fornecedores"
  e "Classificação de conta — Clientes" (Manual, lista suspensa, dicionário
  D27).

  Rodada de complementação de conteúdo (docs/02-parametros-fiscais.md,
  seção 10, campos Desejável) adiciona: "Cupom fiscal pelo valor total",
  "Separar frete, pedágio, seguro, despesas e desconto" e "Separar IPI e
  ICMS ST das entradas" (Checkbox, Manual) + "Controle de estoque" (D29,
  Lista suspensa, Manual). Fora de escopo (créditos PIS/COFINS, honorários
  variáveis, Reduções Z/CFE) NÃO são implementados.

  "Ajuste a Valor Presente (AVP)", "Mostrar rateio de centro de custos" e
  "Gerar lançamentos em outra empresa" (rodada "Ajuste funcional —
  Contábil × Fiscal", 2026-09-09): documentados como Fase 2, mas tornados
  **funcionais** por decisão explícita de produto desta rodada —
  Checkbox/Manual/drawer, mesmo padrão exato dos 3 checkboxes já
  funcionais desta aba (Cupom fiscal/Separar frete/Separar IPI-ICMS ST),
  sem nenhuma indicação visual de Fase 2. A prioridade documentada não
  mudou — só a representação/interatividade na interface. Nenhuma regra
  de negócio decorrente da ativação foi criada (cálculo de AVP, lógica de
  rateio, geração de lançamentos em outra empresa) — apenas o booleano de
  habilitação, persistido e registrado no Histórico.

  Estrutura (docs/parametros-fiscais-arquitetura.md, seção 4.5:
  "distinguir visualmente o que é regra fixa ... do que é efetivamente
  configurável"): três .detail-section dentro de um único .card, sem
  accordion — "Regras do sistema" (as 3 regra fixa), "Classificação de
  conta" (as 2 listas suspensas Manual do MVP) e "Lançamentos e estoque"
  (os 7 campos Manual desta e da rodada anterior).

  Jornada de edição dos campos Manual (correção de arquitetura — rodada
  de "Jornada de Edição", revisada): Drawer lateral, não edição inline no
  card. Mesmo padrão de referência usado em gerais.js/estaduais-
  municipais.js (SindicatoFormSheet / drawer "Editar empresa" de
  Empresas): "Editar" no cabeçalho do card (visível só na vigência atual)
  abre um sheet lateral preenchido; o card em si permanece 100% somente
  leitura. "Regras do sistema" não é afetado — nunca aparece no drawer
  como editável.

  Reaproveita FiscalGerais.renderNaoAplicavel para o mesmo gate de "empresa
  não optante pelo Simples Nacional" já usado por Gerais, Federais e
  Estaduais e Municipais.
*/
(function (global) {
  const ORIGENS = global.OrigemBadge.ORIGENS;

  function renderConteudo(empresa, isReadOnly, vigenciaId) {
    if (!empresa.optanteSimples) return global.FiscalGerais.renderNaoAplicavel(empresa, "Contábil × Fiscal");

    const dados = global.FiscalContabilFiscalData.getDados(empresa.codigo, vigenciaId);

    // Regra fixa/Sistema: nunca editável, em nenhuma vigência — o texto
    // exibido é a própria regra fixa documentada (docs/02-parametros-fiscais.md,
    // seção 10), não um valor por empresa.
    const secaoRegrasSistema =
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Regras do sistema</h3>' +
      '<div class="detail-grid">' +
      global.CampoOrigem.campo({
        label: "Gerar lançamentos contábeis automaticamente",
        value: "Entradas, Saídas e Serviços geram lançamento automático nos três departamentos.",
        origem: ORIGENS.SISTEMA,
        wide: true,
      }) +
      global.CampoOrigem.campo({
        label: "Tipo de lançamento contábil",
        value: "Analítico, na data do movimento.",
        origem: ORIGENS.SISTEMA,
      }) +
      global.CampoOrigem.campo({
        label: "Conta cliente/fornecedor em pagamento à vista",
        value: "Evita conta transitória quando não há parcelamento.",
        origem: ORIGENS.SISTEMA,
        wide: true,
      }) +
      "</div></div>";

    const secaoClassificacaoConta =
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Classificação de conta</h3>' +
      '<div class="detail-grid">' +
      global.CampoOrigem.campo({ label: "Classificação de conta — Fornecedores", value: dados.classificacaoContaFornecedores, origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "select-classificacao-fornecedores" }) +
      global.CampoOrigem.campo({ label: "Classificação de conta — Clientes", value: dados.classificacaoContaClientes, origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "select-classificacao-clientes" }) +
      "</div></div>";

    // Rodada de complementação de conteúdo (docs/02-parametros-fiscais.md,
    // seção 10, campos Desejável): 3 checkboxes + 1 select (D29), mesmo
    // padrão Manual das demais abas.
    const secaoLancamentosDetalhados =
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Lançamentos e estoque</h3>' +
      '<div class="detail-grid">' +
      global.CampoOrigem.campo({ label: "Cupom fiscal pelo valor total", value: dados.cupomFiscalValorTotal ? "Ativo" : "Inativo", origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "checkbox-cupom-fiscal-valor-total" }) +
      global.CampoOrigem.campo({ label: "Separar frete, pedágio, seguro, despesas e desconto", value: dados.separarFretePedagioSeguroDespesaDesconto ? "Ativo" : "Inativo", origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "checkbox-separar-frete-pedagio", wide: true }) +
      global.CampoOrigem.campo({ label: "Separar IPI e ICMS ST das entradas", value: dados.separarIpiIcmsStEntradas ? "Ativo" : "Inativo", origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "checkbox-separar-ipi-icms-st" }) +
      global.CampoOrigem.campo({ label: "Controle de estoque", value: dados.controleEstoque, origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "select-controle-estoque" }) +
      global.CampoOrigem.campo({ label: "Ajuste a Valor Presente (AVP)", value: dados.ajusteValorPresente ? "Habilitado" : "Inativo", origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "checkbox-avp" }) +
      global.CampoOrigem.campo({ label: "Mostrar rateio de centro de custos", value: dados.mostrarRateioCentroCustos ? "Habilitado" : "Inativo", origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "checkbox-rateio-centro-custos" }) +
      global.CampoOrigem.campo({ label: "Gerar lançamentos em outra empresa", value: dados.gerarLancamentosOutraEmpresa ? "Habilitado" : "Inativo", origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "checkbox-outra-empresa" }) +
      "</div></div>";

    return (
      '<div class="card">' +
      '<div class="card-header">' +
      '<div class="card-title">Contábil × Fiscal</div>' +
      '<div class="card-description">Parâmetro fiscal que impacta como o contábil lança as operações — bloco transversal, mantido em Parâmetros Fiscais por decisão de produto.</div>' +
      "</div>" +
      '<div class="card-content flex flex-col gap-6">' +
      secaoRegrasSistema + secaoClassificacaoConta + secaoLancamentosDetalhados +
      "</div></div>"
    );
  }

  // ===== Drawer "Editar Contábil × Fiscal" =====
  function sheetMarkupCF() {
    return (
      '<div class="sheet-overlay" id="cf-manual-overlay"></div>' +
      '<div class="sheet-panel" id="cf-manual-panel" role="dialog" aria-modal="true" aria-labelledby="cf-manual-title">' +
      '<button type="button" class="sheet-close" id="cf-manual-close">' + Icon("x", "size-4") + "</button>" +
      '<div class="sheet-header">' +
      '<div class="sheet-title" id="cf-manual-title">Editar Contábil × Fiscal</div>' +
      '<div class="sheet-description">Altere os parâmetros de origem Manual desta aba. As regras do sistema são exibidas apenas para contexto e não podem ser alteradas por aqui.</div>' +
      "</div>" +
      '<div class="sheet-body" id="cf-manual-body" style="padding-bottom:16px;"></div>' +
      '<div class="sheet-footer">' +
      '<button type="button" class="btn btn-outline" id="cf-manual-cancelar">Cancelar</button>' +
      '<button type="button" class="btn" id="cf-manual-salvar">Salvar</button>' +
      "</div>" +
      "</div>"
    );
  }

  function ensureDrawerCF() {
    if (document.getElementById("cf-manual-panel")) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = sheetMarkupCF();
    while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);

    document.getElementById("cf-manual-overlay").addEventListener("click", fecharDrawerCF);
    document.getElementById("cf-manual-close").addEventListener("click", fecharDrawerCF);
    document.getElementById("cf-manual-cancelar").addEventListener("click", fecharDrawerCF);
    document.getElementById("cf-manual-salvar").addEventListener("click", salvarDrawerCF);
  }

  function selectEdit(id, valor, opcoes) {
    const optsHtml = opcoes.map((o) => '<option value="' + o + '"' + (valor === o ? " selected" : "") + ">" + o + "</option>").join("");
    return (
      '<div class="field-select-wrap"><select class="field-select" id="' + id + '">' + optsHtml + "</select>" +
      '<span class="chev">' + Icon("chevron-down", "size-4") + "</span></div>"
    );
  }

  function campoBloqueado(label, valor) {
    return (
      '<div class="sheet-field">' +
      '<label class="field-label">' + label + "</label>" +
      '<div class="sheet-field-locked-value">' + Icon("lock", "size-3-5") + "<span>" + valor + "</span></div>" +
      "</div>"
    );
  }

  function checkboxEdit(id, label, checked) {
    return (
      '<div class="sheet-field">' +
      '<label class="ucheckbox" id="' + id + '"><span class="ucheckbox-box' + (checked ? " is-checked" : "") + '">' + Icon("check", "size-4") + '</span><span class="ucheckbox-label">' + label + "</span></label>" +
      "</div>"
    );
  }

  function wireCheckbox(id) {
    document.getElementById(id).addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#" + id + " .ucheckbox-box").classList.toggle("is-checked");
    });
  }

  function preencherDrawerCF(empresa, vigenciaId) {
    const dados = global.FiscalContabilFiscalData.getDados(empresa.codigo, vigenciaId);
    document.getElementById("cf-manual-body").innerHTML =
      campoBloqueado("Gerar lançamentos contábeis automaticamente", "Entradas, Saídas e Serviços geram lançamento automático nos três departamentos.") +
      campoBloqueado("Tipo de lançamento contábil", "Analítico, na data do movimento.") +
      campoBloqueado("Conta cliente/fornecedor em pagamento à vista", "Evita conta transitória quando não há parcelamento.") +
      '<div class="sheet-field"><label class="field-label" for="select-classificacao-fornecedores">Classificação de conta — Fornecedores</label>' +
      selectEdit("select-classificacao-fornecedores", dados.classificacaoContaFornecedores, global.FiscalContabilFiscalData.OPCOES_CLASSIFICACAO_CONTA) +
      "</div>" +
      '<div class="sheet-field"><label class="field-label" for="select-classificacao-clientes">Classificação de conta — Clientes</label>' +
      selectEdit("select-classificacao-clientes", dados.classificacaoContaClientes, global.FiscalContabilFiscalData.OPCOES_CLASSIFICACAO_CONTA) +
      "</div>" +
      checkboxEdit("checkbox-cupom-fiscal-valor-total", "Cupom fiscal pelo valor total", dados.cupomFiscalValorTotal) +
      checkboxEdit("checkbox-separar-frete-pedagio", "Separar frete, pedágio, seguro, despesas e desconto", dados.separarFretePedagioSeguroDespesaDesconto) +
      checkboxEdit("checkbox-separar-ipi-icms-st", "Separar IPI e ICMS ST das entradas", dados.separarIpiIcmsStEntradas) +
      '<div class="sheet-field"><label class="field-label" for="select-controle-estoque">Controle de estoque</label>' +
      selectEdit("select-controle-estoque", dados.controleEstoque, global.FiscalContabilFiscalData.OPCOES_CONTROLE_ESTOQUE) +
      "</div>" +
      checkboxEdit("checkbox-avp", "Ajuste a Valor Presente (AVP)", dados.ajusteValorPresente) +
      checkboxEdit("checkbox-rateio-centro-custos", "Mostrar rateio de centro de custos", dados.mostrarRateioCentroCustos) +
      checkboxEdit("checkbox-outra-empresa", "Gerar lançamentos em outra empresa", dados.gerarLancamentosOutraEmpresa);

    wireCheckbox("checkbox-cupom-fiscal-valor-total");
    wireCheckbox("checkbox-separar-frete-pedagio");
    wireCheckbox("checkbox-separar-ipi-icms-st");
    wireCheckbox("checkbox-avp");
    wireCheckbox("checkbox-rateio-centro-custos");
    wireCheckbox("checkbox-outra-empresa");
  }

  let empresaDrawerCF = null;
  let vigenciaDrawerCF = null;
  let onSalvarDrawerCF = null;

  // Ver equivalente comentado em gerais.js.
  function focarCampoDrawer(focusId) {
    if (!focusId) return;
    const el = document.getElementById(focusId);
    if (!el) return;
    if (typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "center" });
    if (typeof el.focus === "function") el.focus();
  }

  function abrirDrawerCF(empresa, vigenciaId, onSalvar, focusId) {
    ensureDrawerCF();
    empresaDrawerCF = empresa;
    vigenciaDrawerCF = vigenciaId;
    onSalvarDrawerCF = onSalvar;
    preencherDrawerCF(empresa, vigenciaId);
    UI.openSheet(document.getElementById("cf-manual-overlay"), document.getElementById("cf-manual-panel"));
    focarCampoDrawer(focusId);
  }

  function fecharDrawerCF() {
    UI.closeSheet(document.getElementById("cf-manual-overlay"), document.getElementById("cf-manual-panel"));
  }

  // Rótulos dos 2 campos Manual desta aba, para o Histórico de Alterações
  // (docs/parametros-fiscais-as-built.md, "Vigência Funcional") — só para
  // o diff do evento, sem relação com a renderização do card/drawer.
  const LABELS_HISTORICO_CF = {
    classificacaoContaFornecedores: "Classificação de conta — Fornecedores",
    classificacaoContaClientes: "Classificação de conta — Clientes",
    cupomFiscalValorTotal: "Cupom fiscal pelo valor total",
    separarFretePedagioSeguroDespesaDesconto: "Separar frete, pedágio, seguro, despesas e desconto",
    separarIpiIcmsStEntradas: "Separar IPI e ICMS ST das entradas",
    controleEstoque: "Controle de estoque",
    ajusteValorPresente: "Ajuste a Valor Presente (AVP)",
    mostrarRateioCentroCustos: "Mostrar rateio de centro de custos",
    gerarLancamentosOutraEmpresa: "Gerar lançamentos em outra empresa",
  };

  const FORMATADORES_HISTORICO_CF = {
    cupomFiscalValorTotal: (v) => (v ? "Ativo" : "Inativo"),
    separarFretePedagioSeguroDespesaDesconto: (v) => (v ? "Ativo" : "Inativo"),
    separarIpiIcmsStEntradas: (v) => (v ? "Ativo" : "Inativo"),
    ajusteValorPresente: (v) => (v ? "Habilitado" : "Inativo"),
    mostrarRateioCentroCustos: (v) => (v ? "Habilitado" : "Inativo"),
    gerarLancamentosOutraEmpresa: (v) => (v ? "Habilitado" : "Inativo"),
  };

  function salvarDrawerCF() {
    const anterior = global.FiscalContabilFiscalData.getDados(empresaDrawerCF.codigo, vigenciaDrawerCF);
    const novosValores = {
      classificacaoContaFornecedores: document.getElementById("select-classificacao-fornecedores").value,
      classificacaoContaClientes: document.getElementById("select-classificacao-clientes").value,
      cupomFiscalValorTotal: document.querySelector("#checkbox-cupom-fiscal-valor-total .ucheckbox-box").classList.contains("is-checked"),
      separarFretePedagioSeguroDespesaDesconto: document.querySelector("#checkbox-separar-frete-pedagio .ucheckbox-box").classList.contains("is-checked"),
      separarIpiIcmsStEntradas: document.querySelector("#checkbox-separar-ipi-icms-st .ucheckbox-box").classList.contains("is-checked"),
      controleEstoque: document.getElementById("select-controle-estoque").value,
      ajusteValorPresente: document.querySelector("#checkbox-avp .ucheckbox-box").classList.contains("is-checked"),
      mostrarRateioCentroCustos: document.querySelector("#checkbox-rateio-centro-custos .ucheckbox-box").classList.contains("is-checked"),
      gerarLancamentosOutraEmpresa: document.querySelector("#checkbox-outra-empresa .ucheckbox-box").classList.contains("is-checked"),
    };
    global.FiscalContabilFiscalData.setDadosManuais(empresaDrawerCF.codigo, vigenciaDrawerCF, novosValores);
    const alteracoes = global.FiscalHistoricoEventos.diffCampos(LABELS_HISTORICO_CF, anterior, novosValores, FORMATADORES_HISTORICO_CF);
    if (alteracoes.length) {
      global.FiscalHistoricoEventos.registrarEventoHistoricoFiscal(empresaDrawerCF.codigo, "Contábil × Fiscal", vigenciaDrawerCF, alteracoes);
    }
    fecharDrawerCF();
    UI.showToast("Parâmetros salvos", "Os parâmetros contábeis de " + empresaDrawerCF.nome + " foram atualizados.");
    if (onSalvarDrawerCF) onSalvarDrawerCF();
  }

  // Chamada pelo shell (fiscal-page.js) a partir do botão "Editar" que vive
  // fora do card, na faixa de ação entre a barra de abas e o conteúdo.
  function abrirEdicao(empresa, vigenciaId, onSalvo, focusId) {
    abrirDrawerCF(empresa, vigenciaId, onSalvo, focusId);
  }

  global.FiscalContabilFiscal = { renderConteudo: renderConteudo, abrirEdicao: abrirEdicao };
})(window);
