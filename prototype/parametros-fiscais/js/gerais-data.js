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

  `perfilParametrizacaoAtividade` (D35, rodada de 2026-09-08 — "Tornar D35
  e D08 funcionais"): passou a ser um select funcional (10 opções, incluindo
  o placeholder "Selecione..."), persistido por empresa × vigência no mesmo
  mecanismo dos demais campos Manuais desta aba — apesar de a origem
  documentada continuar "Sistema" (docs/02-parametros-fiscais.md, seção 4).
  Guarda só a ESCOLHA do perfil; nenhuma lógica aplica os parâmetros que o
  perfil "deveria" pré-configurar (mecânica ainda não definida — ver
  docs/parametros-fiscais-as-built.md, seção 13). `null`/`""` = nenhum
  perfil selecionado (estado inicial de todo mock, nenhuma empresa tinha
  perfil algum antes desta rodada).

  `segmentoAtividadeEspecial` (D08, mesma rodada): passou a ser uma lista de
  seleção múltipla funcional (13 opções, dicionário seção 14), editável no
  mesmo drawer dos demais campos Manuais — a prioridade documentada
  continua Fase 2 (o badge "Fase 2" é preservado na tela; só a
  interatividade do campo mudou, não sua prioridade). Array vazio = nenhuma
  opção marcada (estado inicial de todo mock). "Nenhuma" é mutuamente
  exclusiva das demais opções (regra aplicada em gerais.js, não aqui).
*/
(function (global) {
  // Opções de D06 (docs/02-parametros-fiscais.md, seção 14) reproduzidas
  // literalmente — nenhuma opção inventada.
  const OPCOES_REGIME_RECONHECIMENTO_RECEITA = ["Competência", "Caixa"];

  // Opções de D35 (docs/02-parametros-fiscais.md, seção 14) reproduzidas
  // literalmente — nenhuma opção inventada. "Selecione..." é o placeholder
  // inicial (value=""), não uma opção do dicionário.
  const OPCOES_PERFIL_PARAMETRIZACAO_ATIVIDADE = [
    "Selecione...",
    "Comércio — Anexo I",
    "Indústria — Anexo II",
    "Serviços — Anexo III",
    "Serviços — Anexo IV",
    "Serviços — Anexo V",
    "Escritório de serviços contábeis",
    "Transporte de cargas",
    "MEI",
    "Sem perfil — parametrização manual",
  ];

  // Opções de D08 (docs/02-parametros-fiscais.md, seção 14) reproduzidas
  // literalmente — nenhuma opção inventada, nenhuma opção nova criada.
  const OPCOES_SEGMENTO_ATIVIDADE_ESPECIAL = [
    "Revenda de veículos usados",
    "Entidade financeira ou equiparada",
    "Propaganda e publicidade",
    "Posto de combustível (varejista)",
    "Salão-parceiro",
    "Empresa Simples de Crédito (ESC)",
    "Atividade sujeita ao Fator R",
    "Transporte de cargas",
    "Transporte de passageiros (modalidade permitida)",
    "Escritório de serviços contábeis",
    "Locação de bens móveis",
    "Farmácia de manipulação",
    "Nenhum",
  ];

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
    perfilParametrizacaoAtividade: null,
    segmentoAtividadeEspecial: [],
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
      perfilParametrizacaoAtividade: null,
      segmentoAtividadeEspecial: [],
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
      perfilParametrizacaoAtividade: null,
      segmentoAtividadeEspecial: [],
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
    OPCOES_PERFIL_PARAMETRIZACAO_ATIVIDADE: OPCOES_PERFIL_PARAMETRIZACAO_ATIVIDADE,
    OPCOES_SEGMENTO_ATIVIDADE_ESPECIAL: OPCOES_SEGMENTO_ATIVIDADE_ESPECIAL,
  };
})(window);
