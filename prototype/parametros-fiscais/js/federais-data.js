/*
  Dados mockados da aba Federais — exclusivos da trilha Fiscal.

  O único campo do MVP (INSS patronal fora do DAS) só existe quando o Anexo
  da empresa é IV — a checagem de aplicabilidade usa o mesmo dado de Anexo
  já mockado para Gerais (FiscalGeraisData.getDadosGerais(codigo).anexoCodigo),
  não duplicado aqui (ver prototype/parametros-fiscais/js/federais.js).

  O valor abaixo é mock técnico de demonstração — nenhum cálculo real de
  INSS patronal foi feito; existe só para exercitar o estado "disponível"
  do Indicador Calculado quando a empresa tiver Anexo IV.
*/
(function (global) {
  const INSS_PATRONAL_FORA_DO_DAS = {
    // Comércio Horizonte (CH-0042) é a única empresa mockada com Anexo IV
    // nesta etapa (ver gerais-data.js) — valor de demonstração, não um
    // cálculo real de INSS patronal.
    "CH-0042": "R$ 1.840,00",
  };

  function getInssPatronalForaDoDas(codigoEmpresa) {
    return Object.prototype.hasOwnProperty.call(INSS_PATRONAL_FORA_DO_DAS, codigoEmpresa)
      ? INSS_PATRONAL_FORA_DO_DAS[codigoEmpresa]
      : null;
  }

  global.FiscalFederaisData = { getInssPatronalForaDoDas: getInssPatronalForaDoDas };
})(window);
