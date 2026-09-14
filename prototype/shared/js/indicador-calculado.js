/*
  Indicador Calculado — especialização do Campo com Origem (shared/js/origem.js)
  para valores que o Autopilot nunca decide, apenas consome
  (docs/parametros-fiscais-arquitetura.md, seção 14). Genérico: nenhuma
  regra de RBT12, Fator R etc. vive aqui — a Fiscal só chama
  IndicadorCalculado.render() passando seus próprios dados.

  Estados: "available" (padrão — reaproveita CampoOrigem.campo tal como
  está), "loading" (reaproveita .skeleton já existente, sem animação nova),
  "unavailable" (texto discreto via .detail-field-unavailable — não usa o
  componente Empty do Design System, dimensionado para telas/seções vazias,
  não para um campo individual) e "not-applicable" (texto discreto via
  .detail-field-not-applicable — peso/estilo normal, para não ser confundido
  com "unavailable", que é itálico; decisão validada em
  prototype/parametros-fiscais/exploracao-nao-aplicavel.html, Alternativa A:
  "não aplicável" é um estado esperado do negócio, não uma falha de origem,
  então não deve emprestar o registro visual de "algo deu errado"). Não
  implementa link de detalhe nesta etapa.
*/
(function (global) {
  function render(opts) {
    if (opts.state === "loading") {
      const wide = opts.wide ? " detail-field-wide" : "";
      const labelWidth = opts.labelWidth || "90px";
      const valueWidth = opts.valueWidth || "130px";
      return (
        '<div class="detail-field' + wide + '" role="status" aria-live="polite" aria-busy="true">' +
        '<span class="sr-only">Carregando ' + opts.label + "…</span>" +
        '<span class="skeleton" style="width:' + labelWidth + '; height:11px;"></span>' +
        '<span class="skeleton" style="width:' + valueWidth + '; height:15px;"></span>' +
        "</div>"
      );
    }

    if (opts.state === "unavailable") {
      return global.CampoOrigem.campo({
        label: opts.label,
        value: '<span class="detail-field-unavailable">' + (opts.unavailableText || "Não disponível no momento") + "</span>",
        origem: opts.origem,
        wide: opts.wide,
      });
    }

    if (opts.state === "not-applicable") {
      return global.CampoOrigem.campo({
        label: opts.label,
        value: '<span class="detail-field-not-applicable">' + (opts.notApplicableText || "Não aplicável ao enquadramento") + "</span>",
        origem: opts.origem,
        wide: opts.wide,
      });
    }

    return global.CampoOrigem.campo({
      label: opts.label,
      value: opts.value,
      origem: opts.origem,
      wide: opts.wide,
    });
  }

  global.IndicadorCalculado = { render: render };
})(window);
