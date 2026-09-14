/*
  Badge de Origem + Campo com Origem — componentes compartilhados definidos
  em docs/parametros-fiscais-arquitetura.md, seção 14. Fiscal é a primeira
  trilha a consumi-los, mas ambos são genéricos: nenhuma regra de campo
  fiscal (RBT12, Fator R etc.) vive aqui — isso fica em
  prototype/parametros-fiscais/.

  Decisão de UX aprovada (ver prototype/parametros-fiscais/exploracao-origem.html,
  alternativa A): badge textual neutro sobre .badge/.badge-outline já
  existentes — nenhuma classe de badge nova foi criada. Origem é
  proveniência do dado, não status: nunca usa badge-success/-warning/
  -destructive/-info, não tem ícone por origem e não tem tooltip (decisão
  registrada como pendência separada na auditoria de Padrões de Dados e
  Origem).

  Campo com Origem é uma evolução ADITIVA de .detail-field
  (shared/css/components.css): a origem é apenas um terceiro filho opcional
  do mesmo .detail-field já usado em Empresas (dados-gerais.js, atividades.js,
  responsavel-legal.js) — chamar campo() sem `origem` produz exatamente o
  mesmo HTML que essas telas já montam à mão, então nenhuma delas muda de
  aparência.
*/
(function (global) {
  // Rótulos oficiais de origem — docs/02-parametros-fiscais.md, seção 2
  // ("Origem do dado"). Não alterar sem atualizar a fonte funcional.
  const ORIGENS = {
    MANUAL: "Manual",
    COCKPIT: "Cockpit",
    API_GOV_COCKPIT: "API gov. · Cockpit",
    MOTOR_CALCULO: "Motor de cálculo",
    BHULES: "BHules",
    SERPRO: "SERPRO",
    LEGISLACAO: "Legislação",
    SISTEMA: "Sistema",
  };

  function origemBadge(origemLabel) {
    return '<span class="badge badge-outline">' + origemLabel + "</span>";
  }

  // opts:
  //   label      — rótulo do campo (obrigatório)
  //   value      — conteúdo somente leitura (vira .detail-field-value); ignorado se `inputHtml` for informado
  //   inputHtml  — markup de um controle editável já pronto (ex.: .field-input); tem prioridade sobre `value`
  //   origem     — rótulo textual da origem (ex.: ORIGENS.COCKPIT); omitir não renderiza badge nenhum
  //   wide       — mesmo modificador .detail-field-wide já existente
  function campo(opts) {
    const wide = opts.wide ? " detail-field-wide" : "";
    const valueHtml =
      opts.inputHtml != null
        ? opts.inputHtml
        : '<div class="detail-field-value">' + (opts.value != null ? opts.value : "") + "</div>";
    const origemHtml = opts.origem ? origemBadge(opts.origem) : "";
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
