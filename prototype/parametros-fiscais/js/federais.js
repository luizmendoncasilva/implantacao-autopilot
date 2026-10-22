/*
  Aba "Federais" — implementação de conteúdo, exclusiva da trilha Fiscal.
  Escopo do MVP (docs/parametros-fiscais-arquitetura.md, seção 5): apenas
  "INSS patronal fora do DAS (Anexo IV)".

  Rodada de complementação de conteúdo (docs/02-parametros-fiscais.md,
  seção 5, campos Desejável): "Retenção de INSS sobre serviços prestados"
  (Calculado, Motor de cálculo, somente leitura), "Tributação monofásica
  ou ST de PIS/COFINS" (Calculado, BHules, somente leitura) e "Opção pela
  CPRB" (Checkbox, Manual) somam-se ao campo do MVP, na mesma seção única
  (bloco continua fino — 4 campos, sem accordion, mesmo critério já usado
  antes desta rodada).

  Jornada de edição do único campo Manual — Opção pela CPRB: mesmo padrão
  de referência (drawer lateral) já usado em contabil-fiscal.js (aba
  pequena, sem accordion, um só .card) — esta aba não tinha nenhum campo
  Manual/drawer antes desta rodada.

  A aplicabilidade do INSS patronal usa o Anexo já mockado para Gerais
  (FiscalGeraisData.getDadosGerais(codigo).anexoCodigo) — nenhuma regra
  nova de Anexo é criada aqui. Os demais 3 campos desta rodada não têm
  regra de aplicabilidade documentada (ver federais-data.js).
*/
(function (global) {
  const ORIGENS = global.OrigemBadge.ORIGENS;

  // indicadorCarregando força o estado "loading" — mesma simulação de
  // carregamento já usada nos indicadores de Gerais (ver fiscal-page.js).
  function renderConteudo(empresa, isReadOnly, vigenciaId, indicadorCarregando) {
    if (!empresa.optanteSimples) return global.FiscalGerais.renderNaoAplicavel(empresa, "Federais");

    const dadosGerais = global.FiscalGeraisData.getDadosGerais(empresa.codigo, vigenciaId);
    const anexoIV = dadosGerais.anexoCodigo === "IV";
    const dados = global.FiscalFederaisData.getDados(empresa.codigo, vigenciaId);

    let inssPatronalHtml;
    if (indicadorCarregando) {
      inssPatronalHtml = global.IndicadorCalculado.render({ label: "INSS patronal fora do DAS", origem: ORIGENS.MOTOR_CALCULO, state: "loading" });
    } else if (!anexoIV) {
      inssPatronalHtml = global.IndicadorCalculado.render({
        label: "INSS patronal fora do DAS",
        origem: ORIGENS.MOTOR_CALCULO,
        state: "not-applicable",
      });
    } else {
      const valor = global.FiscalFederaisData.getInssPatronalForaDoDas(empresa.codigo);
      inssPatronalHtml =
        valor != null
          ? global.IndicadorCalculado.render({ label: "INSS patronal fora do DAS", value: valor, origem: ORIGENS.MOTOR_CALCULO, state: "available" })
          : global.IndicadorCalculado.render({ label: "INSS patronal fora do DAS", origem: ORIGENS.MOTOR_CALCULO, state: "unavailable" });
    }

    let retencaoInssHtml;
    if (indicadorCarregando) {
      retencaoInssHtml = global.IndicadorCalculado.render({ label: "Retenção de INSS sobre serviços prestados", origem: ORIGENS.MOTOR_CALCULO, state: "loading" });
    } else {
      const valor = global.FiscalFederaisData.getRetencaoInssServicosPrestados(empresa.codigo);
      retencaoInssHtml =
        valor != null
          ? global.IndicadorCalculado.render({ label: "Retenção de INSS sobre serviços prestados", value: valor, origem: ORIGENS.MOTOR_CALCULO, state: "available" })
          : global.IndicadorCalculado.render({ label: "Retenção de INSS sobre serviços prestados", origem: ORIGENS.MOTOR_CALCULO, state: "unavailable" });
    }

    let tributacaoMonofasicaHtml;
    if (indicadorCarregando) {
      tributacaoMonofasicaHtml = global.IndicadorCalculado.render({ label: "Tributação monofásica/ST de PIS/COFINS", origem: ORIGENS.BHULES, state: "loading" });
    } else {
      const valor = global.FiscalFederaisData.getTributacaoMonofasicaSt(empresa.codigo);
      tributacaoMonofasicaHtml =
        valor != null
          ? global.IndicadorCalculado.render({ label: "Tributação monofásica/ST de PIS/COFINS", value: valor, origem: ORIGENS.BHULES, state: "available", wide: true })
          : global.IndicadorCalculado.render({ label: "Tributação monofásica/ST de PIS/COFINS", origem: ORIGENS.BHULES, state: "unavailable", wide: true });
    }

    const cprbHtml = global.CampoOrigem.campo({
      label: "Opção pela CPRB",
      value: dados.cprbOptante ? "Ativo" : "Inativo",
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "checkbox-cprb",
    });

    return (
      '<div class="card">' +
      '<div class="card-header">' +
      '<div class="card-title">Federais</div>' +
      '<div class="card-description">Registra o pouco que tem efeito de apuração ou relatório fora do DAS, já que no Simples Nacional a maior parte dos tributos federais está dentro do DAS.</div>' +
      "</div>" +
      '<div class="card-content">' +
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Federais</h3>' +
      '<div class="detail-grid">' + inssPatronalHtml + retencaoInssHtml + tributacaoMonofasicaHtml + cprbHtml + "</div>" +
      "</div></div></div>"
    );
  }

  // ===== Drawer "Editar Federais" =====
  function sheetMarkupFD() {
    return (
      '<div class="sheet-overlay" id="fd-manual-overlay"></div>' +
      '<div class="sheet-panel" id="fd-manual-panel" role="dialog" aria-modal="true" aria-labelledby="fd-manual-title">' +
      '<button type="button" class="sheet-close" id="fd-manual-close">' + Icon("x", "size-4") + "</button>" +
      '<div class="sheet-header">' +
      '<div class="sheet-title" id="fd-manual-title">Editar Federais</div>' +
      '<div class="sheet-description">Altere o parâmetro de origem Manual desta aba. Os demais campos são calculados/refletidos e não podem ser alterados por aqui.</div>' +
      "</div>" +
      '<div class="sheet-body" id="fd-manual-body" style="padding-bottom:16px;"></div>' +
      '<div class="sheet-footer">' +
      '<button type="button" class="btn btn-outline" id="fd-manual-cancelar">Cancelar</button>' +
      '<button type="button" class="btn" id="fd-manual-salvar">Salvar</button>' +
      "</div>" +
      "</div>"
    );
  }

  function ensureDrawerFD() {
    if (document.getElementById("fd-manual-panel")) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = sheetMarkupFD();
    while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);

    document.getElementById("fd-manual-overlay").addEventListener("click", fecharDrawerFD);
    document.getElementById("fd-manual-close").addEventListener("click", fecharDrawerFD);
    document.getElementById("fd-manual-cancelar").addEventListener("click", fecharDrawerFD);
    document.getElementById("fd-manual-salvar").addEventListener("click", salvarDrawerFD);
  }

  function preencherDrawerFD(empresa, vigenciaId) {
    const dados = global.FiscalFederaisData.getDados(empresa.codigo, vigenciaId);
    document.getElementById("fd-manual-body").innerHTML =
      '<div class="sheet-field">' +
      '<label class="field-label">Opção pela CPRB</label>' +
      '<label class="ucheckbox" id="checkbox-cprb"><span class="ucheckbox-box' + (dados.cprbOptante ? " is-checked" : "") + '">' + Icon("check", "size-4") + '</span><span class="ucheckbox-label">Ativo</span></label>' +
      "</div>";

    document.getElementById("checkbox-cprb").addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#checkbox-cprb .ucheckbox-box").classList.toggle("is-checked");
    });
  }

  let empresaDrawerFD = null;
  let vigenciaDrawerFD = null;
  let onSalvarDrawerFD = null;

  // Ver equivalente comentado em gerais.js.
  function focarCampoDrawer(focusId) {
    if (!focusId) return;
    const el = document.getElementById(focusId);
    if (!el) return;
    if (typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "center" });
    if (typeof el.focus === "function") el.focus();
  }

  function abrirDrawerFD(empresa, vigenciaId, onSalvar, focusId) {
    ensureDrawerFD();
    empresaDrawerFD = empresa;
    vigenciaDrawerFD = vigenciaId;
    onSalvarDrawerFD = onSalvar;
    preencherDrawerFD(empresa, vigenciaId);
    UI.openSheet(document.getElementById("fd-manual-overlay"), document.getElementById("fd-manual-panel"));
    focarCampoDrawer(focusId);
  }

  function fecharDrawerFD() {
    UI.closeSheet(document.getElementById("fd-manual-overlay"), document.getElementById("fd-manual-panel"));
  }

  // Rótulo do único campo Manual desta aba, para o Histórico de Alterações
  // — só para o diff do evento, sem relação com a renderização do
  // card/drawer.
  const LABELS_HISTORICO_FD = {
    cprbOptante: "Opção pela CPRB",
  };

  const FORMATADORES_HISTORICO_FD = {
    cprbOptante: (v) => (v ? "Ativo" : "Inativo"),
  };

  function salvarDrawerFD() {
    const anterior = global.FiscalFederaisData.getDados(empresaDrawerFD.codigo, vigenciaDrawerFD);
    const novosValores = {
      cprbOptante: document.querySelector("#checkbox-cprb .ucheckbox-box").classList.contains("is-checked"),
    };
    global.FiscalFederaisData.setDadosManuais(empresaDrawerFD.codigo, vigenciaDrawerFD, novosValores);
    const alteracoes = global.FiscalHistoricoEventos.diffCampos(LABELS_HISTORICO_FD, anterior, novosValores, FORMATADORES_HISTORICO_FD);
    if (alteracoes.length) {
      global.FiscalHistoricoEventos.registrarEventoHistoricoFiscal(empresaDrawerFD.codigo, "Federais", vigenciaDrawerFD, alteracoes);
    }
    fecharDrawerFD();
    UI.showToast("Parâmetros salvos", "A opção pela CPRB de " + empresaDrawerFD.nome + " foi atualizada.");
    if (onSalvarDrawerFD) onSalvarDrawerFD();
  }

  // Chamada pelo shell (fiscal-page.js) a partir do botão "Editar" que vive
  // fora do card, na faixa de ação entre a barra de abas e o conteúdo.
  function abrirEdicao(empresa, vigenciaId, onSalvo, focusId) {
    abrirDrawerFD(empresa, vigenciaId, onSalvo, focusId);
  }

  global.FiscalFederais = { renderConteudo: renderConteudo, abrirEdicao: abrirEdicao };
})(window);
