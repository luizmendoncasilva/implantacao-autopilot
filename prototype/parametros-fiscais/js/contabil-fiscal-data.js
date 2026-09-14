/*
  Mocks da aba "Contábil × Fiscal" — exclusivos da trilha Fiscal.
  Escopo EXCLUSIVO do MVP (docs/02-parametros-fiscais.md, seção 10, campos
  Essenciais): "Classificação de conta — Fornecedores" e "Classificação de
  conta — Clientes" são os únicos 2 campos com mock aqui (Manual, Lista
  suspensa, dicionário D27). Os 3 campos restantes do MVP ("Gerar
  lançamentos contábeis automaticamente", "Tipo de lançamento contábil",
  "Conta cliente/fornecedor em pagamento à vista") são Regra fixa/Sistema —
  o próprio texto da regra, reproduzido de docs/02-parametros-fiscais.md,
  seção 10, é o "valor" exibido; não têm mock por empresa nem estado
  algum (nunca mudam, não têm origem "Manual").

  Opções de D27 (docs/02-parametros-fiscais.md, seção 14) reproduzidas
  literalmente — nenhuma opção inventada.
*/
(function (global) {
  const OPCOES_CLASSIFICACAO_CONTA = [
    "Conta única para todos",
    "Uma conta por cadastro",
    "Uma conta por cadastro, código igual ao da conta",
  ];

  const PADRAO = {
    classificacaoContaFornecedores: "Conta única para todos",
    classificacaoContaClientes: "Conta única para todos",
  };

  const POR_EMPRESA = {
    "PA-0011": {
      classificacaoContaFornecedores: "Uma conta por cadastro",
      classificacaoContaClientes: "Uma conta por cadastro",
    },
    // CH-0042: valores diferentes de PA-0011 só para exercitar as 3 opções
    // do dicionário visualmente — os dois campos permanecem independentes
    // um do outro no código (mesmo espírito das demais abas: variedade de
    // demonstração, não uma regra de correlação entre os dois campos).
    "CH-0042": {
      classificacaoContaFornecedores: "Conta única para todos",
      classificacaoContaClientes: "Uma conta por cadastro, código igual ao da conta",
    },
  };

  // vigenciaId (etapa "Vigência Funcional"): ver comentário equivalente em
  // gerais-data.js.
  function getDados(codigoEmpresa, vigenciaId) {
    const base = POR_EMPRESA[codigoEmpresa] || PADRAO;
    const overridesEmpresa = getOverrides()[codigoEmpresa] || {};
    const overrideVigencia = vigenciaId ? overridesEmpresa[vigenciaId] : null;
    return overrideVigencia ? Object.assign({}, base, overrideVigencia) : base;
  }

  // Persistência dos 2 campos Manual desta aba (rodada de refinamento
  // funcional — jornada de edição), por empresa × vigência, em
  // localStorage — mesmo padrão técnico já usado em `gerais-data.js`. Não
  // altera os 3 campos Regra fixa/Sistema.
  const MANUAL_OVERRIDES_KEY = "autopilot_prototype_fiscal_contabil_fiscal_manual_v1";
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

  global.FiscalContabilFiscalData = {
    getDados: getDados,
    setDadosManuais: setDadosManuais,
    OPCOES_CLASSIFICACAO_CONTA: OPCOES_CLASSIFICACAO_CONTA,
  };
})(window);
