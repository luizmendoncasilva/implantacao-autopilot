/*
  Badge de Origem + Campo com Origem — componentes compartilhados definidos
  em docs/parametros-fiscais-arquitetura.md, seção 14. Fiscal é a primeira
  trilha a consumi-los, mas ambos são genéricos: nenhuma regra de campo
  fiscal (RBT12, Fator R etc.) vive aqui — isso fica em
  prototype/parametros-fiscais/.

  Decisão de UX original (ver prototype/parametros-fiscais/exploracao-origem.html,
  alternativa A): badge textual neutro sobre .badge/.badge-outline —
  substituída nesta rodada ("Refinação visual — Origem dos dados", auditoria
  de Padrões de Dados e Origem) por um indicador dedicado (`.field-origin`,
  shared/css/components.css), com ícone semântico por origem — os badges de
  origem eram visualmente indistinguíveis de qualquer outro badge/tag/status
  do produto (mesma pílula usada por "Fase 2", pelo usuário do Histórico
  etc.), o que não deixava claro que representavam proveniência do dado.
  Origem continua sendo proveniência, não status: nunca usa cor semântica
  de status (success/warning/destructive/info) e não tem tooltip (pendência
  separada, não resolvida nesta rodada).

  Campo com Origem é uma evolução ADITIVA de .detail-field
  (shared/css/components.css): a origem é apenas um terceiro filho opcional
  do mesmo .detail-field já usado em Empresas (dados-gerais.js, atividades.js,
  responsavel-legal.js) — chamar campo() sem `origem` produz exatamente o
  mesmo HTML que essas telas já montam à mão, então nenhuma delas muda de
  aparência.
*/
(function (global) {
  // Rótulos oficiais de origem — docs/02-parametros-fiscais.md, seção 2
  // ("Origem do dado"). Só o vocabulário de MANUAL mudou nesta rodada
  // ("Manual" → "Informado manualmente", vocabulário mais explícito para o
  // usuário final — mesmo significado documentado: "preenchido pelo
  // usuário na própria tela"). Os demais rótulos são os mesmos já
  // documentados; não alterar sem atualizar a fonte funcional.
  //
  // "API gov. · Cockpit" permanece uma ÚNICA origem (não duas): a fonte
  // define-a como uma cadeia só ("Consultado na API pública de CNPJ e
  // persistido no Cockpit", seção 2) — verificado antes desta rodada, para
  // não quebrar esse significado em dois badges separados sem uma decisão
  // de produto que sustente isso.
  const ORIGENS = {
    MANUAL: "Informado manualmente",
    COCKPIT: "Cockpit",
    API_GOV_COCKPIT: "API gov. · Cockpit",
    MOTOR_CALCULO: "Motor de cálculo",
    BHULES: "BHules",
    SERPRO: "SERPRO",
    LEGISLACAO: "Legislação",
    SISTEMA: "Sistema",
    // Cadastro de Empresas: valor derivado pelo próprio Autopilot de outro
    // vínculo seu (ex.: Contador responsável sem seleção explícita, herdado
    // da aba Contadores) — decisão de produto de 2026-10-02.
    AUTOPILOT: "Autopilot",
  };

  // Ícone semântico por origem — reaproveita exclusivamente o conjunto já
  // definido em shared/js/icons.js (nenhum ícone novo, nenhum emoji).
  // Escolha (documentada para não ser redescoberta depois):
  //  - Informado manualmente → pencil (o usuário digitou o valor)
  //  - Cockpit               → building-2 (sistema cadastral externo)
  //  - API gov. · Cockpit    → landmark (consulta a uma API pública/governamental)
  //  - Motor de cálculo      → wrench (mecanismo que produz o valor)
  //  - BHules                → folder (classificação/catálogo por operação)
  //  - SERPRO                → download (consulta automatizada a fonte externa)
  //  - Legislação            → book-open-check (valor fixado por norma)
  //  - Sistema               → sliders-horizontal (regra interna/parametrização do Autopilot)
  //  - Autopilot             → bot (valor definido pelo próprio Autopilot)
  const ORIGEM_ICONE = {};
  ORIGEM_ICONE[ORIGENS.MANUAL] = "pencil";
  ORIGEM_ICONE[ORIGENS.COCKPIT] = "building-2";
  ORIGEM_ICONE[ORIGENS.API_GOV_COCKPIT] = "landmark";
  ORIGEM_ICONE[ORIGENS.MOTOR_CALCULO] = "wrench";
  ORIGEM_ICONE[ORIGENS.BHULES] = "folder";
  ORIGEM_ICONE[ORIGENS.SERPRO] = "download";
  ORIGEM_ICONE[ORIGENS.LEGISLACAO] = "book-open-check";
  ORIGEM_ICONE[ORIGENS.SISTEMA] = "sliders-horizontal";
  ORIGEM_ICONE[ORIGENS.AUTOPILOT] = "bot";

  // `.field-origin` (shared/css/components.css) — indicador discreto de
  // metadado, deliberadamente distinto de `.badge` (usado no resto do
  // produto para status/contagem/tags de ação) para não parecer um
  // controle/filtro. Não usa cor semântica de status — só
  // `var(--muted-foreground)`, mais leve que `.detail-field-value`, para
  // manter a hierarquia campo > valor > origem.
  //
  // `opts` (todos opcionais, rodada "Informado manualmente como atalho para
  // edição"): quando `editavel` é true (só é passado pelo chamador quando a
  // origem é ORIGENS.MANUAL E a vigência ativa está selecionada — nunca em
  // vigência histórica), renderiza um <button> em vez de <span>, com
  // `data-origem-editar-campo` = `opts.campoKey` (id do controle correspondente
  // no drawer de edição já existente) e `aria-label` = `opts.tituloAcessivel`.
  // O clique é wireado por quem monta a tela (fiscal-page.js,
  // `wireOrigemEditavel`) — este arquivo só decide a marcação, nunca abre
  // nenhum drawer sozinho. Nenhuma outra origem passa `editavel: true`.
  function origemBadge(origemLabel, opts) {
    opts = opts || {};
    const iconName = ORIGEM_ICONE[origemLabel] || "info";
    const conteudo = global.Icon(iconName, "size-3-5") + "<span>" + origemLabel + "</span>";
    if (opts.editavel) {
      return (
        '<button type="button" class="field-origin field-origin-clickable" data-origem-editar-campo="' +
        (opts.campoKey || "") +
        '" aria-label="' + (opts.tituloAcessivel || origemLabel) + '">' +
        conteudo +
        "</button>"
      );
    }
    return '<span class="field-origin">' + conteudo + "</span>";
  }

  // opts:
  //   label            — rótulo do campo (obrigatório)
  //   value            — conteúdo somente leitura (vira .detail-field-value); ignorado se `inputHtml` for informado
  //   inputHtml        — markup de um controle editável já pronto (ex.: .field-input); tem prioridade sobre `value`
  //   origem           — rótulo textual da origem (ex.: ORIGENS.COCKPIT); omitir não renderiza badge nenhum
  //   origemEditavel   — true torna o indicador de origem um atalho clicável para o drawer de edição (só deve ser
  //                      passado pelo chamador quando `origem` é ORIGENS.MANUAL e a vigência ativa está selecionada)
  //   origemCampoKey   — id do controle do drawer a focar ao abrir via atalho (ver wireOrigemEditavel, fiscal-page.js)
  //   wide             — mesmo modificador .detail-field-wide já existente
  function campo(opts) {
    const wide = opts.wide ? " detail-field-wide" : "";
    const valueHtml =
      opts.inputHtml != null
        ? opts.inputHtml
        : '<div class="detail-field-value">' + (opts.value != null ? opts.value : "") + "</div>";
    const origemHtml = opts.origem
      ? origemBadge(opts.origem, {
          editavel: !!opts.origemEditavel,
          campoKey: opts.origemCampoKey,
          tituloAcessivel: "Editar " + opts.label,
        })
      : "";
    return (
      '<div class="detail-field' + wide + '">' +
      '<span class="detail-field-label">' + opts.label + "</span>" +
      valueHtml +
      origemHtml +
      "</div>"
    );
  }

  global.OrigemBadge = { render: origemBadge, ORIGENS: ORIGENS };
  global.CampoOrigem = { campo: campo, ORIGENS: ORIGENS };
})(window);
