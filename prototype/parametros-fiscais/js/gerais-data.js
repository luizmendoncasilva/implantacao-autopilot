/*
  Dados mockados da aba Gerais — exclusivos da trilha Fiscal (a composição
  visual dos campos usa os componentes compartilhados CampoOrigem/
  IndicadorCalculado, mas os valores em si pertencem só a esta trilha).

  Cobre exclusivamente os campos de docs/02-parametros-fiscais.md, seção 4,
  classificados como Essencial ou Desejável no mapeamento UX de Gerais.
  Nenhum valor aqui representa cálculo real — são exemplos fixos por
  empresa, para demonstrar os estados documentados (disponível, sem valor
  disponível) sem inventar regra de negócio nenhuma.

  `indicadoresIndisponiveis` é mock técnico: existe só para a empresa
  "Comércio Horizonte" (CH-0042) demonstrar o estado "sem valor disponível"
  do Indicador Calculado (arquitetura, seção 14) — não representa nenhuma
  regra real de indisponibilidade.

  `anexoCodigo` (adicionado nesta etapa) é a forma legível-por-máquina do
  mesmo Anexo já exibido em `anexoResumo` — existe para que a aba Federais
  possa checar "Anexo = IV" sem duplicar/reinterpretar o texto de exibição
  (prototype/parametros-fiscais/js/federais.js lê este campo). Não é um
  campo novo de negócio, é só a mesma informação em formato comparável.

  `regimeReconhecimentoReceita` (fechamento D06 — tarefa "Fechamento final,
  Parâmetros Fiscais"): decisão de produto tratou o campo como parâmetro
  Manual/configurável, com exatamente as 2 opções do dicionário D01... D06
  (docs/02-parametros-fiscais.md, seção 14 — Competência/Caixa), em vez de
  Motor de cálculo/somente leitura. Nenhuma opção nova foi criada.
*/
(function (global) {
  // Opções de D06 (docs/02-parametros-fiscais.md, seção 14) reproduzidas
  // literalmente — nenhuma opção inventada.
  const OPCOES_REGIME_RECONHECIMENTO_RECEITA = ["Competência", "Caixa"];

  const PADRAO = {
    dataOpcaoSN: "01/01/2015",
    mei: "Não",
    anexoCodigo: "I",
    anexoResumo: "Anexo I — Comércio · 100% da receita",
    rbt12: "R$ 1.100.000,00",
    rba: "R$ 850.000,00",
    fatorR: "22,8%",
    limiteMercadoInterno: "R$ 4.800.000,00",
    limiteExportacao: "R$ 4.800.000,00",
    sublimiteIcmsIss: "R$ 3.600.000,00",
    avisoProximidadeLimitePercentual: "80",
    avisoProximidadeSublimitePercentual: "80",
    avisoTrocaFaixaAtivo: false,
    regimeReconhecimentoReceita: "Competência",
    codigoAcessoPgdasD: "••••••••••••",
    indicadoresIndisponiveis: [],
  };

  const POR_EMPRESA = {
    // Padaria Aurora — Simples Nacional
    "PA-0011": {
      dataOpcaoSN: "15/03/2015",
      mei: "Não",
      anexoCodigo: "I",
      anexoResumo: "Anexo I — Comércio · 100% da receita",
      rbt12: "R$ 1.250.000,00",
      rba: "R$ 980.000,00",
      fatorR: "31,4%",
      limiteMercadoInterno: "R$ 4.800.000,00",
      limiteExportacao: "R$ 4.800.000,00",
      sublimiteIcmsIss: "R$ 3.600.000,00",
      avisoProximidadeLimitePercentual: "80",
      avisoProximidadeSublimitePercentual: "80",
      avisoTrocaFaixaAtivo: false,
      regimeReconhecimentoReceita: "Competência",
      codigoAcessoPgdasD: "••••••••••••",
      indicadoresIndisponiveis: [],
    },
    // Comércio Horizonte — Simples Nacional, mais próxima do sublimite;
    // Fator R marcado como indisponível só para demonstrar o estado (mock
    // técnico, não é uma regra real de indisponibilidade).
    //
    // anexoCodigo/anexoResumo reclassificados nesta etapa (Fiscal > Federais)
    // para "Anexo IV — Serviços": é a única forma de exercitar o estado
    // "disponível" do indicador de Federais (INSS patronal fora do DAS, que
    // só existe quando Anexo = IV) sem alterar EmpresasData (só há duas
    // empresas optantes pelo Simples Nacional no mock compartilhado —
    // PA-0011 e CH-0042 — e criar uma terceira empresa pertence à trilha
    // Empresas, fora do escopo desta tarefa). "Comércio Horizonte" continua
    // sendo comércio no cadastro de Empresas (nome, CNPJ, atividade); esta
    // reclassificação de Anexo é dado técnico de demonstração EXCLUSIVO do
    // mock de Fiscal, não uma alteração de cadastro real — registrado aqui
    // para que a divergência entre o nome da empresa e o Anexo mockado não
    // seja lida como inconsistência não intencional.
    "CH-0042": {
      dataOpcaoSN: "02/01/2020",
      mei: "Não",
      anexoCodigo: "IV",
      anexoResumo: "Anexo IV — Serviços · 100% da receita",
      rbt12: "R$ 2.980.000,00",
      rba: "R$ 2.410.000,00",
      fatorR: null,
      limiteMercadoInterno: "R$ 4.800.000,00",
      limiteExportacao: "R$ 4.800.000,00",
      sublimiteIcmsIss: "R$ 3.600.000,00",
      avisoProximidadeLimitePercentual: "80",
      avisoProximidadeSublimitePercentual: "70",
      avisoTrocaFaixaAtivo: true,
      regimeReconhecimentoReceita: "Caixa",
      codigoAcessoPgdasD: "••••••••••••",
      indicadoresIndisponiveis: ["fatorR"],
    },
  };

  // Empresas não listadas acima usam PADRAO — cobre qualquer código de
  // empresa optante pelo Simples Nacional que não tenha mock dedicado (ex.:
  // empresas importadas via prototype/empresas/importar.html).
  //
  // vigenciaId (etapa "Vigência Funcional"): os 4 campos Manual passam a
  // ter um snapshot próprio POR VIGÊNCIA, não só por empresa — override
  // agora é { [codigoEmpresa]: { [vigenciaId]: valores } }. Sem override
  // para a vigência pedida (ex.: vigência seed nunca editada), cai no valor
  // base (mesmo comportamento de antes desta etapa) — limitação registrada
  // no as-built: vigências históricas anteriores a esta etapa não têm um
  // snapshot real próprio, só o valor base.
  function getDadosGerais(codigoEmpresa, vigenciaId) {
    const base = POR_EMPRESA[codigoEmpresa] || PADRAO;
    const overridesEmpresa = getOverrides()[codigoEmpresa] || {};
    const overrideVigencia = vigenciaId ? overridesEmpresa[vigenciaId] : null;
    return overrideVigencia ? Object.assign({}, base, overrideVigencia) : base;
  }

  // Persistência dos 4 campos Manual desta aba (rodada de refinamento
  // funcional — jornada de edição), por empresa × vigência, em
  // localStorage — mesmo padrão técnico já usado em outras trilhas do
  // protótipo (ex.: overrides de Dados Gerais em Empresas), aplicado aqui
  // pela primeira vez em Fiscal. Não altera os 11 campos Essenciais
  // (Cockpit/Motor de cálculo/Legislação) nem `EmpresasData`.
  const MANUAL_OVERRIDES_KEY = "autopilot_prototype_fiscal_gerais_manual_v1";
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

  global.FiscalGeraisData = {
    getDadosGerais: getDadosGerais,
    setDadosManuais: setDadosManuais,
    OPCOES_REGIME_RECONHECIMENTO_RECEITA: OPCOES_REGIME_RECONHECIMENTO_RECEITA,
  };
})(window);
