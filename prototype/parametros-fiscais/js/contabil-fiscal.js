/*
  Aba "Contábil × Fiscal" — implementação de conteúdo, exclusiva da trilha
  Fiscal. Escopo EXCLUSIVO do MVP (docs/02-parametros-fiscais.md, seção 10,
  campos Essenciais): "Gerar lançamentos contábeis automaticamente", "Tipo
  de lançamento contábil" e "Conta cliente/fornecedor em pagamento à vista"
  (Regra fixa/Sistema, somente leitura) + "Classificação de conta —
  Fornecedores" e "Classificação de conta — Clientes" (Manual, lista
  suspensa, dicionário D27). Os campos Desejável (cupom fiscal pelo valor
  total, separar frete/pedágio/IPI-ICMS ST, controle de estoque), Fase 2
  (AVP, rateio de centro de custos, gerar lançamentos em outra empresa) e
  Fora de escopo (créditos PIS/COFINS, honorários variáveis, Reduções Z/CFE)
  NÃO são implementados nesta etapa.

  Estrutura (docs/parametros-fiscais-arquitetura.md, seção 4.5:
  "distinguir visualmente o que é regra fixa ... do que é efetivamente
  configurável"): duas .detail-section dentro de um único .card, sem
  accordion (volume baixo, 5 campos — mesmo critério já aplicado em
  Federais) — "Regras do sistema" (as 3 regra fixa) e "Classificação de
  conta" (as 2 listas suspensas Manual).

  Jornada de edição dos 2 campos Manual (correção de arquitetura — rodada
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
      global.CampoOrigem.campo({ label: "Classificação de conta — Fornecedores", value: dados.classificacaoContaFornecedores, origem: ORIGENS.MANUAL }) +
      global.CampoOrigem.campo({ label: "Classificação de conta — Clientes", value: dados.classificacaoContaClientes, origem: ORIGENS.MANUAL }) +
      "</div></div>";

    return (
      '<div class="card">' +
      '<div class="card-header">' +
      '<div class="card-title">Contábil × Fiscal</div>' +
      '<div class="card-description">Parâmetro fiscal que impacta como o contábil lança as operações — bloco transversal, mantido em Parâmetros Fiscais por decisão de produto.</div>' +
      "</div>" +
      '<div class="card-content flex flex-col gap-6">' +
      secaoRegrasSistema + secaoClassificacaoConta +
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
      "</div>";
  }

  let empresaDrawerCF = null;
  let vigenciaDrawerCF = null;
  let onSalvarDrawerCF = null;

  function abrirDrawerCF(empresa, vigenciaId, onSalvar) {
    ensureDrawerCF();
    empresaDrawerCF = empresa;
    vigenciaDrawerCF = vigenciaId;
    onSalvarDrawerCF = onSalvar;
    preencherDrawerCF(empresa, vigenciaId);
    UI.openSheet(document.getElementById("cf-manual-overlay"), document.getElementById("cf-manual-panel"));
  }

  function fecharDrawerCF() {
    UI.closeSheet(document.getElementById("cf-manual-overlay"), document.getElementById("cf-manual-panel"));
  }

  function salvarDrawerCF() {
    const novosValores = {
      classificacaoContaFornecedores: document.getElementById("select-classificacao-fornecedores").value,
      classificacaoContaClientes: document.getElementById("select-classificacao-clientes").value,
    };
    global.FiscalContabilFiscalData.setDadosManuais(empresaDrawerCF.codigo, vigenciaDrawerCF, novosValores);
    fecharDrawerCF();
    UI.showToast("Parâmetros salvos", "A classificação de conta de " + empresaDrawerCF.nome + " foi atualizada.");
    if (onSalvarDrawerCF) onSalvarDrawerCF();
  }

  // Chamada pelo shell (fiscal-page.js) a partir do botão "Editar" que vive
  // fora do card, na faixa de ação entre a barra de abas e o conteúdo.
  function abrirEdicao(empresa, vigenciaId, onSalvo) {
    abrirDrawerCF(empresa, vigenciaId, onSalvo);
  }

  global.FiscalContabilFiscal = { renderConteudo: renderConteudo, abrirEdicao: abrirEdicao };
})(window);
