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

  Rodada de complementação de conteúdo (docs/02-parametros-fiscais.md,
  seção 10, campos Desejável) adiciona: "Cupom fiscal pelo valor total",
  "Separar frete, pedágio, seguro, despesas e desconto" e "Separar IPI e
  ICMS ST das entradas" (Checkbox, Manual) + "Controle de estoque" (D29,
  Lista suspensa, Manual, opções reproduzidas literalmente da seção 14).

  "Ajuste a Valor Presente (AVP)", "Mostrar rateio de centro de custos" e
  "Gerar lançamentos em outra empresa" (rodada "Ajuste funcional —
  Contábil × Fiscal", 2026-09-09): documentados como Fase 2
  (docs/02-parametros-fiscais.md, seção 10), mas tornados funcionais por
  decisão explícita de produto desta rodada — mesmo critério já aplicado
  aos 3 campos de Estaduais e Municipais e ao SINTEGRA em Obrigações e
  Documentos Fiscais: Checkbox, Manual, mock booleano (`false`/Inativo —
  nenhuma empresa tinha estado algum antes desta rodada), persistido na
  mesma chave já existente (MANUAL_OVERRIDES_KEY, abaixo). Nenhuma lógica
  de negócio (cálculo de AVP, rateio, geração de lançamentos em outra
  empresa) foi implementada — apenas o booleano de habilitação.
*/
(function (global) {
  const OPCOES_CLASSIFICACAO_CONTA = [
    "Conta única para todos",
    "Uma conta por cadastro",
    "Uma conta por cadastro, código igual ao da conta",
  ];

  const OPCOES_CONTROLE_ESTOQUE = ["Não controla", "Controla por quantidade", "Controla por quantidade e valor"];

  const PADRAO = {
    classificacaoContaFornecedores: "Conta única para todos",
    classificacaoContaClientes: "Conta única para todos",
    cupomFiscalValorTotal: false,
    separarFretePedagioSeguroDespesaDesconto: false,
    separarIpiIcmsStEntradas: false,
    controleEstoque: "Não controla",
    ajusteValorPresente: false,
    mostrarRateioCentroCustos: false,
    gerarLancamentosOutraEmpresa: false,
  };

  const POR_EMPRESA = {
    "PA-0011": {
      classificacaoContaFornecedores: "Uma conta por cadastro",
      classificacaoContaClientes: "Uma conta por cadastro",
      cupomFiscalValorTotal: true,
      separarFretePedagioSeguroDespesaDesconto: true,
      separarIpiIcmsStEntradas: false,
      controleEstoque: "Controla por quantidade",
      ajusteValorPresente: false,
      mostrarRateioCentroCustos: false,
      gerarLancamentosOutraEmpresa: false,
    },
    // CH-0042: valores diferentes de PA-0011 só para exercitar as opções
    // do dicionário visualmente — os campos permanecem independentes uns
    // dos outros no código (mesmo espírito das demais abas: variedade de
    // demonstração, não uma regra de correlação entre eles).
    "CH-0042": {
      classificacaoContaFornecedores: "Conta única para todos",
      classificacaoContaClientes: "Uma conta por cadastro, código igual ao da conta",
      cupomFiscalValorTotal: false,
      separarFretePedagioSeguroDespesaDesconto: false,
      separarIpiIcmsStEntradas: true,
      controleEstoque: "Controla por quantidade e valor",
      ajusteValorPresente: false,
      mostrarRateioCentroCustos: false,
      gerarLancamentosOutraEmpresa: false,
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

  // Persistência dos campos Manual desta aba, por empresa × vigência, em
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
    OPCOES_CONTROLE_ESTOQUE: OPCOES_CONTROLE_ESTOQUE,
  };
})(window);
