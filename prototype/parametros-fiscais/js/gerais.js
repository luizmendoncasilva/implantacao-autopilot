/*
  Aba "Gerais" — implementação de conteúdo, exclusiva da trilha Fiscal.
  Usa os componentes compartilhados CampoOrigem/IndicadorCalculado/
  OrigemBadge (prototype/shared/js/origem.js e indicador-calculado.js);
  os campos, agrupamento e mocks abaixo são específicos de Fiscal e não
  pertencem a shared.

  Campos e regras seguem exclusivamente docs/02-parametros-fiscais.md,
  seção 4, e o mapeamento UX de Gerais já validado. Agrupamento em 5 seções
  (Enquadramento no Simples Nacional, Indicadores de Apuração, Limites e
  Sublimite, Regime e Credenciais, Segmento de atividade especial — nome
  atualizado em 2026-09-08, ver nota abaixo), sem accordion — a arquitetura
  UX aprovada privilegia visualização direta.

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

  "Perfil de parametrização por atividade" (D35) e "Segmento de atividade
  especial" (D08) — rodada "Tornar D35 e D08 funcionais" (2026-09-08):

  - **D35**: `<select>` funcional (10 opções, incluindo o placeholder
    "Selecione...", dicionário D35 verbatim), editado no mesmo drawer
    "Editar parâmetros gerais" dos demais campos (não inline no card —
    mesma arquitetura de edição já estabelecida nesta trilha). Persistido
    por empresa × vigência no mesmo mecanismo dos demais campos Manuais
    (`FiscalGeraisData.setDadosManuais`) e registrado no Histórico de
    Alterações. **Nenhuma lógica de aplicação automática dos parâmetros do
    perfil foi criada** — a seleção grava apenas a escolha; a mecânica de
    "o que cada perfil configura" continua indefinida na documentação (ver
    docs/parametros-fiscais-as-built.md, seção 13).
  - **D08**: lista de seleção múltipla funcional (13 opções, dicionário D08
    verbatim, com "Nenhum" mutuamente exclusiva das demais), editável no
    mesmo drawer, no mesmo padrão de checklist já usado para D16 em
    `parametros-estaduais-municipais.js` (replicado localmente, mesmo critério de
    duplicação de helpers desta trilha). Persistido e registrado no
    Histórico como os demais campos Manuais.

  **Ajuste de apresentação (2026-09-08, mesmo dia):** origem de D35 no card
  passou de "Sistema" para "Informado manualmente" — mesmo padrão visual/
  comportamental (ícone de lápis, atalho de edição, bloqueio em vigência
  histórica) de todo campo Manual desta aba; nenhuma outra característica
  de D35 mudou. O agrupamento "Segmentação — Fase 2" e o badge "Fase 2" de
  D08 foram removidos — a seção passou a se chamar apenas "Segmento de
  atividade especial" (nome do próprio campo), porque o campo já não é
  mais só informativo. Nenhuma opção, regra de "Nenhum", persistência,
  Histórico ou bloqueio de vigência de D08 foi alterado.

  Nenhuma mecânica de negócio nova foi inventada em nenhum dos dois casos —
  ambos continuam pendências funcionais (ver seção 13 do as-built) quanto
  ao "efeito" que a seleção deveria ter; a interface só torna a ESCOLHA
  funcional e persistente.

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

  // Badges somente leitura para valores multi-selecionados — mesmo padrão
  // já usado em obrigacoes-documentos.js (badgesDocumentos) e
  // parametros-estaduais-municipais.js (badgesLista), replicado localmente aqui para
  // exibir a seleção de D08 no card.
  function badgesSegmento(lista) {
    return lista.map((d) => '<span class="badge badge-secondary">' + d + "</span>").join("");
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
      // D35 — Perfil de parametrização por atividade: select funcional
      // (editado no drawer, ver preencherDrawerGerais), exibido aqui como
      // texto somente leitura — mesmo padrão de todo campo editável desta
      // aba (o card nunca contém controle interativo, só o drawer). Origem
      // exibida como "Informado manualmente" (ajuste de 2026-09-08) — mesmo
      // padrão visual/comportamental dos demais campos Manual da aba
      // (ícone de lápis, atalho de edição, bloqueio em vigência histórica
      // via `!isReadOnly`).
      global.CampoOrigem.campo({
        label: "Perfil de parametrização por atividade",
        value: dados.perfilParametrizacaoAtividade || "Selecione...",
        origem: ORIGENS.MANUAL,
        origemEditavel: !isReadOnly,
        origemCampoKey: "select-perfil-atividade",
      }) +
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
      global.CampoOrigem.campo({ label: "Aviso de proximidade do limite de enquadramento", value: dados.avisoProximidadeLimitePercentual + "%", origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "input-aviso-limite" }) +
      global.CampoOrigem.campo({ label: "Aviso de proximidade do sublimite", value: dados.avisoProximidadeSublimitePercentual + "%", origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "input-aviso-sublimite" }) +
      global.CampoOrigem.campo({ label: "Aviso de troca de faixa de receita bruta", value: dados.avisoTrocaFaixaAtivo ? "Ativo" : "Inativo", origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "checkbox-aviso-troca-faixa" }) +
      "</div></div>";

    const secaoRegime =
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Regime e credenciais</h3>' +
      '<div class="detail-grid">' +
      global.CampoOrigem.campo({ label: "Regime de reconhecimento de receita", value: dados.regimeReconhecimentoReceita, origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "select-regime-reconhecimento" }) +
      global.CampoOrigem.campo({ label: "Código de acesso ao PGDAS-D", value: dados.codigoAcessoPgdasD, origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "input-pgdas-codigo" }) +
      "</div></div>";

    // D08 — Segmento de atividade especial: lista múltipla funcional
    // (editada no drawer, checklist com "Nenhum" mutuamente exclusivo —
    // ver preencherDrawerGerais/wireChecklistSegmento). Ajuste de
    // 2026-09-08: o agrupamento "Segmentação — Fase 2" e o badge "Fase 2"
    // foram removidos da apresentação — o campo já não é mais apenas
    // informativo (ver rodada "Tornar D35 e D08 funcionais"), então manter
    // o rótulo "Fase 2" ao lado de um campo já editável e persistido
    // deixou de fazer sentido. Título da seção passou a ser o próprio nome
    // do campo. Nenhuma outra característica de D08 (opções, regra de
    // "Nenhum", persistência, Histórico, bloqueio em vigência histórica)
    // foi alterada.
    const segmentosSelecionados = dados.segmentoAtividadeEspecial || [];
    const secaoSegmentacao =
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Segmento de atividade especial</h3>' +
      '<div class="detail-grid">' +
      global.CampoOrigem.campo({
        label: "Segmento de atividade especial",
        value: segmentosSelecionados.length ? badgesSegmento(segmentosSelecionados) : '<span class="italic text-muted">Nenhum item selecionado.</span>',
        origem: ORIGENS.MANUAL,
        origemEditavel: !isReadOnly,
        origemCampoKey: "segmento-atividade-checklist",
        wide: true,
      }) +
      "</div></div>";

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
  // parametros-estaduais-municipais.js (field-select-wrap/field-select) — reaproveitado
  // aqui, sem criar um componente novo, para o 5º campo Manual desta aba.
  function selectEdit(id, valor, opcoes) {
    const optsHtml = opcoes.map((o) => '<option value="' + o + '"' + (valor === o ? " selected" : "") + ">" + o + "</option>").join("");
    return (
      '<div class="field-select-wrap"><select class="field-select" id="' + id + '">' + optsHtml + "</select>" +
      '<span class="chev">' + Icon("chevron-down", "size-4") + "</span></div>"
    );
  }

  // Checklist de D08 (Lista múltipla) — "Nenhum" mutuamente exclusiva das
  // demais opções. Mesmo padrão de checklist já usado para D16 em
  // parametros-estaduais-municipais.js (checklistReducoesHtml/wireChecklistReducoes/
  // lerChecklistReducoes), replicado localmente aqui com as opções de D08
  // (nenhuma função compartilhada entre módulos de aba, mesmo critério já
  // adotado nesta trilha).
  function checklistSegmentoHtml(selecionadas) {
    const opcoes = global.FiscalGeraisData.OPCOES_SEGMENTO_ATIVIDADE_ESPECIAL;
    return (
      '<div class="sheet-field"><label class="field-label">Segmento de atividade especial</label>' +
      '<div class="flex flex-col gap-2" id="segmento-atividade-checklist">' +
      opcoes
        .map(
          (o) =>
            '<label class="ucheckbox" data-segmento-opcao="' + o.replace(/"/g, "&quot;") + '"><span class="ucheckbox-box' +
            (selecionadas.indexOf(o) !== -1 ? " is-checked" : "") + '">' + Icon("check", "size-4") + '</span><span class="ucheckbox-label">' + o + "</span></label>"
        )
        .join("") +
      "</div></div>"
    );
  }

  function wireChecklistSegmento() {
    const NENHUM = "Nenhum";
    const container = document.getElementById("segmento-atividade-checklist");
    container.querySelectorAll("[data-segmento-opcao]").forEach((label) => {
      label.addEventListener("click", (e) => {
        e.preventDefault();
        const opcao = label.getAttribute("data-segmento-opcao");
        const box = label.querySelector(".ucheckbox-box");
        const ligar = !box.classList.contains("is-checked");
        if (opcao === NENHUM) {
          container.querySelectorAll("[data-segmento-opcao] .ucheckbox-box").forEach((b) => b.classList.remove("is-checked"));
          if (ligar) box.classList.add("is-checked");
        } else {
          box.classList.toggle("is-checked", ligar);
          if (ligar) {
            const boxNenhum = container.querySelector('[data-segmento-opcao="' + NENHUM + '"] .ucheckbox-box');
            if (boxNenhum) boxNenhum.classList.remove("is-checked");
          }
        }
      });
    });
  }

  function lerChecklistSegmento() {
    const container = document.getElementById("segmento-atividade-checklist");
    const selecionadas = [];
    container.querySelectorAll("[data-segmento-opcao]").forEach((label) => {
      if (label.querySelector(".ucheckbox-box").classList.contains("is-checked")) {
        selecionadas.push(label.getAttribute("data-segmento-opcao"));
      }
    });
    return selecionadas;
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
      '<div class="sheet-field"><label class="field-label" for="select-perfil-atividade">Perfil de parametrização por atividade</label>' +
      selectEdit("select-perfil-atividade", dados.perfilParametrizacaoAtividade || "Selecione...", global.FiscalGeraisData.OPCOES_PERFIL_PARAMETRIZACAO_ATIVIDADE) +
      "</div>" +
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
      '<input class="field-input" type="text" id="input-pgdas-codigo" value="' + dados.codigoAcessoPgdasD + '" /></div>' +
      checklistSegmentoHtml(dados.segmentoAtividadeEspecial || []);

    document.getElementById("checkbox-aviso-troca-faixa").addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#checkbox-aviso-troca-faixa .ucheckbox-box").classList.toggle("is-checked");
    });
    wireChecklistSegmento();
  }

  let empresaDrawerGerais = null;
  let vigenciaDrawerGerais = null;
  let onSalvarDrawerGerais = null;

  // Foca (e leva à vista) o controle do drawer indicado — usado pelo atalho
  // "Informado manualmente" (fiscal-page.js, wireOrigemEditavel), quando o
  // clique parte de um campo específico, em vez do botão genérico "Editar".
  // Sem efeito quando `focusId` não corresponde a um elemento focável (ex.:
  // o pseudo-checkbox de "Aviso de troca de faixa", que não é um <input>
  // nativo) — o drawer ainda abre normalmente, só sem o foco automático.
  function focarCampoDrawer(focusId) {
    if (!focusId) return;
    const el = document.getElementById(focusId);
    if (!el) return;
    if (typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "center" });
    if (typeof el.focus === "function") el.focus();
  }

  function abrirDrawerGerais(empresa, vigenciaId, onSalvar, focusId) {
    ensureDrawerGerais();
    empresaDrawerGerais = empresa;
    vigenciaDrawerGerais = vigenciaId;
    onSalvarDrawerGerais = onSalvar;
    preencherDrawerGerais(empresa, vigenciaId);
    UI.openSheet(document.getElementById("gerais-manual-overlay"), document.getElementById("gerais-manual-panel"));
    focarCampoDrawer(focusId);
  }

  function fecharDrawerGerais() {
    UI.closeSheet(document.getElementById("gerais-manual-overlay"), document.getElementById("gerais-manual-panel"));
  }

  // Rótulos dos campos Manual desta aba, para o Histórico de Alterações
  // (docs/parametros-fiscais-as-built.md, "Vigência Funcional") — usados
  // só para o diff do evento, nunca para a renderização do card/drawer
  // (que já tem seus próprios rótulos, acima). D35 e D08 (rodada "Tornar
  // D35 e D08 funcionais") somam-se aos 5 campos Manuais já existentes.
  const LABELS_HISTORICO_GERAIS = {
    avisoProximidadeLimitePercentual: "Aviso de proximidade do limite de enquadramento",
    avisoProximidadeSublimitePercentual: "Aviso de proximidade do sublimite",
    avisoTrocaFaixaAtivo: "Aviso de troca de faixa de receita bruta",
    regimeReconhecimentoReceita: "Regime de reconhecimento de receita",
    codigoAcessoPgdasD: "Código de acesso ao PGDAS-D",
    perfilParametrizacaoAtividade: "Perfil de parametrização por atividade",
    segmentoAtividadeEspecial: "Segmento de atividade especial",
  };

  const FORMATADORES_HISTORICO_GERAIS = {
    avisoProximidadeLimitePercentual: (v) => (v === undefined || v === null || v === "" ? "—" : v + "%"),
    avisoProximidadeSublimitePercentual: (v) => (v === undefined || v === null || v === "" ? "—" : v + "%"),
    avisoTrocaFaixaAtivo: (v) => (v ? "Ativo" : "Inativo"),
    perfilParametrizacaoAtividade: (v) => (!v || v === "Selecione..." ? "—" : v),
    // segmentoAtividadeEspecial (array) NÃO entra aqui — ver
    // formatarSegmentoParaDiff abaixo: precisa ser convertido para texto
    // ANTES do diff, não depois (mesmo motivo já registrado em
    // parametros-estaduais-municipais.js para reducoesDeducoesBaseSn/D16).
  };

  // reducoesDeducoesBaseSn (D16, parametros-estaduais-municipais.js) tem o mesmo
  // problema: diffCampos compara "antes[chave] === depois[chave]" por
  // igualdade estrita (historico-eventos.js) — dois arrays com o mesmo
  // conteúdo nunca são === entre si. Por isso o valor é convertido para
  // texto (join) antes de chamar diffCampos, não depois.
  function formatarSegmentoParaDiff(v) {
    return Array.isArray(v) && v.length ? v.join(", ") : "—";
  }

  function salvarDrawerGerais() {
    const anterior = global.FiscalGeraisData.getDadosGerais(empresaDrawerGerais.codigo, vigenciaDrawerGerais);
    const novosValores = {
      avisoProximidadeLimitePercentual: document.getElementById("input-aviso-limite").value.trim(),
      avisoProximidadeSublimitePercentual: document.getElementById("input-aviso-sublimite").value.trim(),
      avisoTrocaFaixaAtivo: document.querySelector("#checkbox-aviso-troca-faixa .ucheckbox-box").classList.contains("is-checked"),
      regimeReconhecimentoReceita: document.getElementById("select-regime-reconhecimento").value,
      codigoAcessoPgdasD: document.getElementById("input-pgdas-codigo").value,
      perfilParametrizacaoAtividade: document.getElementById("select-perfil-atividade").value,
      segmentoAtividadeEspecial: lerChecklistSegmento(),
    };
    global.FiscalGeraisData.setDadosManuais(empresaDrawerGerais.codigo, vigenciaDrawerGerais, novosValores);
    const anteriorParaDiff = Object.assign({}, anterior, { segmentoAtividadeEspecial: formatarSegmentoParaDiff(anterior.segmentoAtividadeEspecial) });
    const novosValoresParaDiff = Object.assign({}, novosValores, { segmentoAtividadeEspecial: formatarSegmentoParaDiff(novosValores.segmentoAtividadeEspecial) });
    const alteracoes = global.FiscalHistoricoEventos.diffCampos(LABELS_HISTORICO_GERAIS, anteriorParaDiff, novosValoresParaDiff, FORMATADORES_HISTORICO_GERAIS);
    if (alteracoes.length) {
      global.FiscalHistoricoEventos.registrarEventoHistoricoFiscal(empresaDrawerGerais.codigo, "Gerais", vigenciaDrawerGerais, alteracoes);
    }
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
  // `focusId` (opcional, rodada "Informado manualmente como atalho para
  // edição"): id do controle do drawer a focar — vem do atributo
  // data-origem-editar-campo do indicador de origem clicado (ver
  // wireOrigemEditavel, fiscal-page.js). Omitido, o comportamento é
  // idêntico ao de antes desta rodada (botão "Editar" genérico).
  function abrirEdicao(empresa, vigenciaId, onSalvo, focusId) {
    abrirDrawerGerais(empresa, vigenciaId, onSalvo, focusId);
  }

  global.FiscalGerais = { renderConteudo: renderConteudo, abrirEdicao: abrirEdicao, renderNaoAplicavel: renderNaoAplicavel };
})(window);
