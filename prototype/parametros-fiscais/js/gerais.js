/*
  Aba "Gerais" — implementação de conteúdo, exclusiva da trilha Fiscal.
  Usa os componentes compartilhados CampoOrigem/IndicadorCalculado/
  OrigemBadge (prototype/shared/js/origem.js e indicador-calculado.js);
  os campos, agrupamento e mocks abaixo são específicos de Fiscal e não
  pertencem a shared.

  Campos e regras seguem exclusivamente docs/02-parametros-fiscais.md,
  seção 4, e o mapeamento UX de Gerais já validado. Agrupamento em 5 seções
  (Enquadramento no Simples Nacional, Indicadores de Apuração, Limites e
  Sublimite, Regime e Credenciais, Segmentação — Fase 2), sem accordion —
  a arquitetura UX aprovada privilegia visualização direta.

  Jornada de edição dos 4 campos Manual (correção de arquitetura — rodada de
  "Jornada de Edição", revisada): Drawer lateral, não edição inline no card.
  Padrão de referência: `prototype/sindicatos/js/sindicato-form.js`
  (SindicatoFormSheet, aberto a partir de `sindicato-detail.js`) e o drawer
  "Editar empresa" de `prototype/empresas/js/dados-gerais.js` — o card
  permanece 100% somente leitura em qualquer momento; "Editar" (no
  cabeçalho do card, visível só na vigência atual) abre um sheet lateral
  preenchido com os valores atuais; campos não editáveis do mesmo bloco
  aparecem no drawer como `.sheet-field-locked-value` (ícone de cadeado),
  mesmo padrão usado por CNPJ/Contador responsável/Contrato/Certificado
  digital no drawer de Empresas — não escondidos, só bloqueados, para dar
  contexto a quem está editando os 4 campos Manuais. Cancelar descarta e
  fecha; Salvar persiste, fecha e mostra toast — sem dialog de reflexo no
  Cockpit (nenhum dos 4 campos Manuais tem origem Cockpit documentada).

  NÃO implementado nesta etapa (ver relatório da tarefa): "Perfil de
  parametrização por atividade" (D35, pendência funcional sobre quando/como
  é aplicado — mantido fora da interface); "Segmento de atividade especial"
  continua Fase 2 — apesar de o dicionário sugerir Lista múltipla, a
  prioridade documentada é Fase 2, então permanece informativo/bloqueado,
  sem controle de edição (não ampliar escopo além do já aprovado).

  "Regime de reconhecimento de receita" (fechamento D06 — tarefa
  "Fechamento final, Parâmetros Fiscais"): decisão de produto passou a
  tratá-lo como o 5º campo Manual/configurável desta aba (Competência/
  Caixa, dicionário D06), editável pelo mesmo drawer "Editar parâmetros
  gerais" dos demais 4 campos Manuais já existentes — deixou de ser
  renderizado como indicador de Motor de cálculo. Nenhuma opção além de
  Competência/Caixa foi criada; RBT12/RBA/Fator R e os demais indicadores
  calculados não foram alterados.
*/
(function (global) {
  const ORIGENS = global.OrigemBadge.ORIGENS;

  function indicadorState(dados, chave) {
    return (dados.indicadoresIndisponiveis || []).indexOf(chave) !== -1 ? "unavailable" : "available";
  }

  // Regime fora do escopo desta versão — decisão de UX desta implementação,
  // não uma regra funcional nova: docs/02-parametros-fiscais.md (seção 1)
  // prioriza Simples Nacional nesta rodada ("Lucro Presumido, Lucro Real...
  // em fase posterior"). EmpresasData já expõe `optanteSimples`; empresas
  // não optantes não têm os campos de Gerais/Federais mockados porque são
  // todos específicos de SN (Anexo, sublimite de ICMS/ISS, PGDAS-D...) e
  // exibi-los seria enganoso. Registrado como pendência/decisão no relatório
  // da tarefa. Exportada (não só local a Gerais) para a aba Federais
  // reaproveitar a mesma mensagem/estrutura em vez de duplicá-la —
  // `tituloAba` deixa o `<h3>` correto para cada aba que a chamar.
  function renderNaoAplicavel(empresa, tituloAba) {
    return (
      '<div class="card">' +
      '<div class="card-content flex flex-col items-center gap-3" style="text-align:center; padding:32px 24px;">' +
      '<div class="flex items-center justify-center size-12 rounded-full" style="background:var(--muted); color:var(--muted-foreground);">' +
      Icon("info", "size-6") +
      "</div>" +
      '<div class="flex flex-col items-center gap-1">' +
      '<h3 class="text-base font-semibold">' + (tituloAba || "Gerais") + "</h3>" +
      '<p class="text-sm text-muted max-w-md">' +
      "Esta empresa está no regime " + empresa.dadosGerais.regimeTributarioFederal + ". Os campos desta versão de Parâmetros Fiscais cobrem apenas o Simples Nacional — Lucro Presumido e Lucro Real ficam para fase posterior (docs/02-parametros-fiscais.md, seção 1)." +
      "</p></div></div></div>"
    );
  }

  // ===== Card (somente leitura, sempre) =====

  // indicadoresCarregando força o estado "loading" nos 4 indicadores
  // (Anexo, RBT12, RBA/RBAA, Fator R) — usado pela sequência de carregamento
  // simulado ao entrar na aba (ver fiscal-page.js). Os demais campos de
  // Gerais não têm estado de carregamento documentado, então renderizam
  // direto.
  function renderConteudo(empresa, isReadOnly, vigenciaId, indicadoresCarregando) {
    if (!empresa.optanteSimples) return renderNaoAplicavel(empresa);

    const dados = global.FiscalGeraisData.getDadosGerais(empresa.codigo, vigenciaId);

    function indicador(label, chave, valor) {
      if (indicadoresCarregando) {
        return global.IndicadorCalculado.render({ label: label, origem: ORIGENS.MOTOR_CALCULO, state: "loading" });
      }
      return global.IndicadorCalculado.render({
        label: label,
        value: valor,
        origem: ORIGENS.MOTOR_CALCULO,
        state: indicadorState(dados, chave),
        unavailableText: "Não disponível no momento",
      });
    }

    const secaoEnquadramento =
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Enquadramento no Simples Nacional</h3>' +
      '<div class="detail-grid">' +
      global.CampoOrigem.campo({ label: "Data de opção pelo Simples Nacional", value: dados.dataOpcaoSN, origem: ORIGENS.API_GOV_COCKPIT }) +
      global.CampoOrigem.campo({ label: "MEI (Microempreendedor Individual)", value: dados.mei, origem: ORIGENS.COCKPIT }) +
      indicador("Anexo(s) e % de receita por atividade", "anexo", dados.anexoResumo) +
      "</div></div>";

    const secaoIndicadores =
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Indicadores de apuração</h3>' +
      '<div class="detail-grid">' +
      indicador("RBT12", "rbt12", dados.rbt12) +
      indicador("RBA / RBAA", "rba", dados.rba) +
      indicador("Fator R", "fatorR", dados.fatorR) +
      "</div></div>";

    const secaoLimites =
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Limites e sublimite</h3>' +
      '<div class="detail-grid">' +
      global.CampoOrigem.campo({ label: "Limite de receita — mercado interno", value: dados.limiteMercadoInterno, origem: ORIGENS.LEGISLACAO }) +
      global.CampoOrigem.campo({ label: "Limite adicional — exportação", value: dados.limiteExportacao, origem: ORIGENS.LEGISLACAO }) +
      global.CampoOrigem.campo({ label: "Sublimite estadual de ICMS/ISS", value: dados.sublimiteIcmsIss, origem: ORIGENS.LEGISLACAO }) +
      global.CampoOrigem.campo({ label: "Aviso de proximidade do limite de enquadramento", value: dados.avisoProximidadeLimitePercentual + "%", origem: ORIGENS.MANUAL }) +
      global.CampoOrigem.campo({ label: "Aviso de proximidade do sublimite", value: dados.avisoProximidadeSublimitePercentual + "%", origem: ORIGENS.MANUAL }) +
      global.CampoOrigem.campo({ label: "Aviso de troca de faixa de receita bruta", value: dados.avisoTrocaFaixaAtivo ? "Ativo" : "Inativo", origem: ORIGENS.MANUAL }) +
      "</div></div>";

    const secaoRegime =
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Regime e credenciais</h3>' +
      '<div class="detail-grid">' +
      global.CampoOrigem.campo({ label: "Regime de reconhecimento de receita", value: dados.regimeReconhecimentoReceita, origem: ORIGENS.MANUAL }) +
      global.CampoOrigem.campo({ label: "Código de acesso ao PGDAS-D", value: dados.codigoAcessoPgdasD, origem: ORIGENS.MANUAL }) +
      "</div></div>";

    const secaoSegmentacao =
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Segmentação — Fase 2</h3>' +
      '<div class="detail-grid">' +
      '<div class="detail-field">' +
      '<span class="detail-field-label">Segmento de atividade especial</span>' +
      '<div class="flex items-center gap-2 flex-wrap">' +
      '<span class="text-sm text-muted italic">Aguardando mapeamento da carteira do Simples Nacional</span>' +
      '<span class="badge badge-warning">Fase 2</span>' +
      "</div></div></div></div>";

    return (
      '<div class="card">' +
      '<div class="card-header">' +
      '<div class="card-title">Gerais</div>' +
      '<div class="card-description">Classifica a base da empresa dentro da vigência — Anexo, RBT12, RBA/RBAA e Fator R aqui exibidos alimentam a leitura das demais abas.</div>' +
      "</div>" +
      '<div class="card-content flex flex-col gap-6">' +
      secaoEnquadramento + secaoIndicadores + secaoLimites + secaoRegime + secaoSegmentacao +
      "</div></div>"
    );
  }

  // ===== Drawer "Editar parâmetros gerais" =====
  // Reaproveita o mesmo padrão de sheet lateral já usado em
  // sindicato-form.js (SindicatoFormSheet) e no drawer "Editar empresa" de
  // Empresas > Dados gerais — injetado uma única vez no <body> (mesmo
  // princípio de ensureToast/ensureTrocarEmpresaSheet já usados nesta
  // trilha), reaberto por referência a cada clique em "Editar".

  function campoBloqueado(label, valor) {
    return (
      '<div class="sheet-field">' +
      '<label class="field-label">' + label + "</label>" +
      '<div class="sheet-field-locked-value">' + Icon("lock", "size-3-5") + "<span>" + valor + "</span></div>" +
      "</div>"
    );
  }

  // Mesmo padrão de select em drawer já usado em contabil-fiscal.js e
  // estaduais-municipais.js (field-select-wrap/field-select) — reaproveitado
  // aqui, sem criar um componente novo, para o 5º campo Manual desta aba.
  function selectEdit(id, valor, opcoes) {
    const optsHtml = opcoes.map((o) => '<option value="' + o + '"' + (valor === o ? " selected" : "") + ">" + o + "</option>").join("");
    return (
      '<div class="field-select-wrap"><select class="field-select" id="' + id + '">' + optsHtml + "</select>" +
      '<span class="chev">' + Icon("chevron-down", "size-4") + "</span></div>"
    );
  }

  function sheetMarkupGerais() {
    return (
      '<div class="sheet-overlay" id="gerais-manual-overlay"></div>' +
      '<div class="sheet-panel" id="gerais-manual-panel" role="dialog" aria-modal="true" aria-labelledby="gerais-manual-title">' +
      '<button type="button" class="sheet-close" id="gerais-manual-close">' + Icon("x", "size-4") + "</button>" +
      '<div class="sheet-header">' +
      '<div class="sheet-title" id="gerais-manual-title">Editar parâmetros gerais</div>' +
      '<div class="sheet-description">Altere os parâmetros de origem Manual desta aba. Os demais campos são exibidos apenas para contexto e não podem ser alterados por aqui.</div>' +
      "</div>" +
      '<div class="sheet-body" id="gerais-manual-body" style="padding-bottom:16px;"></div>' +
      '<div class="sheet-footer">' +
      '<button type="button" class="btn btn-outline" id="gerais-manual-cancelar">Cancelar</button>' +
      '<button type="button" class="btn" id="gerais-manual-salvar">Salvar</button>' +
      "</div>" +
      "</div>"
    );
  }

  function ensureDrawerGerais() {
    if (document.getElementById("gerais-manual-panel")) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = sheetMarkupGerais();
    while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);

    document.getElementById("gerais-manual-overlay").addEventListener("click", fecharDrawerGerais);
    document.getElementById("gerais-manual-close").addEventListener("click", fecharDrawerGerais);
    document.getElementById("gerais-manual-cancelar").addEventListener("click", fecharDrawerGerais);
    document.getElementById("gerais-manual-salvar").addEventListener("click", salvarDrawerGerais);
  }

  function preencherDrawerGerais(empresa, vigenciaId) {
    const dados = global.FiscalGeraisData.getDadosGerais(empresa.codigo, vigenciaId);
    document.getElementById("gerais-manual-body").innerHTML =
      campoBloqueado("Data de opção pelo Simples Nacional", dados.dataOpcaoSN) +
      campoBloqueado("MEI (Microempreendedor Individual)", dados.mei) +
      campoBloqueado("Anexo(s) e % de receita por atividade", dados.anexoResumo) +
      campoBloqueado("RBT12", dados.rbt12) +
      campoBloqueado("RBA / RBAA", dados.rba) +
      campoBloqueado("Fator R", dados.fatorR != null ? dados.fatorR : "Não disponível no momento") +
      campoBloqueado("Limite de receita — mercado interno", dados.limiteMercadoInterno) +
      campoBloqueado("Limite adicional — exportação", dados.limiteExportacao) +
      campoBloqueado("Sublimite estadual de ICMS/ISS", dados.sublimiteIcmsIss) +
      '<div class="sheet-field"><label class="field-label" for="input-aviso-limite">Aviso de proximidade do limite de enquadramento</label>' +
      '<div class="flex items-center gap-2"><input class="field-input" type="text" id="input-aviso-limite" value="' + dados.avisoProximidadeLimitePercentual + '" style="max-width:100px;" /><span class="text-sm text-muted">%</span></div></div>' +
      '<div class="sheet-field"><label class="field-label" for="input-aviso-sublimite">Aviso de proximidade do sublimite</label>' +
      '<div class="flex items-center gap-2"><input class="field-input" type="text" id="input-aviso-sublimite" value="' + dados.avisoProximidadeSublimitePercentual + '" style="max-width:100px;" /><span class="text-sm text-muted">%</span></div></div>' +
      '<div class="sheet-field">' +
      '<label class="field-label">Aviso de troca de faixa de receita bruta</label>' +
      '<label class="ucheckbox" id="checkbox-aviso-troca-faixa"><span class="ucheckbox-box' + (dados.avisoTrocaFaixaAtivo ? " is-checked" : "") + '">' + Icon("check", "size-4") + '</span><span class="ucheckbox-label">Ativo</span></label>' +
      "</div>" +
      '<div class="sheet-field"><label class="field-label" for="select-regime-reconhecimento">Regime de reconhecimento de receita</label>' +
      selectEdit("select-regime-reconhecimento", dados.regimeReconhecimentoReceita, global.FiscalGeraisData.OPCOES_REGIME_RECONHECIMENTO_RECEITA) +
      "</div>" +
      '<div class="sheet-field"><label class="field-label" for="input-pgdas-codigo">Código de acesso ao PGDAS-D</label>' +
      '<input class="field-input" type="text" id="input-pgdas-codigo" value="' + dados.codigoAcessoPgdasD + '" /></div>';

    document.getElementById("checkbox-aviso-troca-faixa").addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#checkbox-aviso-troca-faixa .ucheckbox-box").classList.toggle("is-checked");
    });
  }

  let empresaDrawerGerais = null;
  let vigenciaDrawerGerais = null;
  let onSalvarDrawerGerais = null;

  function abrirDrawerGerais(empresa, vigenciaId, onSalvar) {
    ensureDrawerGerais();
    empresaDrawerGerais = empresa;
    vigenciaDrawerGerais = vigenciaId;
    onSalvarDrawerGerais = onSalvar;
    preencherDrawerGerais(empresa, vigenciaId);
    UI.openSheet(document.getElementById("gerais-manual-overlay"), document.getElementById("gerais-manual-panel"));
  }

  function fecharDrawerGerais() {
    UI.closeSheet(document.getElementById("gerais-manual-overlay"), document.getElementById("gerais-manual-panel"));
  }

  function salvarDrawerGerais() {
    const novosValores = {
      avisoProximidadeLimitePercentual: document.getElementById("input-aviso-limite").value.trim(),
      avisoProximidadeSublimitePercentual: document.getElementById("input-aviso-sublimite").value.trim(),
      avisoTrocaFaixaAtivo: document.querySelector("#checkbox-aviso-troca-faixa .ucheckbox-box").classList.contains("is-checked"),
      regimeReconhecimentoReceita: document.getElementById("select-regime-reconhecimento").value,
      codigoAcessoPgdasD: document.getElementById("input-pgdas-codigo").value,
    };
    global.FiscalGeraisData.setDadosManuais(empresaDrawerGerais.codigo, vigenciaDrawerGerais, novosValores);
    fecharDrawerGerais();
    UI.showToast("Parâmetros salvos", "Os campos manuais de Gerais foram atualizados para " + empresaDrawerGerais.nome + ".");
    if (onSalvarDrawerGerais) onSalvarDrawerGerais();
  }

  // Chamada pelo shell (fiscal-page.js) a partir do botão "Editar" que vive
  // fora do card, na faixa de ação entre a barra de abas e o conteúdo —
  // ver seção "Correção de arquitetura — drawer lateral..." do as-built.
  // vigenciaId (etapa "Vigência Funcional"): identifica em qual vigência os
  // valores editados devem ser salvos — o shell só chama esta função com a
  // vigência atual (histórico é sempre somente leitura, sem botão Editar).
  function abrirEdicao(empresa, vigenciaId, onSalvo) {
    abrirDrawerGerais(empresa, vigenciaId, onSalvo);
  }

  global.FiscalGerais = { renderConteudo: renderConteudo, abrirEdicao: abrirEdicao, renderNaoAplicavel: renderNaoAplicavel };
})(window);
