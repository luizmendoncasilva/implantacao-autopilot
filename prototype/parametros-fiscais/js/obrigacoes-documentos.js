/*
  Aba "Obrigações e Documentos Fiscais" — implementação de conteúdo,
  exclusiva da trilha Fiscal. Escopo EXCLUSIVO do MVP (docs/02-parametros-
  fiscais.md, seções 9 e 11, campos Essenciais): "Documentos fiscais
  emitidos" e "Série e numeração" (seção "Documentos Fiscais") + "PGDAS-D e
  DAS", "Guias avulsas de ICMS e ISS", "DEFIS", "DASN-SIMEI" e "eSocial —
  parametrização básica" (seção "Obrigações Acessórias"). Os demais campos
  dessas duas seções (DeSTDA, DTE-SN, Procuração eletrônica/Integra
  Contador, EFD-Reinf/DCTFWeb, EFD-ICMS/IPI, MIT — Desejável; SINTEGRA —
  Fase 2; EFD-Contribuições, ECF/e-LALUR, SPED Contábil — Fora de escopo)
  NÃO são implementados nesta etapa.

  Estrutura em duas seções expansíveis (docs/parametros-fiscais-
  arquitetura.md, seção 4.6: "organizadas como duas seções dentro da mesma
  aba"): reaproveita o mesmo scaffold de accordion já reservado para esta
  aba em fiscal-page.js (TABS[].sections) — "Documentos Fiscais" aberta,
  "Obrigações Acessórias" recolhida (mesma ordem já definida no array
  original), sem alterar o componente .accordion compartilhado.

  Decisão de arquitetura registrada (seção 4.6): "distinguir visualmente o
  que é auto-habilitado e somente leitura (DEFIS, DASN-SIMEI, DeSTDA,
  PGDAS-D/DAS) do que exige configuração manual (eSocial)" — refletida
  abaixo por origem (Sistema/Motor de cálculo vs. Manual), não por uma
  seção visual à parte.

  "Cadastro Repetível" (docs/parametros-fiscais-arquitetura.md, seção
  "Componentes que devem ser desenhados desde já") ainda NÃO foi construído
  como componente compartilhado genérico — "Série e numeração" é 100%
  somente leitura nesta fase (origem BHules), então usa uma tabela simples
  já padrão no protótipo (`.table-wrap`/`.dtable`), em vez de antecipar um
  componente de grade editável (adicionar/editar/remover linha) que nenhum
  campo desta etapa realmente precisa ainda.

  Jornada de edição do único campo Manual — eSocial — parametrização básica
  (correção de arquitetura — rodada de "Jornada de Edição", revisada):
  Drawer lateral, não edição inline na seção. Mesmo padrão de referência
  usado em gerais.js/estaduais-municipais.js/contabil-fiscal.js
  (SindicatoFormSheet / drawer "Editar empresa" de Empresas): "Editar" no
  cabeçalho da seção "Obrigações Acessórias" (visível só na vigência
  atual) abre um sheet lateral preenchido com o campo Manual editável e os
  4 campos Sistema/Motor de cálculo da mesma seção bloqueados, para
  contexto. "Documentos Fiscais" não tem nenhum botão — não possui campo
  Manual.

  Reaproveita FiscalGerais.renderNaoAplicavel para o mesmo gate de "empresa
  não optante pelo Simples Nacional" já usado pelas demais abas.
*/
(function (global) {
  const ORIGENS = global.OrigemBadge.ORIGENS;

  function accordionItem(titulo, aberto, contentHtml) {
    return (
      '<div class="accordion-item' + (aberto ? " is-open" : "") + '" data-accordion-item>' +
      '<button type="button" class="accordion-trigger" data-accordion-trigger>' +
      '<span class="accordion-trigger-title">' + titulo + "</span>" +
      '<span class="accordion-trigger-chev">' + Icon("chevron-down", "size-4") + "</span>" +
      "</button>" +
      '<div class="accordion-content">' + contentHtml + "</div></div>"
    );
  }

  // Valor multi-selecionado (D22), origem BHules — 100% somente leitura,
  // nenhuma seleção do usuário. Mesmo padrão visual de badges já usado para
  // "Módulos habilitados" em Empresas (detail-common.js), reaproveitado
  // aqui para outro valor multi-valorado somente leitura.
  function badgesDocumentos(lista) {
    return lista.length
      ? lista.map((d) => '<span class="badge badge-secondary">' + d + "</span>").join("")
      : '<span class="italic text-muted">Nenhum documento fiscal emitido.</span>';
  }

  // "Série e numeração" não cabe no formato de linha única de CampoOrigem —
  // monta o mesmo par label+badge de origem usado por CampoOrigem, seguido
  // de uma tabela somente leitura (.table-wrap/.dtable, já padrão no
  // protótipo — ver Empresas > Contadores/Sócios).
  function tabelaSerieNumeracao(linhas) {
    const rows = linhas.length
      ? linhas
          .map(
            (l) =>
              "<tr><td>" + l.tipoDocumento + "</td><td>" + l.serie + "</td><td>" + l.numeracao + "</td><td>" + l.estabelecimento + "</td></tr>"
          )
          .join("")
      : '<tr><td colspan="4" class="row-empty-state">Nenhuma série cadastrada no BHules.</td></tr>';
    return (
      '<div class="detail-field detail-field-wide">' +
      '<span class="detail-field-label">Série e numeração</span>' +
      '<div class="flex items-center gap-2" style="margin-bottom:8px;">' + global.OrigemBadge.render(ORIGENS.BHULES) + "</div>" +
      '<div class="table-wrap"><table class="dtable dtable-compact">' +
      "<thead><tr><th>Tipo de documento</th><th>Série</th><th>Numeração</th><th>Estabelecimento</th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table></div>" +
      "</div>"
    );
  }

  function renderConteudo(empresa, isReadOnly, vigenciaId, indicadorCarregando) {
    if (!empresa.optanteSimples) return global.FiscalGerais.renderNaoAplicavel(empresa, "Obrigações e Documentos Fiscais");

    const dadosGerais = global.FiscalGeraisData.getDadosGerais(empresa.codigo, vigenciaId);
    const dados = global.FiscalObrigacoesDocumentosData.getDados(empresa.codigo, vigenciaId);

    const documentosFiscaisContent =
      '<div class="detail-grid">' +
      global.CampoOrigem.campo({
        label: "Documentos fiscais emitidos",
        value: badgesDocumentos(dados.documentosFiscaisEmitidos),
        origem: ORIGENS.BHULES,
        wide: true,
      }) +
      tabelaSerieNumeracao(dados.serieNumeracao) +
      "</div>";

    // PGDAS-D e DAS: único campo desta aba com Indicador Calculado
    // (Motor de cálculo) — mesma simulação de carregamento já usada em
    // Gerais/Federais/Estaduais e Municipais.
    let pgdasHtml;
    if (indicadorCarregando) {
      pgdasHtml = global.IndicadorCalculado.render({ label: "PGDAS-D e DAS", origem: ORIGENS.MOTOR_CALCULO, state: "loading" });
    } else {
      pgdasHtml = global.IndicadorCalculado.render({
        label: "PGDAS-D e DAS",
        value: global.FiscalObrigacoesDocumentosData.PGDAS_DAS_STATUS,
        origem: ORIGENS.MOTOR_CALCULO,
        state: "available",
        wide: true,
      });
    }

    // DEFIS: dentro desta aba a empresa já é sempre optante do Simples
    // Nacional (gate acima) — por isso é sempre "Habilitada" aqui, sem
    // inventar uma condição adicional (docs/02-parametros-fiscais.md,
    // seção 11: "Habilitada automaticamente para optante do Simples
    // Nacional").
    const defisTexto = "Habilitada — optante do Simples Nacional.";
    const defisHtml = global.CampoOrigem.campo({ label: "DEFIS", value: defisTexto, origem: ORIGENS.SISTEMA, wide: true });

    // DASN-SIMEI: depende do campo MEI já existente em Gerais
    // (FiscalGeraisData) — "Habilitada automaticamente para MEI,
    // substituindo a DEFIS" (seção 11). Nenhum mock atual tem MEI = "Sim"
    // (ver as-built, limitação de mock já registrada para outros campos
    // condicionados a dados hoje ausentes nos mocks principais) — a lógica
    // foi verificada isoladamente (ver relatório da tarefa).
    const isMei = dadosGerais.mei === "Sim";
    const dasnSimeiTexto = isMei ? "Habilitada — substitui a DEFIS (MEI)." : "Não habilitada — empresa não é MEI.";
    const dasnSimeiHtml = global.CampoOrigem.campo({ label: "DASN-SIMEI", value: dasnSimeiTexto, origem: ORIGENS.SISTEMA, wide: true });

    // Guias avulsas de ICMS e ISS: regra fixa documentada ("habilitadas
    // automaticamente com excesso de sublimite... geradas por ação humana a
    // partir da pendência da seção 3"). Nenhum mock desta trilha modela uma
    // flag de "empresa acima do sublimite" por empresa — o texto exibido é
    // a regra geral, não uma habilitação condicional simulada (ver
    // comentário em obrigacoes-documentos-data.js e o as-built).
    const guiasAvulsasTexto = "Habilitadas automaticamente com excesso de sublimite; geradas por ação humana a partir da pendência de sublimite.";
    const guiasAvulsasHtml = global.CampoOrigem.campo({ label: "Guias avulsas de ICMS e ISS", value: guiasAvulsasTexto, origem: ORIGENS.SISTEMA, wide: true });

    const esocialHtml = global.CampoOrigem.campo({
      label: "eSocial — parametrização básica",
      value: dados.esocialParametrizacaoBasica ? "Ativo" : "Inativo",
      origem: ORIGENS.MANUAL,
    });

    const obrigacoesAcessoriasContent =
      '<div class="detail-grid">' + pgdasHtml + guiasAvulsasHtml + defisHtml + dasnSimeiHtml + esocialHtml + "</div>";

    return (
      '<div class="accordion">' +
      accordionItem("Documentos Fiscais", true, documentosFiscaisContent) +
      accordionItem("Obrigações Acessórias", false, obrigacoesAcessoriasContent) +
      "</div>"
    );
  }

  // ===== Drawer "Editar obrigações acessórias" =====
  function sheetMarkupOD() {
    return (
      '<div class="sheet-overlay" id="od-manual-overlay"></div>' +
      '<div class="sheet-panel" id="od-manual-panel" role="dialog" aria-modal="true" aria-labelledby="od-manual-title">' +
      '<button type="button" class="sheet-close" id="od-manual-close">' + Icon("x", "size-4") + "</button>" +
      '<div class="sheet-header">' +
      '<div class="sheet-title" id="od-manual-title">Editar obrigações acessórias</div>' +
      '<div class="sheet-description">Altere o parâmetro de origem Manual desta seção. Os demais campos são exibidos apenas para contexto e não podem ser alterados por aqui.</div>' +
      "</div>" +
      '<div class="sheet-body" id="od-manual-body" style="padding-bottom:16px;"></div>' +
      '<div class="sheet-footer">' +
      '<button type="button" class="btn btn-outline" id="od-manual-cancelar">Cancelar</button>' +
      '<button type="button" class="btn" id="od-manual-salvar">Salvar</button>' +
      "</div>" +
      "</div>"
    );
  }

  function ensureDrawerOD() {
    if (document.getElementById("od-manual-panel")) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = sheetMarkupOD();
    while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);

    document.getElementById("od-manual-overlay").addEventListener("click", fecharDrawerOD);
    document.getElementById("od-manual-close").addEventListener("click", fecharDrawerOD);
    document.getElementById("od-manual-cancelar").addEventListener("click", fecharDrawerOD);
    document.getElementById("od-manual-salvar").addEventListener("click", salvarDrawerOD);
  }

  function campoBloqueado(label, valor) {
    return (
      '<div class="sheet-field">' +
      '<label class="field-label">' + label + "</label>" +
      '<div class="sheet-field-locked-value">' + Icon("lock", "size-3-5") + "<span>" + valor + "</span></div>" +
      "</div>"
    );
  }

  function preencherDrawerOD(empresa, vigenciaId) {
    const dadosGerais = global.FiscalGeraisData.getDadosGerais(empresa.codigo, vigenciaId);
    const dados = global.FiscalObrigacoesDocumentosData.getDados(empresa.codigo, vigenciaId);
    const isMei = dadosGerais.mei === "Sim";
    document.getElementById("od-manual-body").innerHTML =
      campoBloqueado("PGDAS-D e DAS", global.FiscalObrigacoesDocumentosData.PGDAS_DAS_STATUS) +
      campoBloqueado("Guias avulsas de ICMS e ISS", "Habilitadas automaticamente com excesso de sublimite; geradas por ação humana a partir da pendência de sublimite.") +
      campoBloqueado("DEFIS", "Habilitada — optante do Simples Nacional.") +
      campoBloqueado("DASN-SIMEI", isMei ? "Habilitada — substitui a DEFIS (MEI)." : "Não habilitada — empresa não é MEI.") +
      '<div class="sheet-field">' +
      '<label class="field-label">eSocial — parametrização básica</label>' +
      '<label class="ucheckbox" id="checkbox-esocial"><span class="ucheckbox-box' + (dados.esocialParametrizacaoBasica ? " is-checked" : "") + '">' + Icon("check", "size-4") + '</span><span class="ucheckbox-label">Ativo</span></label>' +
      "</div>";

    document.getElementById("checkbox-esocial").addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#checkbox-esocial .ucheckbox-box").classList.toggle("is-checked");
    });
  }

  let empresaDrawerOD = null;
  let vigenciaDrawerOD = null;
  let onSalvarDrawerOD = null;

  function abrirDrawerOD(empresa, vigenciaId, onSalvar) {
    ensureDrawerOD();
    empresaDrawerOD = empresa;
    vigenciaDrawerOD = vigenciaId;
    onSalvarDrawerOD = onSalvar;
    preencherDrawerOD(empresa, vigenciaId);
    UI.openSheet(document.getElementById("od-manual-overlay"), document.getElementById("od-manual-panel"));
  }

  function fecharDrawerOD() {
    UI.closeSheet(document.getElementById("od-manual-overlay"), document.getElementById("od-manual-panel"));
  }

  function salvarDrawerOD() {
    const novosValores = {
      esocialParametrizacaoBasica: document.querySelector("#checkbox-esocial .ucheckbox-box").classList.contains("is-checked"),
    };
    global.FiscalObrigacoesDocumentosData.setDadosManuais(empresaDrawerOD.codigo, vigenciaDrawerOD, novosValores);
    fecharDrawerOD();
    UI.showToast("Parâmetros salvos", "O eSocial de " + empresaDrawerOD.nome + " foi atualizado.");
    if (onSalvarDrawerOD) onSalvarDrawerOD();
  }

  // Chamada pelo shell (fiscal-page.js) a partir do botão "Editar" que vive
  // fora do accordion, na faixa de ação entre a barra de abas e o
  // conteúdo — o shell também cuida de preservar o accordion aberto após
  // salvar (ver rerenderTabPreservandoAccordion em fiscal-page.js).
  function abrirEdicao(empresa, vigenciaId, onSalvo) {
    abrirDrawerOD(empresa, vigenciaId, onSalvo);
  }

  global.FiscalObrigacoesDocumentos = { renderConteudo: renderConteudo, abrirEdicao: abrirEdicao };
})(window);
