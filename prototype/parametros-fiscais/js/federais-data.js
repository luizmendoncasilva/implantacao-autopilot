/*
  Dados mockados da aba Federais — exclusivos da trilha Fiscal.

  "INSS patronal fora do DAS" (MVP) só existe quando o Anexo da empresa é
  IV — a checagem de aplicabilidade usa o mesmo dado de Anexo já mockado
  para Gerais (FiscalGeraisData.getDadosGerais(codigo).anexoCodigo), não
  duplicado aqui (ver prototype/parametros-fiscais/js/federais.js).

  Rodada de complementação de conteúdo (Desejável, docs/02-parametros-
  fiscais.md, seção 5): "Retenção de INSS sobre serviços prestados"
  (Calculado, Motor de cálculo) e "Tributação monofásica ou ST de
  PIS/COFINS" (Calculado, BHules) somam-se ao indicador já existente, sem
  nenhuma regra de aplicabilidade adicional documentada (ao contrário do
  INSS patronal, nenhuma delas depende do Anexo). "Opção pela CPRB"
  (Checkbox, Manual) é o único campo editável desta aba — persistência por
  empresa × vigência, mesmo padrão técnico já usado nas demais abas desta
  trilha.

  Os valores abaixo são mock técnico de demonstração — nenhum cálculo real
  de INSS, classificação de NCM ou CPRB foi feito; existem só para
  exercitar os estados documentados do Indicador Calculado.
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

  // "Retenção de INSS sobre serviços prestados" — sem regra de
  // aplicabilidade documentada (diferente do INSS patronal, que só existe
  // no Anexo IV); mock demonstra o estado "disponível" numa empresa e
  // "sem valor disponível" na outra.
  const RETENCAO_INSS_SERVICOS_PRESTADOS = {
    "CH-0042": "R$ 620,00",
  };

  function getRetencaoInssServicosPrestados(codigoEmpresa) {
    return Object.prototype.hasOwnProperty.call(RETENCAO_INSS_SERVICOS_PRESTADOS, codigoEmpresa)
      ? RETENCAO_INSS_SERVICOS_PRESTADOS[codigoEmpresa]
      : null;
  }

  // "Tributação monofásica ou ST de PIS/COFINS" — "apenas exibido no
  // Autopilot, sem parametrização" (docs/02-parametros-fiscais.md, seção
  // 5): texto de classificação, não valor monetário.
  const TRIBUTACAO_MONOFASICA_ST = {
    "PA-0011": "Parte dos itens sujeita a monofásico/ST (classificação por NCM no BHules).",
  };

  function getTributacaoMonofasicaSt(codigoEmpresa) {
    return Object.prototype.hasOwnProperty.call(TRIBUTACAO_MONOFASICA_ST, codigoEmpresa)
      ? TRIBUTACAO_MONOFASICA_ST[codigoEmpresa]
      : null;
  }

  // "Opção pela CPRB" — único campo Manual desta aba.
  const PADRAO = { cprbOptante: false };

  const POR_EMPRESA = {
    "PA-0011": { cprbOptante: false },
    "CH-0042": { cprbOptante: true },
  };

  // vigenciaId (etapa "Vigência Funcional"): ver comentário equivalente em
  // gerais-data.js.
  function getDados(codigoEmpresa, vigenciaId) {
    const base = POR_EMPRESA[codigoEmpresa] || PADRAO;
    const overridesEmpresa = getOverrides()[codigoEmpresa] || {};
    const overrideVigencia = vigenciaId ? overridesEmpresa[vigenciaId] : null;
    return overrideVigencia ? Object.assign({}, base, overrideVigencia) : base;
  }

  // Persistência do único campo Manual desta aba, por empresa × vigência,
  // em localStorage — mesmo padrão técnico já usado em `gerais-data.js`.
  const MANUAL_OVERRIDES_KEY = "autopilot_prototype_fiscal_federais_manual_v1";
  function getOverrides() {
    try {
      const raw = window.localStorage.getItem(MANUAL_OVERRIDES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function setDadosManuais(codigoEmpresa, vigenciaId, valores) {
    const overrides = getOverrides();
    overrides[codigoEmpresa] = overrides[codigoEmpresa] || {};
    overrides[codigoEmpresa][vigenciaId] = valores;
    try {
      window.localStorage.setItem(MANUAL_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch (e) {
      /* localStorage indisponível — segue só em memória nesta renderização */
    }
  }

  global.FiscalFederaisData = {
    getInssPatronalForaDoDas: getInssPatronalForaDoDas,
    getRetencaoInssServicosPrestados: getRetencaoInssServicosPrestados,
    getTributacaoMonofasicaSt: getTributacaoMonofasicaSt,
    getDados: getDados,
    setDadosManuais: setDadosManuais,
  };
})(window);
