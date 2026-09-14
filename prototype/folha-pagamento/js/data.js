/*
  Dados e opções da trilha Folha de Pagamento — Fase 1 (área "Geral").

  Fonte funcional: docs/Mapeamento_Parametros_ERP_Departamento_Pessoal.md.
  Arquitetura aprovada: docs/folha-pagamento-fase1-analise-arquitetura-geral.md.

  Nomenclatura das 10 áreas replicada EXATAMENTE da arquitetura consolidada
  (não da lista de nomes do prompt de implementação, que usava rótulos
  diferentes — a arquitetura consolidada prevalece, conforme instruído).

  Regra seguida para as opções de Combo abaixo: só existe uma lista de
  opções quando a especificação enumera valores fechados (ex.: "Sim/Não",
  "Empresa, Contador, Procurador", "Obrigada, Não obrigada ou Dispensada").
  Quando a especificação só dá UM exemplo ilustrativo (padrão "(ex.: X)") ou
  nenhum exemplo, o campo foi implementado como texto livre em vez de um
  Combo com opções inventadas — ver relatório final para a lista completa
  desses campos.

  ===== Fidelidade dos mocks (auditoria "Correção dos Mocks") =====
  Todo valor em MOCKS_POR_EMPRESA cai numa destas categorias — marcada em
  comentário sempre que não for óbvia pelo próprio valor:

    A — definido literalmente pela documentação funcional
        (docs/Mapeamento_Parametros_ERP_Departamento_Pessoal.md).
    B — derivado de um cadastro real já existente no protótipo
        (EmpresasData, ContadoresData etc.) — não inventado.
    C — dependente de estado: valor que só existe porque outro campo desta
        MESMA empresa está numa condição que o exige (condRule).
    D — demonstrativo: nenhuma fonte (documentação ou cadastro interno) dá
        esse valor; é necessário para o campo não ficar vazio/para exercitar
        o condRule, mas NÃO é apresentado como fato real da empresa — só
        como premissa de protótipo, registrada aqui em comentário.
    E — não definido: quando nem uma escolha demonstrativa é apropriada, o
        campo permanece vazio/`false` (categoria A do capítulo "campos
        vazios" da auditoria) — nunca preenchido para "parecer completo".

  Nenhuma categoria D é exposta na interface como tal (sem badge/tooltip de
  "mock") — a distinção vive só aqui, no código-fonte dos dados.
*/
(function (global) {
  const AREAS = [
    { key: "geral", label: "Geral" },
    { key: "regime", label: "Regime" },
    { key: "arredondamento", label: "Arredondamento" },
    { key: "adiantamento", label: "Adiantamento" },
    { key: "decimo-terceiro", label: "13º Salário" },
    { key: "ferias", label: "Férias" },
    { key: "contabilidade", label: "Contabilidade" },
    { key: "honorarios", label: "Honorários" },
    { key: "cronograma", label: "Cronograma" },
    { key: "historico", label: "Histórico" },
  ];

  const SIM_NAO = ["Sim", "Não"];

  const O = {
    simNao: SIM_NAO,
    tipoAmbiente: ["Ambiente de teste", "Ambiente Oficial"],
    certificadoDigital: ["Empresa", "Contador", "Procurador"],
    tipoCentralizacao: ["Centralizadora", "Centralizada", "Não centraliza"],
    tipoInscricaoTransmissor: ["CNPJ", "CPF"],
    faseamento: ["1º grupo", "2º grupo", "3º grupo", "4º grupo"],
    certificadoResponsavelSst: ["Certificado do Responsável de SST", "Certificado da Empresa"],
    // "Classificação tributária" — a especificação só dá exemplos ("ex.: Empresa
    // em geral, Órgão público, Optante do Simples, MEI, etc.", com "etc." —
    // não é uma lista fechada). Mantidos aqui só os 4 exemplos literais.
    classificacaoTributaria: ["Empresa em geral", "Órgão público", "Optante do Simples", "MEI"],
    contratacaoPcd: ["Obrigada", "Não obrigada", "Dispensada"],
    tipoFolhaAtual: ["Folha mensal", "Complementar", "Rescisão"],
    lancamentoHoras: ["Horas decimais", "Horas e minutos"],
    calculoProporcionalidade: ["Sempre 30 dias", "Conforme dias do mês"],
    opcaoUnidadeCalculo: ["Conforme unidade das rubricas", "Conforme categoria"],
    // "Simples Nacional" (Regime > Geral, Fase 2) — a própria descrição do
    // campo na fonte enumera os dois valores ("Optante ou Não Optante do
    // Simples Nacional"), diferente de "Regime" e "Simples Federal até
    // 06/2007" (que só trazem um único exemplo ilustrativo ou nenhum, e por
    // isso permanecem texto livre — mesma regra já documentada acima).
    simplesNacionalSituacao: ["Optante", "Não Optante"],
    // "Base de Cálculo" (Adiantamento > Definições, Fase 4) — as 2 opções
    // são citadas literalmente na fonte (Anexo B 6.1), sem "etc."/exemplo
    // isolado — mesmo critério de "Simples Nacional" acima.
    baseCalculoAdiantamento: ["Salário Contratual", "Salário e Adicionais"],
    // Fase 6 — Contabilidade + Honorários
    // (docs/folha-pagamento-fase6-analise-arquitetura-contabilidade-honorarios.md).
    // "Separar lançamentos por" (9.1) — a fonte cita 3 exemplos junto do
    // campo ("ex.: Não Separar, por filial, por centro de custo") — mesmo
    // critério já usado para "Classificação tributária" (Geral): múltiplos
    // exemplos nomeados viram as opções do Combo, em vez de texto livre.
    separarLancamentosPor: ["Não Separar", "Por filial", "Por centro de custo"],
    // "Data" da tabela "Configurações — Tipo de Cálculo × Data" (9.2) — 3
    // exemplos nomeados na fonte ("ex.: Final do Mês, Data do Pagamento,
    // Data do Pagamento da Convocação Intermitente") — mesmo critério acima.
    dataReferenciaContabil: ["Final do Mês", "Data do Pagamento", "Data do Pagamento da Convocação Intermitente"],
    // "Configuração do relatório de provisão das férias calculadas no mês"
    // (9.1) — Radio com as 3 opções citadas literalmente pela fonte (sem
    // "ex."/"etc."), mesmo critério de "Simples Nacional"/"Base de Cálculo".
    configuracaoRelatorioProvisaoFerias: ["Considerar integralmente no mês início do gozo", "Considerar de forma proporcional aos dias de gozo", "Não considerar"],
  };

  function deepMerge(base, overrides) {
    if (!overrides) return base;
    Object.keys(overrides).forEach((k) => {
      const ov = overrides[k];
      if (ov && typeof ov === "object" && !Array.isArray(ov)) {
        base[k] = deepMerge(base[k] && typeof base[k] === "object" ? base[k] : {}, ov);
      } else {
        base[k] = ov;
      }
    });
    return base;
  }

  function blankGeralForm() {
    return {
      esocial: {
        envioGeral: {
          gerarESocial: true,
          tipoAmbiente: "",
          certificadoDigital: "",
          tipoCentralizacao: "",
          inscricaoTransmissorTipo: "",
          inscricaoTransmissorNumero: "",
          empresaJaEnviada: "",
          competenciaInicioUso: "",
          contadorCodigoNome: "",
          empresaCentralizadoraCodigo: "",
          naoEnviarEventos: { ativo: false, data: "" },
          possuiCentralizadoraOutroBanco: false,
        },
        faseamento: {
          faseamento: "",
          tabelaData: "",
          naoPeriodicosData: "",
          periodicosData: "",
          sstData: "",
          possuiRPPS: false,
          periodicosRPPSData: "",
          naoEnviarNaoPeriodicosAuto: { ativo: false, data: "" },
        },
        sst: {
          naoEnviarSST: { ativo: false, data: "" },
          vincularOutroResponsavel: false,
          certificadoResponsavel: "",
          codigoResponsavel: "",
          eventos: { s2210: false, s2220: false, s2221: false, s2240: false },
        },
        dadosCadastraisTributarios: {
          classificacaoTributaria: "",
          cooperativa: "",
          produtorRural: "",
          entidadeSemFins: "",
          empresaTrabalhoTemporario: "",
          calculaFunrural: "",
          construtora: "",
          entidadeEducativa: "",
          numeroRegistroMTE: "",
          geraESocialDomestico: false,
          tipoAcesso: "",
          codigoAcesso: "",
          senha: "",
          possuiSituacaoEspecial: false,
          situacao: "",
          optouRegistroEletronico: "",
          possuiAcordoInternacional: "",
          utilizaModuloWebSimplificado: "",
        },
        contratacoesPCD: { contratacaoPCD: "", numeroProcesso: "" },
        orgaosPublicos: { cnpjEnteFederativo: "" },
      },
      calculo: {
        competenciaAtual: "",
        tipoFolhaAtual: "",
        discriminarDSR: "",
        lancamentoHoras: "",
        calculoProporcionalidade: "",
        folhaProfessores: "",
        folhaSemanal: "",
        usaRubricasEmpresa: { ativo: false, codigoNome: "" },
        permitirProporcionalizarCarga: { ativo: false, data: "" },
        efetuarCalculoDCTFWeb: { ativo: false, data: "" },
        agentePublico: "",
        rateioPorServico: { ativo: "", data: "", tipoRateio: "" },
        calcularSalarioProporcionalAlteracao: false,
        calcularINSSMultiplosVinculos: false,
      },
      unidadeCalculo: {
        vigencia: "",
        descricao: "",
        opcaoUnidade: "",
        unidadePorCategoria: { mensalistas: "", semanalistas: "", comissionados: "", diaristas: "", tarefeiros: "", contribuintes: "" },
      },
      personaliza: {
        opcoesGeral: {
          limiteEstagiariosSupervisor: { ativo: false, numero: "" },
          calcularDiarias: { ativo: false, consideraComoRemuneracao: "" },
          naoCalcularDiariasTributaveis: { ativo: false, data: "" },
          configurarRubricasDescontoCompulsorio: false,
          naoPermitirSalarioAbaixoPiso: false,
          efetuarLancamentoRubricasPorServico: false,
          permitirInformarDatasFaltasParciais: false,
          considerarPeriodoSindicatoAlteracaoSalarial: false,
          considerarDiasMesCompetenciaInicioEstagio: false,
          permitirTipoAnaliticoSinteticoCentroCustos: false,
          discriminarHorasCompensacaoSabado: false,
          naoCalcularPLRDemitido: false,
          calcularRemuneracaoIntegralAfastamentoContribuintes: false,
        },
        dsr: {
          descontarFaltasDSRCompetenciaFalta: false,
          descontarDSRMesmaSemanaFalta: false,
          descontarFaltasDSRDiaFolga: false,
          naoDescontarDSRFeriados: false,
          considerarDSRAfastadoDoencaDireitosIntegrais: false,
          calcularDSRUmSextoHoristaVariavel: false,
          calcularDSRUmSextoDiaristaVariavel: false,
          calcularDSRUmSextoIntermitente: false,
        },
        salarioFamilia: {
          naoCalcularDomesticoLicencaMaternidade: false,
          calcularMesmoDescontosMaioresProventos: false,
          calcularDuranteAfastamentoAusenciaJustificada: false,
          pagarDiferenca: false,
          naoConsiderarRetroativoCompensacao: false,
          naoCalcularIntermitenteSemCalculoCompetencia: false,
          naoCalcularDomesticoRetornoAfastamentoAte15Dias: false,
          naoCalcularHoristaVariavelSemCalculoCompetencia: false,
        },
        encargos: {
          aliquotaInssAutonomoCooperado: "20,00",
          limitarContribTerceiros20SalariosMinimos: { ativo: "", data: "" },
          calcularInss8RuralPrazoDeterminado: { ativo: false, data: "" },
          calculaCarneLeao: false,
          naoConsiderarReducaoTerceirosMP932: false,
          utilizarCpfResponsavelCarneLeaoCEI: false,
          somarEncargosComplementarNaMensalMinimo: false,
          somarEncargosInssCCTMensalMinimo: false,
          naoCalcularIrrfRpaMei: false,
          calcularIrrfAutonomoCondominio: false,
          ratearEncargosProporcionalServico: false,
          calculaEncargosHorasRepousoIndenizado: false,
          calcularEncargosIntegralAfastamentoContribuintes: false,
          calculaEncargosMultaEstabilidade: false,
          calcularInssFeriasOutrasBases: false,
          naoCalcularInssEmpresaCategoriasSefip: false,
          calcularInss13ProporcionalDesoneracao: false,
          calcularInss13ProporcionalSimplesNacional: false,
          calcularInss13SemProporcionalidadeTransferenciaDesoneracao: false,
        },
        rescisaoGeral: {
          calcularFgtsAvisoPrevioSegregadoESocial: { ativo: false, data: "" },
          naoDeduzirBaseFgtsNegativa: { ativo: false, data: "" },
          calculoProporcionalidadeDiasMes: false,
          calculoProporcionalidadeSempre30Dias: false,
          naoCalcularMediaAdicionalMultaArt477: false,
          naoConsiderarAvisoIndenizadoSalarioFamilia: false,
          gerarDataRescisaoMotivos6e27Caged: false,
          calcularMultaEstabilidadeAcidenteTrabalho: false,
          gerarAvisoIndenizadoSefipRescisao: false,
          calcularMultaEstabilidadeArt479480Proporcional: false,
          calcularIndenizacaoAdicionalTemporario: false,
          calcularAvisoAcordoDiasMetade: false,
          naoCalcular13FeriasIndenizadoAvisoAposentadoria: false,
          naoConsiderarFerias13IntermitenteAvisoPrevio: false,
          calcularAvisoIntermitenteVerbasPagas: false,
        },
        rescisaoDataPagamento: {
          utilizarSabadoDiaUtilPagamentoRescisao: false,
          anteciparPagamentoRescisaoContratoAntecipadoEmpregador: false,
          gerarDataPagamentoRescisaoMotivo43: false,
          prorrogarDataPagamentoRescisaoDiaNaoUtil: false,
        },
        avisoPrevio: {
          inicioCalculoProporcional: "",
          motivosDemissao: "",
          considerarProjecaoAvisoIndenizadoDiasTrabalhados: false,
          naoConsiderarDiasAcrescidosLei12506Avos: false,
          considerarDiasAfastadosDilatarAcrescimoLei12506: false,
        },
        covid19: {
          naoRealizarCompensacaoPrevidenciariaAfastamentoCovid: { ativo: false, data: "" },
          efetuarCalculoHorasNormaisSalarioDia: false,
          calcularIndenizacaoGarantiaProvisoriaMotivos10e23: false,
          naoCalcularSalarioFamiliaSemDireitoAntesReducao: false,
          considerarAdicionaisIndenizacaoGarantiaProvisoria: false,
          considerarAdicionaisAjudaCompensatoria30: false,
          postergarDiasEstabilidadeGarantiaProvisoria: false,
          calcularRubricasInsalubridadeReducaoSalarial: false,
          calcularAntecipacaoSalarialReduzidaCompetenciaReducao: false,
          considerarAntecipacaoSalarialAjudaCompensatoria: false,
          calcularGratificacaoReduzidaCompetenciaReducao: false,
          considerarDiasAfastadosSuspensaoDilatarPeriodoAquisitivo: false,
          calcularSalarioFamiliaAfastadoIntegralSuspensao: false,
          considerarDiasIndenizacaoGarantiaProvisoriaAvos: false,
          considerarSalarioReduzidoCalculo13: false,
        },
        afastamentos: {
          calcularAfastamentosPagamentoEmpresaIntermitente: { ativo: false, data: "" },
          considerarDiasAfastadosExperienciaDilatarLimite: false,
          considerarMediasPrimeiroAfastamentoMesmaDoenca: false,
          naoCalcularDiferencaRubricasAlteracaoRetroativaAfastadoDoenca: false,
          pagarPrimeiros90DiasServicoMilitar: false,
          permitirMotivosAfastamento3_6_17_18QualquerData: false,
          considerar5MesesEstabilidadeLicencaMaternidade: false,
          naoAlterarPagamentoLicencaMaternidadeMeiTrocaRegime: false,
          considerarSomenteDiasUteisLicencaPaternidade: false,
        },
        horaNoturna: {
          calcularHoraNoturnaHorarioEmpregado: { ativo: false, data: "" },
          inicioHoraNoturna: "",
          fimHoraNoturna: "",
          calcularIntegralmenteJornadaExclusivamenteNoturna: { ativo: false, data: "" },
          calcularHoraDiurnaComAdicionalNoturnoSumula60: false,
        },
        contribuicoesSindicato: {
          calcularDiferencaContribSindicalAlteracaoSalarial: false,
          calcularDiferencaContribSindicalAntecipacaoSalarial: false,
          calcularContribSindicalMesAnteriorComissionado: false,
          calcularContribSindicalMediasFeriasComissionado: false,
          calcularContribSindicalMesAnteriorProfessorAulista: false,
          calcularContribSindicalHoristas30Dias: false,
        },
        outrosApi: {
          gerarGuiaDarfDctfwebApiIntegraContador: false,
          gerarLancamentoRubricasFolhaViaApi: false,
        },
      },
      informacoes: {
        adquireProducaoRural: { ativo: false, lancamentoNotasFiscais: "", data: "" },
        comercializaProducaoRural: { ativo: false, lancamentoNotasFiscais: "", data: "" },
        tomadorServicos: { ativo: false, lancamentoNotasFiscais: "", data: "" },
        prestadorServicos: { ativo: false, lancamentoNotasFiscais: "", data: "" },
        recursosClubeFutebol: { ativo: false, tipo: "" },
        permiteImportarNotasFiscaisCpfProducaoRural: false,
      },
    };
  }

  /*
    Fase 2 — Regime (docs/folha-pagamento-fase2-analise-arquitetura-regime.md).
    18 campos: Regime > Geral (9) + Regime > INSS Receita Bruta/CPRB (9).

    Diferente de "Geral", a Vigência de Regime não é mais um campo de
    formulário único (decisão 2 da arquitetura aprovada) — é resolvida pelo
    componente compartilhado VigenciaSelector (prototype/shared/js/vigencia.js),
    a partir de uma LISTA de vigências por empresa (REGIME_VIGENCIAS_POR_EMPRESA,
    abaixo). Por isso "vigência" não aparece dentro de blankRegimeForm(): não
    há mais um campo de data solto para o usuário preencher — a vigência
    "atual" é sempre a primeira da lista, e criar uma nova vigência está fora
    do escopo desta fase (botão "Iniciar nova vigência" permanece desabilitado
    — regra de abertura ainda não definida, nem aqui nem em Fiscal).
  */
  function blankRegimeForm() {
    return {
      descricao: "",
      regime: "",
      simplesFederalAte2007: "",
      simplesNacional: "",
      possuiInssReceitaBruta: "",
      contribuiPis: { ativo: false, percentual: "" },
      calcularPisCompetenciaFerias: false,
      cprb: {
        atividades: "",
        exclusivamenteTiTic: "",
        exclusivamenteAtividadesRelacionadas: "",
        // Decisão funcional fechada: segue a mesma árvore de aplicabilidade
        // do CPRB ativo (obrigatória sempre que "Possui INSS Empresa sobre
        // a receita bruta" = Sim), sem gatilho adicional — não existe
        // parâmetro que determine diretamente a existência de receitas não
        // relacionadas à atividade desonerada (ver seção 9 do documento de
        // arquitetura).
        aliquotaReceitasNaoRelacionadas: "",
        calcularInss13IntegralSemProporcionalidade: false,
        utilizarPercentualReceitaBrutaNovembro13Integral: false,
        calcularInss13RescisaoSemProporcionalidade: false,
        calcularInss13RescisaoUltimoServicoAlocado: false,
        calcularInss13ProporcionalDesoneracaoServico: false,
      },
    };
  }

  // Mock por empresa — mesma convenção de categorias A/B/C/D/E do topo do
  // arquivo. Nenhuma das 5 empresas mockadas tem CPRB confirmada por
  // nenhuma fonte (não há dado de "atividade sujeita à Lei 12.546/2011" em
  // EmpresasData) — a única empresa com "Possui INSS sobre a receita
  // bruta" = "Sim" abaixo (MS-0027, indústria metalúrgica) é uma escolha
  // demonstrativa (categoria D) para exercitar a árvore de CPRB; as demais
  // permanecem "Não", o que é coerente mesmo sem confirmação: CPRB é uma
  // sistemática de Lucro Real/Presumido (Lei 12.546/2011), e optantes do
  // Simples Nacional (PA-0011, CH-0042) são estruturalmente excluídos dela
  // — logo "Não" para essas duas é derivado do próprio regimeTributarioFederal
  // já cadastrado (categoria B), não um chute isolado.
  const REGIME_MOCKS_POR_EMPRESA = {
    "PA-0011": {
      regime: "Normal",
      simplesFederalAte2007: "Não se aplica", // Categoria B — inicioAtividade (15/03/2015) é posterior à extinção do Simples Federal (06/2007).
      simplesNacional: "Optante", // Categoria B — EmpresasData.dadosGerais.regimeTributarioFederal = "Simples Nacional".
      possuiInssReceitaBruta: "Não", // Categoria B — ver nota acima (Simples Nacional é excluído da CPRB).
    },
    "MS-0027": {
      regime: "Normal",
      simplesFederalAte2007: "Não se aplica", // Categoria B — inicioAtividade 02/06/2009, posterior a 06/2007.
      simplesNacional: "Não Optante", // Categoria B — regimeTributarioFederal = "Lucro Presumido".
      possuiInssReceitaBruta: "Sim", // Categoria D — ver nota acima; único mock que exercita a árvore CPRB.
      cprb: {
        atividades: "Indústria", // Categoria D — coerente com CNAE 2599-3/99 (fabricação de produtos de metal), mas não confirmado por nenhuma fonte funcional.
        exclusivamenteTiTic: "Não", // Categoria D — coerente com o setor (metalurgia, não TI).
        exclusivamenteAtividadesRelacionadas: "Não", // Categoria D — valor demonstrativo, sem fonte.
        aliquotaReceitasNaoRelacionadas: "3,00", // Categoria D — valor demonstrativo, sem fonte.
      },
    },
    "CH-0042": {
      regime: "Normal",
      simplesFederalAte2007: "Não se aplica", // Categoria B — inicioAtividade 22/09/2020.
      simplesNacional: "Optante", // Categoria B.
      possuiInssReceitaBruta: "Não", // Categoria B — mesma justificativa de PA-0011.
    },
    "MS-0027-F1": {
      regime: "Normal",
      simplesFederalAte2007: "Não se aplica", // Categoria B — inicioAtividade 10/02/2018.
      simplesNacional: "Não Optante", // Categoria B.
      possuiInssReceitaBruta: "Não", // Categoria D — filial não replicou o "Sim" demonstrativo da matriz nesta rodada, para não triplicar a árvore CPRB nos mocks sem necessidade adicional de teste.
    },
    "MS-0027-F2": {
      regime: "Normal",
      simplesFederalAte2007: "Não se aplica", // Categoria B — inicioAtividade 05/09/2021.
      simplesNacional: "Não Optante", // Categoria B.
      possuiInssReceitaBruta: "Não", // Categoria D — mesma nota de MS-0027-F1.
    },
  };

  // Vigências de Regime por empresa (VigenciaSelector — decisão 2 da
  // arquitetura Fase 2). Categoria D em todos os campos (nenhuma fonte real
  // de histórico de vigência de Regime existe no protótipo) — segue a mesma
  // natureza demonstrativa já assumida por FiscalData.VIGENCIAS
  // (prototype/parametros-fiscais/js/data.js), inclusive o formato de data
  // (DD/MM/AAAA, não MM/AAAA — mesmo formato já usado pelo componente).
  // `tipoEstabelecimento` reaproveita um FATO real do cadastro (matriz vs.
  // filial, EmpresasData/grupoEmpresas) — categoria B dentro de um registro
  // majoritariamente D. MS-0027 recebe uma 2ª vigência (histórica, encerrada)
  // para exercitar a troca de vigência/timeline do componente; as demais
  // empresas têm só a vigência atual.
  const REGIME_VIGENCIAS_POR_EMPRESA = {
    "PA-0011": [
      { id: "regime-pa0011-v1", dataInicio: "01/01/2026", dataFim: null, regimeTributario: "Normal", anexo: "Optante do Simples Nacional", tipoEstabelecimento: "Estabelecimento único" },
    ],
    "MS-0027": [
      { id: "regime-ms0027-v2", dataInicio: "01/01/2026", dataFim: null, regimeTributario: "Normal", anexo: "Não Optante do Simples Nacional", tipoEstabelecimento: "Matriz" },
      { id: "regime-ms0027-v1", dataInicio: "01/01/2018", dataFim: "31/12/2025", regimeTributario: "Normal", anexo: "Não Optante do Simples Nacional", tipoEstabelecimento: "Matriz" }, // Categoria D — histórica, só para exercitar o painel de histórico.
    ],
    "CH-0042": [
      { id: "regime-ch0042-v1", dataInicio: "01/01/2026", dataFim: null, regimeTributario: "Normal", anexo: "Optante do Simples Nacional", tipoEstabelecimento: "Estabelecimento único" },
    ],
    "MS-0027-F1": [
      { id: "regime-ms0027f1-v1", dataInicio: "01/01/2026", dataFim: null, regimeTributario: "Normal", anexo: "Não Optante do Simples Nacional", tipoEstabelecimento: "Filial" },
    ],
    "MS-0027-F2": [
      { id: "regime-ms0027f2-v1", dataInicio: "01/01/2026", dataFim: null, regimeTributario: "Normal", anexo: "Não Optante do Simples Nacional", tipoEstabelecimento: "Filial" },
    ],
  };

  // Fallback para empresa sem mock dedicado de Regime — mesmo princípio do
  // fallback de defaultGeralForm(): não preenche artificialmente os demais
  // campos, só garante que VigenciaSelector sempre recebe uma lista não
  // vazia (pré-condição do componente — ver prototype/shared/js/vigencia.js).
  const REGIME_VIGENCIA_FALLBACK = [{ id: "regime-fallback-v1", dataInicio: "01/01/2026", dataFim: null, regimeTributario: "Normal", anexo: "—", tipoEstabelecimento: "—" }];

  function defaultRegimeForm(empresa) {
    const codigo = empresa && empresa.codigo;
    const overrides = (codigo && REGIME_MOCKS_POR_EMPRESA[codigo]) || {};
    return {
      form: deepMerge(blankRegimeForm(), overrides),
      vigencias: (codigo && REGIME_VIGENCIAS_POR_EMPRESA[codigo]) || REGIME_VIGENCIA_FALLBACK,
    };
  }

  // Mock por empresa — cada uma representa um estado coerente e preenchido
  // da configuração "Geral", em vez de reaplicar os mesmos valores genéricos
  // para toda empresa selecionada. Valores derivados do cadastro real da
  // empresa (regimeTributarioFederal, CNPJ, se é matriz/filial, registro de
  // contadores — ver prototype/empresas/js/data.js e
  // prototype/cadastros-auxiliares/js/contadores/data.js) quando isso
  // determina um valor coerente. Campos "Opcional/Informativo" (Apêndice A
  // da especificação) permanecem `false` por padrão para todas as
  // empresas — esse é o valor coerente para uma opção que a empresa não
  // ativou, não uma lacuna.
  //
  // Campos cujo Combo não tem opções enumeradas na especificação (ver nota
  // no topo do arquivo) recebem um valor de texto — categoria A quando o
  // próprio doc dá o único exemplo (ex.: Aviso Prévio), categoria D quando
  // nem isso (ver comentários pontuais abaixo).
  //
  // Categoria D explícita nesta rodada — nenhuma fonte (documentação ou
  // cadastro interno) determina, para as 5 empresas mockadas: (1) a qual
  // grupo de faseamento do eSocial cada uma pertence, nem o calendário de
  // datas de cada grupo — docs/Mapeamento_Parametros_ERP_Departamento_Pessoal.md
  // só define que o campo existe e que há 4 grupos possíveis; (2) se a
  // empresa está sujeita à cota de PCD — dependeria do número de empregados,
  // dado que não existe em EmpresasData; (3) por que o ambiente do eSocial é
  // "Oficial" para todas — decisão de mock, não earlier registrada em
  // nenhum documento. Os valores abaixo para esses 3 campos são
  // demonstrativos: preenchidos para o campo Base não ficar vazio e para
  // exercitar a experiência, mas não devem ser lidos como fato levantado
  // sobre a empresa real. As datas usadas em (1) foram ajustadas para nunca
  // antecederem `inicioAtividade` da própria empresa em EmpresasData (uma
  // filial não pode estar "obrigada desde" antes de existir), mas a escolha
  // do grupo e do calendário em si permanece sem fonte.
  const MOCKS_POR_EMPRESA = {
    // Padaria Aurora Ltda — Simples Nacional, empresa única (sem filiais).
    // inicioAtividade (EmpresasData): 15/03/2015.
    "PA-0011": {
      esocial: {
        envioGeral: {
          tipoAmbiente: "Ambiente Oficial", // Categoria D — ver nota acima; nenhuma fonte determina o ambiente por empresa.
          certificadoDigital: "Empresa",
          tipoCentralizacao: "Não centraliza",
          inscricaoTransmissorTipo: "CNPJ",
          inscricaoTransmissorNumero: "12.345.678/0001-90", // Categoria B — EmpresasData.dadosGerais.cnpj.
        },
        // faseamento e as 4 datas: Categoria D (ver nota acima) — datas em
        // 2021, após inicioAtividade (2015), para não contradizer o cadastro.
        faseamento: { faseamento: "3º grupo", tabelaData: "2021-01", naoPeriodicosData: "2021-01", periodicosData: "2021-07", sstData: "2021-07" },
        dadosCadastraisTributarios: {
          classificacaoTributaria: "Optante do Simples", // Categoria B — deriva de regimeTributarioFederal="Simples Nacional".
          cooperativa: "Não",
          produtorRural: "Não",
          entidadeSemFins: "Não",
          empresaTrabalhoTemporario: "Não",
          calculaFunrural: "Não",
        },
        contratacoesPCD: { contratacaoPCD: "Não obrigada" }, // Categoria D — ver nota acima; não há nº de empregados no cadastro.
      },
      calculo: {
        competenciaAtual: "2026-08", // Categoria D — competência corrente do ambiente, não um fato da empresa.
        tipoFolhaAtual: "Folha mensal",
        discriminarDSR: "Não",
        lancamentoHoras: "Horas decimais",
        calculoProporcionalidade: "Conforme dias do mês",
        folhaProfessores: "Não",
        folhaSemanal: "Não",
        rateioPorServico: { ativo: "Não" },
      },
      unidadeCalculo: { vigencia: "2026-01", opcaoUnidade: "Conforme unidade das rubricas" }, // vigencia: Categoria D.
      personaliza: { avisoPrevio: { inicioCalculoProporcional: "A partir do primeiro ano trabalhado completo", motivosDemissao: "Somente motivo 2 — demissão sem justa causa" } }, // Categoria A — único exemplo do doc.
    },

    // Metalúrgica Sigma Ltda (matriz) — Lucro Presumido, centralizadora de
    // duas filiais (MS-0027-F1, MS-0027-F2). inicioAtividade: 02/06/2009.
    "MS-0027": {
      esocial: {
        envioGeral: {
          tipoAmbiente: "Ambiente Oficial", // Categoria D.
          certificadoDigital: "Empresa",
          tipoCentralizacao: "Centralizadora", // Categoria B — EmpresasData mostra MS-0027 como matriz com 2 filiais.
          inscricaoTransmissorTipo: "CNPJ",
          inscricaoTransmissorNumero: "06.265.226/0001-09", // Categoria B — CNPJ real.
        },
        faseamento: { faseamento: "1º grupo", tabelaData: "2018-01", naoPeriodicosData: "2018-01", periodicosData: "2018-05", sstData: "2018-05" }, // Categoria D.
        dadosCadastraisTributarios: {
          classificacaoTributaria: "Empresa em geral", // Categoria B — deriva de regimeTributarioFederal="Lucro Presumido".
          cooperativa: "Não",
          produtorRural: "Não",
          entidadeSemFins: "Não",
          empresaTrabalhoTemporario: "Não",
          calculaFunrural: "Não",
        },
        contratacoesPCD: { contratacaoPCD: "Obrigada" }, // Categoria D.
      },
      calculo: {
        competenciaAtual: "2026-08", // Categoria D.
        tipoFolhaAtual: "Folha mensal",
        discriminarDSR: "Não",
        lancamentoHoras: "Horas decimais",
        calculoProporcionalidade: "Sempre 30 dias",
        folhaProfessores: "Não",
        folhaSemanal: "Não",
        rateioPorServico: { ativo: "Não" },
      },
      unidadeCalculo: {
        vigencia: "2026-01", // Categoria D.
        opcaoUnidade: "Conforme categoria", // Categoria D — texto livre (spec sem catálogo); replicado nas 2 filiais para coerência de grupo (ver correção "Unidade de Cálculo").
        unidadePorCategoria: { mensalistas: "Horas", semanalistas: "Horas", comissionados: "Horas", diaristas: "Dias", tarefeiros: "Horas", contribuintes: "Horas" },
      },
      personaliza: { avisoPrevio: { inicioCalculoProporcional: "A partir do primeiro ano trabalhado completo", motivosDemissao: "Somente motivo 2 — demissão sem justa causa" } },
    },

    // Comércio Horizonte Ltda — Simples Nacional, varejo, sem filiais.
    // inicioAtividade (EmpresasData): 22/09/2020. Demonstra o condRule
    // "Empresa já enviada anteriormente" = Sim.
    "CH-0042": {
      esocial: {
        envioGeral: {
          tipoAmbiente: "Ambiente Oficial", // Categoria D.
          certificadoDigital: "Contador",
          // Categoria B — corrigido nesta rodada: o registro mestre de
          // contadores (prototype/cadastros-auxiliares/js/contadores/data.js,
          // ContadoresData) tem "Juliana Prado Contabilidade" (CRC
          // 1GO987654/O-2) com empresasAtendidas incluindo "CH-0042" — esse é
          // o contador real desta empresa no protótipo. O valor anterior
          // ("CONT-0005 — Escritório Contábil Horizonte") não correspondia a
          // nenhum registro existente e foi removido. Formato "nome — CRC"
          // replica a convenção já usada em empresas/js/contadores.js e
          // empresas/js/dados-gerais.js.
          contadorCodigoNome: "Juliana Prado Contabilidade — 1GO987654/O-2",
          tipoCentralizacao: "Não centraliza",
          inscricaoTransmissorTipo: "CNPJ",
          inscricaoTransmissorNumero: "22.333.444/0001-55", // Categoria B — CNPJ real (ver nota de divergência 1, não corrigida nesta rodada — fora do escopo desta tarefa).
          empresaJaEnviada: "Sim",
          // Categoria D — corrigido nesta rodada: nenhuma fonte (doc ou
          // cadastro interno) define a competência real de migração; o
          // valor anterior ("2018-06") antecedia inicioAtividade da própria
          // empresa (22/09/2020 — EmpresasData), o que é logicamente
          // impossível independentemente da falta de fonte documental.
          // Ajustado para o próprio mês de início de atividade, e mantido
          // como valor demonstrativo (não factual) do condRule.
          competenciaInicioUso: "2020-09",
        },
        faseamento: { faseamento: "3º grupo", tabelaData: "2021-01", naoPeriodicosData: "2021-01", periodicosData: "2021-07", sstData: "2021-07" }, // Categoria D; datas após inicioAtividade (2020-09).
        dadosCadastraisTributarios: {
          classificacaoTributaria: "Optante do Simples", // Categoria B.
          cooperativa: "Não",
          produtorRural: "Não",
          entidadeSemFins: "Não",
          empresaTrabalhoTemporario: "Não",
          calculaFunrural: "Não",
        },
        contratacoesPCD: { contratacaoPCD: "Não obrigada" }, // Categoria D.
      },
      calculo: {
        competenciaAtual: "2026-08", // Categoria D.
        tipoFolhaAtual: "Folha mensal",
        discriminarDSR: "Não",
        lancamentoHoras: "Horas decimais",
        calculoProporcionalidade: "Conforme dias do mês",
        folhaProfessores: "Não",
        folhaSemanal: "Não",
        rateioPorServico: { ativo: "Não" },
      },
      unidadeCalculo: { vigencia: "2026-01", opcaoUnidade: "Conforme unidade das rubricas" },
      personaliza: { avisoPrevio: { inicioCalculoProporcional: "A partir do primeiro ano trabalhado completo", motivosDemissao: "Somente motivo 2 — demissão sem justa causa" } },
    },

    // Filiais de Metalúrgica Sigma — "Tipo de centralização" = Centralizada,
    // com "Empresa centralizadora" apontando para o código real da matriz
    // (MS-0027, EmpresasData). Demais campos herdam o mesmo perfil
    // tributário/faseamento da matriz — inclusive Unidade de Cálculo,
    // corrigida nesta rodada (ver abaixo) para não divergir sem motivo
    // registrado do que a matriz usa.
    "MS-0027-F1": {
      // inicioAtividade (EmpresasData): 10/02/2018.
      esocial: {
        envioGeral: {
          tipoAmbiente: "Ambiente Oficial", // Categoria D.
          certificadoDigital: "Empresa",
          tipoCentralizacao: "Centralizada",
          empresaCentralizadoraCodigo: "MS-0027", // Categoria B — código real da matriz.
          inscricaoTransmissorTipo: "CNPJ",
          inscricaoTransmissorNumero: "06.265.226/0002-80", // Categoria B.
        },
        // Categoria D. Corrigido nesta rodada: tabelaData/naoPeriodicosData
        // ajustadas de "2018-01" para "2018-02" — a filial só foi criada em
        // 10/02/2018 (EmpresasData), então "obrigada desde janeiro/2018"
        // antecederia sua própria existência.
        faseamento: { faseamento: "1º grupo", tabelaData: "2018-02", naoPeriodicosData: "2018-02", periodicosData: "2018-05", sstData: "2018-05" },
        dadosCadastraisTributarios: { classificacaoTributaria: "Empresa em geral", cooperativa: "Não", produtorRural: "Não", entidadeSemFins: "Não", empresaTrabalhoTemporario: "Não", calculaFunrural: "Não" },
        contratacoesPCD: { contratacaoPCD: "Obrigada" }, // Categoria D.
      },
      calculo: {
        competenciaAtual: "2026-08",
        tipoFolhaAtual: "Folha mensal",
        discriminarDSR: "Não",
        lancamentoHoras: "Horas decimais",
        calculoProporcionalidade: "Sempre 30 dias",
        folhaProfessores: "Não",
        folhaSemanal: "Não",
        rateioPorServico: { ativo: "Não" },
      },
      // Corrigido nesta rodada: alinhado com a matriz MS-0027 (mesmo grupo
      // econômico, mesma estrutura de folha) — antes usava "Conforme
      // unidade das rubricas" sem nenhuma justificativa registrada para
      // divergir da matriz. Categoria D (texto livre, sem catálogo no doc).
      unidadeCalculo: {
        vigencia: "2026-01",
        opcaoUnidade: "Conforme categoria",
        unidadePorCategoria: { mensalistas: "Horas", semanalistas: "Horas", comissionados: "Horas", diaristas: "Dias", tarefeiros: "Horas", contribuintes: "Horas" },
      },
      personaliza: { avisoPrevio: { inicioCalculoProporcional: "A partir do primeiro ano trabalhado completo", motivosDemissao: "Somente motivo 2 — demissão sem justa causa" } },
    },
    "MS-0027-F2": {
      // inicioAtividade (EmpresasData): 05/09/2021.
      esocial: {
        envioGeral: {
          tipoAmbiente: "Ambiente Oficial", // Categoria D.
          certificadoDigital: "Empresa",
          tipoCentralizacao: "Centralizada",
          empresaCentralizadoraCodigo: "MS-0027", // Categoria B.
          inscricaoTransmissorTipo: "CNPJ",
          inscricaoTransmissorNumero: "06.265.226/0003-61", // Categoria B.
        },
        // Categoria D. Corrigido nesta rodada: as 4 datas usavam "2018",
        // mais de 3 anos antes de esta filial existir (fundada em
        // 05/09/2021, EmpresasData) — contradição lógica independente da
        // falta de fonte documental. Ajustadas para o mês de fundação.
        faseamento: { faseamento: "1º grupo", tabelaData: "2021-09", naoPeriodicosData: "2021-09", periodicosData: "2021-09", sstData: "2021-09" },
        dadosCadastraisTributarios: { classificacaoTributaria: "Empresa em geral", cooperativa: "Não", produtorRural: "Não", entidadeSemFins: "Não", empresaTrabalhoTemporario: "Não", calculaFunrural: "Não" },
        contratacoesPCD: { contratacaoPCD: "Obrigada" }, // Categoria D.
      },
      calculo: {
        competenciaAtual: "2026-08",
        tipoFolhaAtual: "Folha mensal",
        discriminarDSR: "Não",
        lancamentoHoras: "Horas decimais",
        calculoProporcionalidade: "Sempre 30 dias",
        folhaProfessores: "Não",
        folhaSemanal: "Não",
        rateioPorServico: { ativo: "Não" },
      },
      // Corrigido nesta rodada — mesmo motivo de MS-0027-F1 (alinhamento com
      // a matriz, sem justificativa registrada para divergir).
      unidadeCalculo: {
        vigencia: "2026-01",
        opcaoUnidade: "Conforme categoria",
        unidadePorCategoria: { mensalistas: "Horas", semanalistas: "Horas", comissionados: "Horas", diaristas: "Dias", tarefeiros: "Horas", contribuintes: "Horas" },
      },
      personaliza: { avisoPrevio: { inicioCalculoProporcional: "A partir do primeiro ano trabalhado completo", motivosDemissao: "Somente motivo 2 — demissão sem justa causa" } },
    },
  };

  // Fallback para qualquer empresa do cadastro que não tenha mock dedicado
  // acima: aplica só a competência atual (a única data que não depende de
  // nenhuma característica específica da empresa) — os demais campos
  // permanecem vazios, e a ausência de mock é visível como tal (não
  // preenchida "artificialmente" com valores de outra empresa).
  function defaultGeralForm(empresa) {
    const codigo = empresa && empresa.codigo;
    const overrides = (codigo && MOCKS_POR_EMPRESA[codigo]) || { calculo: { competenciaAtual: "2026-08" } };
    return deepMerge(blankGeralForm(), overrides);
  }

  /*
    Fase 3 — Arredondamento
    (docs/folha-pagamento-fase3-analise-arquitetura-arredondamento.md).

    Escopo (seção 2 da arquitetura): 2 itens — checkbox de grupo "Calcula
    arredondamento para" + "Tabela de Configurações" com 11 linhas FIXAS
    (decisão 1 da arquitetura — enumeração nominal completa e literal da
    fonte, docs/Mapeamento_Parametros_ERP_Departamento_Pessoal.md, seção 5).
    Nenhuma linha é adicionada/removida pelo usuário.

    "Calcula" default "Não" em toda linha em branco (nunca vazio) — só para
    que o <select> Sim/Não sempre tenha uma opção correspondente selecionada;
    não é uma regra de negócio, é o mesmo tipo de valor inicial neutro já
    usado em campos Sim/Não de Geral/Regime quando nenhuma fonte determina
    um padrão.
  */
  const TIPOS_FOLHA_ARREDONDAMENTO = [
    "Mensal",
    "Semanal",
    "Complementar",
    "Adiantamento",
    "Participação de Lucros",
    "Férias",
    "Tabela Rescisão",
    "Rescisão Complementar",
    "Rescisão Professor",
    "13º",
    "Adiantamento 13º Integral",
  ];

  function blankArredondamentoForm() {
    return {
      calculaPara: { empregados: false, estagiarios: false, contribuintes: false },
      linhas: TIPOS_FOLHA_ARREDONDAMENTO.map((tipoFolha) => ({ tipoFolha, calcula: "Não", valor: "", formaDesconto: "" })),
    };
  }

  // Mock por empresa — categoria E em toda a área (Valor/Forma de Desconto):
  // nenhuma captura de tela do Domínio foi conferida especificamente para
  // Arredondamento (diferente de Geral/Regime — ver nota de proveniência no
  // topo do arquivo), então nenhum valor aqui é apresentado como fato real
  // da empresa, só como premissa demonstrativa para exercitar a tabela.
  // CH-0042 e MS-0027-F1... (ver abaixo) deliberadamente SEM entrada neste
  // mapa — caem no fallback de blankArredondamentoForm() (grupo sem nenhuma
  // opção marcada, todas as linhas "Não"), exercitando o estado "nada
  // configurado ainda" sem precisar duplicar código.
  const ARREDONDAMENTO_MOCKS_POR_EMPRESA = {
    "PA-0011": {
      calculaPara: { empregados: true, estagiarios: true, contribuintes: true },
      linhas: {
        Mensal: { calcula: "Sim", valor: "0,01", formaDesconto: "Não descontar" },
        Complementar: { calcula: "Sim", valor: "0,01", formaDesconto: "Não descontar" },
      },
    },
    "MS-0027": {
      calculaPara: { empregados: true, estagiarios: false, contribuintes: false },
      linhas: {
        Mensal: { calcula: "Sim", valor: "0,01", formaDesconto: "Não descontar" },
        "13º": { calcula: "Sim", valor: "0,01", formaDesconto: "Não descontar" },
      },
    },
    "MS-0027-F2": {
      calculaPara: { empregados: false, estagiarios: true, contribuintes: true },
      linhas: {
        Semanal: { calcula: "Sim", valor: "0,02", formaDesconto: "Não descontar" },
      },
    },
  };

  function defaultArredondamentoForm(empresa) {
    const codigo = empresa && empresa.codigo;
    const overrides = codigo && ARREDONDAMENTO_MOCKS_POR_EMPRESA[codigo];
    const form = blankArredondamentoForm();
    if (overrides) {
      if (overrides.calculaPara) Object.assign(form.calculaPara, overrides.calculaPara);
      if (overrides.linhas) {
        form.linhas.forEach((linha) => {
          const o = overrides.linhas[linha.tipoFolha];
          if (o) Object.assign(linha, o);
        });
      }
    }
    return form;
  }

  /*
    Fase 4 — Adiantamento + 13º Salário
    (docs/folha-pagamento-fase4-analise-arquitetura-adiantamento-decimo-terceiro.md).

    Duas Tabs distintas, cada uma com seu próprio form/mock — "Adiantamento"
    (Definições + Proporcionalidade) e "13º Salário" (Geral + 13º Adiantamento).
    Nenhuma tabela, nenhuma vigência — só campos simples (seção 4 da arquitetura).

    "Calcular para" (Definições) — decisão da arquitetura (seção 5): apesar de
    classificado Base pela fonte, o grupo vazio é um estado funcional válido
    (só empregados recebem adiantamento) — por isso, diferente do checkbox-
    group de Arredondamento, este NÃO tem nenhuma marcação de obrigatoriedade
    de grupo aqui nem em folha-page.js.

    Sub-opções de Proporcionalidade e "outros afastamentos" — decisão 9.2 da
    arquitetura: checkboxes independentes (não radio), sem exclusão mútua
    inventada. "motivo" de outros afastamentos é texto livre (solução neutra
    9/10.1 — nenhum catálogo de motivos de afastamento existe no projeto).
  */
  function blankProporcionalidadeBloco() {
    return {
      ativo: false,
      considerarProporcionalmenteDiasTrabalhados: false,
      seEstiverTrabalhandoNaDataPagamento: false,
      seEstiverTrabalhandoMinimoDias: { ativo: false, dias: "" },
      naoConsiderarLicencaRemuneradaComoTrabalhado: false,
    };
  }

  function blankAdiantamentoForm() {
    return {
      definicoes: {
        calcularPara: { estagiarios: false, contribuintes: false, aprendiz: false },
        baseCalculo: "",
        percentual: "",
        percentualDiferenciadoEstagiarios: { ativo: false, percentual: "" },
        considerarComissaoCompetenciaAnterior: false,
        considerarGarantiaMinima: false,
        considerarApenasGarantiaMinimaComSalario: false,
        naoCalcularAntecipacaoComAdiantamentoLancado: false,
        permitirMaisDeUmAdiantamento: { ativo: false, limitarPercentual: "" },
      },
      proporcionalidade: {
        ferias: blankProporcionalidadeBloco(),
        licencaMaternidade: blankProporcionalidadeBloco(),
        outrosAfastamentos: Object.assign(blankProporcionalidadeBloco(), { motivo: "" }),
        admissao: blankProporcionalidadeBloco(),
      },
    };
  }

  // Categoria D em todos os valores (nenhuma captura de tela do Domínio foi
  // conferida especificamente para Adiantamento — mesma situação já aceita
  // em Arredondamento, Fase 3). CH-0042 e MS-0027-F1 deliberadamente SEM
  // entrada neste mapa — caem no fallback (nada configurado), mesmo
  // princípio já usado em ARREDONDAMENTO_MOCKS_POR_EMPRESA.
  const ADIANTAMENTO_MOCKS_POR_EMPRESA = {
    "PA-0011": {
      definicoes: {
        calcularPara: { estagiarios: true, contribuintes: false, aprendiz: false },
        baseCalculo: "Salário Contratual",
        percentual: "40",
        percentualDiferenciadoEstagiarios: { ativo: true, percentual: "35" },
      },
      proporcionalidade: {
        ferias: { ativo: true, considerarProporcionalmenteDiasTrabalhados: true },
        outrosAfastamentos: { ativo: true, motivo: "Acidente de trabalho", seEstiverTrabalhandoMinimoDias: { ativo: true, dias: "15" } },
      },
    },
    "MS-0027": {
      definicoes: {
        calcularPara: { estagiarios: false, contribuintes: true, aprendiz: false },
        baseCalculo: "Salário e Adicionais",
        percentual: "40",
        permitirMaisDeUmAdiantamento: { ativo: true, limitarPercentual: "30" },
      },
      proporcionalidade: {
        admissao: { ativo: true, seEstiverTrabalhandoNaDataPagamento: true },
      },
    },
    "MS-0027-F2": {
      definicoes: {
        calcularPara: { estagiarios: false, contribuintes: false, aprendiz: true },
        baseCalculo: "Salário Contratual",
        percentual: "40",
      },
      proporcionalidade: {
        licencaMaternidade: { ativo: true, naoConsiderarLicencaRemuneradaComoTrabalhado: true },
      },
    },
  };

  function mergeProporcionalidadeBloco(base, overrides) {
    if (!overrides) return;
    Object.assign(base, overrides);
    if (overrides.seEstiverTrabalhandoMinimoDias) Object.assign(base.seEstiverTrabalhandoMinimoDias, overrides.seEstiverTrabalhandoMinimoDias);
  }

  function defaultAdiantamentoForm(empresa) {
    const codigo = empresa && empresa.codigo;
    const overrides = codigo && ADIANTAMENTO_MOCKS_POR_EMPRESA[codigo];
    const form = blankAdiantamentoForm();
    if (overrides) {
      if (overrides.definicoes) {
        const d = overrides.definicoes;
        if (d.calcularPara) Object.assign(form.definicoes.calcularPara, d.calcularPara);
        if (d.baseCalculo !== undefined) form.definicoes.baseCalculo = d.baseCalculo;
        if (d.percentual !== undefined) form.definicoes.percentual = d.percentual;
        if (d.percentualDiferenciadoEstagiarios) Object.assign(form.definicoes.percentualDiferenciadoEstagiarios, d.percentualDiferenciadoEstagiarios);
        if (d.permitirMaisDeUmAdiantamento) Object.assign(form.definicoes.permitirMaisDeUmAdiantamento, d.permitirMaisDeUmAdiantamento);
      }
      if (overrides.proporcionalidade) {
        const p = overrides.proporcionalidade;
        mergeProporcionalidadeBloco(form.proporcionalidade.ferias, p.ferias);
        mergeProporcionalidadeBloco(form.proporcionalidade.licencaMaternidade, p.licencaMaternidade);
        mergeProporcionalidadeBloco(form.proporcionalidade.outrosAfastamentos, p.outrosAfastamentos);
        mergeProporcionalidadeBloco(form.proporcionalidade.admissao, p.admissao);
      }
    }
    return form;
  }

  /*
    13º Salário — Geral + 13º Adiantamento. "Calcular INSS Empresa do 13º
    pago na rescisão conforme % de redução" é Condicional AUTOCONTIDO
    (decisão/solução neutra 9.3/10.2 da arquitetura) — não lê `regimeCtx`,
    nenhuma integração cross-tab com Regime foi criada.
  */
  function blank13SalarioForm() {
    return {
      geral: {
        descontarFaltasAutomaticamente: false,
        descontarFaltasNoturnas: false,
        pagarAdicionais: false,
        pagarMedias: false,
        considerarMesAdmissaoMediasSemAvo: false,
        ajustarDezembroFavorEmpregado: false,
        ajustarDezembroFavorEmpregador: false,
        pagarParaEstagiarios: false,
        calcularParaRescisaoJustaCausa: false,
        naoCalcularProporcionalRescisaoMotivoAntecipado: false,
        desconsiderarAfastamentosDiasDireito: false,
        considerarMesAfastamentoMediasSemAvo: false,
        naoCalcularMediasComissaoAposMudancaMensalista: false,
        considerarMesAfastamentoDivisorMedias: false,
        considerarAvoSomenteDiasTrabalhados: false,
        utilizarRubricasDescontoDiferencaComEncargos: false,
        calcularInssEmpresaRescisaoConformeReducao: false,
        desconsiderarMesDivisorMedias: { ativo: false, dias: "" },
        considerarAusenciaJustificadaAvoDomestico: false,
        considerarAvoCompetenciasComCalculoTrocaIntermitente: false,
        pagarProporcionalMensalistaHoristaTrocaCategoria: false,
      },
      decimoAdiantamento: {
        percentual: "",
        permiteMaisDeUmAdiantamento: { ativo: false, limitarPercentual: "" },
        pagarAteDezembroAdmitidosNoAno: false,
        pagarAteMesAnteriorAdmitidosNoAno: false,
        calcularComBaseSalarioMesAnterior: false,
        pagarAdicionais: false,
        pagarMedias: false,
        calcularNaFolhaMensal: false,
        descontarValorJaAdiantadoComAlteracaoSalarial: false,
      },
    };
  }

  // Categoria D em todos os valores — mesma nota de proveniência de
  // ADIANTAMENTO_MOCKS_POR_EMPRESA. MS-0027 recebe
  // `calcularInssEmpresaRescisaoConformeReducao = true` para manter uma
  // narrativa de mock coerente com o CPRB=Sim já mockado em Regime (Fase 2)
  // — sem que isso represente nenhuma integração técnica real entre as
  // duas Tabs (ver decisão 9.3 da arquitetura). CH-0042 e MS-0027-F1 sem
  // entrada — fallback "nada configurado".
  const DECIMO_TERCEIRO_MOCKS_POR_EMPRESA = {
    "PA-0011": {
      geral: { pagarAdicionais: true, pagarMedias: true, pagarParaEstagiarios: true },
      decimoAdiantamento: { percentual: "50", pagarAdicionais: true },
    },
    "MS-0027": {
      geral: { calcularInssEmpresaRescisaoConformeReducao: true, desconsiderarMesDivisorMedias: { ativo: true, dias: "15" } },
      decimoAdiantamento: { percentual: "50", permiteMaisDeUmAdiantamento: { ativo: true, limitarPercentual: "30" } },
    },
    "MS-0027-F2": {
      geral: { pagarParaEstagiarios: true, ajustarDezembroFavorEmpregado: true },
      decimoAdiantamento: { percentual: "50", calcularNaFolhaMensal: true },
    },
  };

  function defaultDecimoTerceiroForm(empresa) {
    const codigo = empresa && empresa.codigo;
    const overrides = codigo && DECIMO_TERCEIRO_MOCKS_POR_EMPRESA[codigo];
    const form = blank13SalarioForm();
    if (overrides) {
      if (overrides.geral) {
        const g = overrides.geral;
        Object.keys(g).forEach((k) => {
          if (k === "desconsiderarMesDivisorMedias") Object.assign(form.geral.desconsiderarMesDivisorMedias, g[k]);
          else form.geral[k] = g[k];
        });
      }
      if (overrides.decimoAdiantamento) {
        const a = overrides.decimoAdiantamento;
        Object.keys(a).forEach((k) => {
          if (k === "permiteMaisDeUmAdiantamento") Object.assign(form.decimoAdiantamento.permiteMaisDeUmAdiantamento, a[k]);
          else form.decimoAdiantamento[k] = a[k];
        });
      }
    }
    return form;
  }

  /*
    Fase 5 — Férias (docs/folha-pagamento-fase5-analise-arquitetura-ferias.md).
    39 campos em 3 subgrupos: Geral (21) + Opções (13) + Rescisão (5).
    0 Base, 4 Condicional (pares #10→#11, #12→#13, #22→#23, e o campo 18
    autocontido checkbox+numérico), 35 Opcional (seção 6 da arquitetura).
    Nenhuma tabela, nenhuma vigência (seção 11 da arquitetura) — mesmo
    princípio de estado isolado já usado por regimeCtx/arredCtx/
    adiantamentoCtx/decimoTerceiroCtx.

    Soluções provisórias implementadas exatamente como a arquitetura definiu
    (seção 7): campo 6 sem "+Botão" (checkbox simples, fiel à literalidade
    da fonte); trio 32/33/34 como 3 checkboxes independentes (não radio);
    par 37/38 independente (ambos Opcional pela fonte, não Condicional).
  */
  function blankFeriasForm() {
    return {
      geral: {
        descontarFaltas: false,
        descontarFaltasNoturnas: false,
        descontarFaltasSuspensas: false,
        informarDataLancamentoFaltas: false,
        usarFaltasParciais: false,
        desconsiderarAfastamentosDiasDireito: false,
        pagarAdicionais: false,
        pagarMedias: false,
        adiantarPrimeiraParcela13: false,
        pagarParaEstagiarios: false,
        calcular1_3Estagiarios: false,
        considerarDiasAfastadosDilatarLimiteGozo: false,
        limitarDilatacaoLimiteGozo12Meses: false,
        incluirMovimentoFeriasFolhaMensal: false,
        mediasAdicionaisLicencaRemunerada: false,
        naoCalcularSalarioFamilia: false,
        naoCalcularContribuicaoSindical: false,
        calcularContribuicaoSindicalMinimoDias: { ativo: false, dias: "" },
        naoConsiderarAfastadosLicencaSemVencimento: false,
        considerarMesesContagemAfastamento: false,
        naoConsiderarDiasAfastadosDilatarPeriodoAquisitivoAprendiz: false,
      },
      opcoes: {
        calcular1_3LicencaRemunerada: false,
        calcular1_3SalarioContratual: false,
        calcularLicencaRemuneradaMenor18: false,
        pagarDiasGozoExcedentesLicencaRemunerada: false,
        informarDataSolicitacaoAbonoPecuniario: false,
        calcularFeriasSalarioMedioReducaoSalarial: false,
        naoCalcularMediasComissoesMudancaMensalista: false,
        gerarValorLicencaRemuneradaCalculoFerias: false,
        calcularPeriodoCompletoFeriasDobro: false,
        naoCalcularFeriasGozoInferior10Dias: false,
        considerarDiasContagemAvosConformeDiasMes: false,
        calculoProporcionalidadeSempre30Dias: false,
        calcularSalarioProporcionalDiasMes: false,
      },
      rescisao: {
        calcularFeriasProporcionalJustaCausa: false,
        naoDescontarFaltasAvosIndenizado: false,
        pagarIntegralFeriasProporcionalPeriodoAquisitivoIncompleto: false,
        pagarFeriasIndenizadasPeriodoAquisitivoIncompleto: false,
        considerarDiasAvisoPrevioIndenizadoFeriasDobro: false,
      },
    };
  }

  // Categoria D em todos os valores — nenhuma captura de tela do Domínio foi
  // conferida especificamente para Férias (mesma situação já aceita em
  // Arredondamento/Adiantamento/13º Salário — seção 14 da arquitetura).
  // PA-0011 exercita o par #10→#11 e o trio 32/33/34 (parcialmente) e o par
  // 37/38 (ambos marcados, para deixar visualmente claro que são checkboxes
  // independentes, não uma exclusão mútua — decisão 9.4 da arquitetura).
  // MS-0027 exercita o par #12→#13, o campo 18 (contribuição sindical + N
  // dias) e adiantar 1ª parcela do 13º. MS-0027-F2 exercita o par #22→#23 e
  // os campos "Checkbox + Botão" (20, 24) para renderizar botaoForaDeEscopo()
  // em Geral e em Opções. CH-0042 e MS-0027-F1 deliberadamente SEM entrada
  // neste mapa — caem no fallback (nada configurado), confirmando que a Tab
  // inteira pode ficar vazia sem bloquear salvamento (seção 6 da arquitetura
  // — nenhum campo de Férias é Base).
  const FERIAS_MOCKS_POR_EMPRESA = {
    "PA-0011": {
      geral: {
        descontarFaltas: true,
        pagarAdicionais: true,
        pagarParaEstagiarios: true,
        calcular1_3Estagiarios: true,
        desconsiderarAfastamentosDiasDireito: true,
      },
      opcoes: {
        considerarDiasContagemAvosConformeDiasMes: true,
      },
      rescisao: {
        pagarIntegralFeriasProporcionalPeriodoAquisitivoIncompleto: true,
        pagarFeriasIndenizadasPeriodoAquisitivoIncompleto: true, // Categoria D — os 2 marcados juntos, propositalmente, para evidenciar que são independentes (decisão 9.4), não uma exclusão mútua.
      },
    },
    "MS-0027": {
      geral: {
        considerarDiasAfastadosDilatarLimiteGozo: true,
        limitarDilatacaoLimiteGozo12Meses: true,
        calcularContribuicaoSindicalMinimoDias: { ativo: true, dias: "15" },
        adiantarPrimeiraParcela13: true,
      },
      opcoes: {
        calcularPeriodoCompletoFeriasDobro: true,
        naoCalcularFeriasGozoInferior10Dias: true,
      },
      rescisao: {
        naoDescontarFaltasAvosIndenizado: true,
      },
    },
    "MS-0027-F2": {
      geral: {
        considerarMesesContagemAfastamento: true, // Categoria D — exercita botaoForaDeEscopo() em Geral.
        naoConsiderarDiasAfastadosDilatarPeriodoAquisitivoAprendiz: true,
      },
      opcoes: {
        calcular1_3LicencaRemunerada: true,
        calcular1_3SalarioContratual: true,
        calcularLicencaRemuneradaMenor18: true, // Categoria D — exercita botaoForaDeEscopo() em Opções.
      },
      rescisao: {
        considerarDiasAvisoPrevioIndenizadoFeriasDobro: true,
      },
    },
  };

  function defaultFeriasForm(empresa) {
    const codigo = empresa && empresa.codigo;
    const overrides = (codigo && FERIAS_MOCKS_POR_EMPRESA[codigo]) || {};
    return deepMerge(blankFeriasForm(), overrides);
  }

  /*
    Fase 6 — Contabilidade + Honorários
    (docs/folha-pagamento-fase6-analise-arquitetura-contabilidade-honorarios.md).

    Duas Tabs distintas (D.AREAS já tinha "contabilidade" e "honorarios"
    separadas desde a Fase 1 — não sub-abas de uma só), cada uma com seu
    próprio form/mock, mesmo princípio de estado isolado já usado desde
    Regime (Fase 2).

    Contabilidade > Geral (8 campos) — "Gera lançamentos contábeis" é o
    gatilho de maior alcance da trilha (bloqueia os demais 7 campos "desta
    aba" segundo a fonte). Escopo do bloqueio tratado como decisão aberta
    7.1 da arquitetura — restrito a "Geral", NÃO estendido a "Opções"/
    "Filial Ativa" nesta implementação (ver folha-page.js, montaContabilidadeGeral()).
    "Contabilidade por centro de custo" + "Rateio de lançamentos" é
    Checkbox + Combo, mas a fonte só dá 1 exemplo do Combo ("conforme
    percentual definido na Contabilidade") — por isso "rateio" é TEXTO
    LIVRE, não um <select> com opções inventadas (mesmo critério já
    documentado no topo deste arquivo: só existe Combo com opções fechadas
    quando a fonte enumera 2+ valores nomeados). "Possui SCP" também não
    tem nenhum exemplo de valor na fonte (só "Combo", sem "ex.:") — mesmo
    critério, texto livre. "Gerar integração contábil por colaborador" é
    um checkbox-grupo Condicional com 5 sub-eventos, sem obrigatoriedade de
    seleção mínima (decisão 7.2 da arquitetura — vazio é válido dentro do
    grupo habilitado, mesmo padrão de "Calcular para" em Adiantamento/Fase 4).

    Contabilidade > Opções (6 campos) — a tabela "Configurações — Tipo de
    Cálculo × Data" reaproveita a mesma composição de linhas fixas já usada
    em Arredondamento (Fase 3) — ver montaTabelaLinhasFixas() em
    folha-page.js e a seção 9.1 da arquitetura (critério de promoção da
    Fase 3 confirmado atendido). Os campos 9/10 ("Usar a mesma configuração
    da folha normal para: Rescisão/Férias") são checkboxes independentes,
    sem nenhuma ligação técnica com as linhas da tabela (decisão aberta 7.2
    — a fonte não declara essa dependência).

    Contabilidade > Filial Ativa — SEM modelo de dados: a fonte não
    capturou nenhuma coluna/campo da grade (seção 9.3 da arquitetura); a
    sub-aba é renderizada só com uma mensagem de pendência (.alert-warning),
    sem nenhum campo fabricado.
  */
  const TIPOS_CALCULO_CONTABILIDADE = [
    "Folha mensal",
    "Complementar",
    "RPA",
    "Convocação Intermitente",
    "Rescisão",
    "Férias",
    "Adiantamento",
    "Participação de Lucros",
    "Resilição Professor",
    "13º Adiantamento",
    "13º Integral",
  ];

  function blankContabilidadeForm() {
    return {
      geral: {
        geraLancamentosContabeis: false,
        contabilidadePorCentroCusto: { ativo: false, rateio: "" },
        separarLancamentosPor: "",
        geraLancamentosEmpresa: "",
        possuiScp: "",
        integracaoPorColaborador: {
          ativo: false,
          folhaMensal: false,
          ferias: false,
          rescisao: false,
          provisaoFerias: false,
          provisaoDecimoTerceiro: false,
        },
        configuracaoRelatorioProvisaoFerias: "",
      },
      opcoes: {
        usarMesmaConfigRescisao: false,
        usarMesmaConfigFerias: false,
        linhasTipoCalculo: TIPOS_CALCULO_CONTABILIDADE.map((tipoCalculo) => ({ tipoCalculo, data: "" })),
        integrarIrrfFeriasDataPagamento: false,
        gerarProvisaoSefipPagamentoEncargos: false,
        considerarUltimoDiaMesNaoUtil: false,
      },
    };
  }

  // Categoria D em todos os valores (nenhuma captura de tela do Domínio foi
  // conferida especificamente para Contabilidade — mesma situação já aceita
  // em Arredondamento/Adiantamento/13º Salário/Férias). MS-0027-F2 recebe
  // "Gera lançamentos contábeis" = false propositalmente, para exercitar o
  // estado de bloqueio de "Geral" enquanto "Opções" permanece preenchível
  // (prova visual de que o escopo do gatilho não se estende às demais
  // sub-abas — decisão aberta 7.1). CH-0042 e MS-0027-F1 deliberadamente
  // SEM entrada neste mapa — caem no fallback de blankContabilidadeForm()
  // (gatilho desligado, todas as 11 linhas da tabela sem "Data"), mesmo
  // princípio já usado nos mocks das fases anteriores.
  const CONTABILIDADE_MOCKS_POR_EMPRESA = {
    "PA-0011": {
      geral: {
        geraLancamentosContabeis: true,
        contabilidadePorCentroCusto: { ativo: true, rateio: "Conforme percentual definido na Contabilidade" },
        separarLancamentosPor: "Por centro de custo",
        geraLancamentosEmpresa: "1 — Contábil Central Ltda",
        possuiScp: "Não",
        integracaoPorColaborador: { ativo: true, folhaMensal: true, ferias: true },
        configuracaoRelatorioProvisaoFerias: "Considerar de forma proporcional aos dias de gozo",
      },
      opcoes: {
        usarMesmaConfigFerias: true,
        linhasTipoCalculo: { "Folha mensal": { data: "Data do Pagamento" }, Férias: { data: "Final do Mês" }, Rescisão: { data: "Data do Pagamento" } },
        integrarIrrfFeriasDataPagamento: true,
      },
    },
    "MS-0027": {
      geral: {
        geraLancamentosContabeis: true,
        separarLancamentosPor: "Não Separar",
        geraLancamentosEmpresa: "MS-0027 — Matriz Contábil",
        possuiScp: "Sim",
        configuracaoRelatorioProvisaoFerias: "Não considerar",
      },
      opcoes: {
        linhasTipoCalculo: { "Folha mensal": { data: "Final do Mês" }, "13º Integral": { data: "Final do Mês" } },
        considerarUltimoDiaMesNaoUtil: true,
      },
    },
    "MS-0027-F2": {
      // Categoria D — gatilho desligado propositalmente (ver comentário
      // acima do mapa): exercita o estado de bloqueio de "Geral" com
      // "Opções" ainda preenchível.
      geral: { geraLancamentosContabeis: false },
      opcoes: {
        usarMesmaConfigRescisao: true,
        linhasTipoCalculo: { Adiantamento: { data: "Data do Pagamento" } },
        gerarProvisaoSefipPagamentoEncargos: true,
      },
    },
  };

  function defaultContabilidadeForm(empresa) {
    const codigo = empresa && empresa.codigo;
    const overrides = codigo && CONTABILIDADE_MOCKS_POR_EMPRESA[codigo];
    const form = blankContabilidadeForm();
    if (overrides) {
      if (overrides.geral) {
        const g = overrides.geral;
        Object.keys(g).forEach((k) => {
          if (k === "contabilidadePorCentroCusto" || k === "integracaoPorColaborador") Object.assign(form.geral[k], g[k]);
          else form.geral[k] = g[k];
        });
      }
      if (overrides.opcoes) {
        const o = overrides.opcoes;
        Object.keys(o).forEach((k) => {
          if (k === "linhasTipoCalculo") {
            form.opcoes.linhasTipoCalculo.forEach((linha) => {
              const ov = o.linhasTipoCalculo[linha.tipoCalculo];
              if (ov) Object.assign(linha, ov);
            });
          } else form.opcoes[k] = o[k];
        });
      }
    }
    return form;
  }

  /*
    Honorários — Tab própria (não sub-aba de Contabilidade), 3 campos, sem
    sub-agrupamento nomeado pela fonte (seção 5 da arquitetura). "Escritório"
    e a tabela de rubricas só são exigidos quando "Gerar variáveis de
    honorários..." está marcado (par gatilho→campo+tabela). A tabela de
    rubricas é de linhas DINÂMICAS (incluir/excluir) — estrutura diferente
    da tabela de linhas fixas de Contabilidade/Arredondamento (ver seção
    9.2 da arquitetura); por isso não reaproveita montaTabelaLinhasFixas().
    Nenhuma obrigatoriedade por célula é imposta às rubricas — a fonte
    exige que a tabela "exista/seja operável" quando o gatilho está ativo,
    não que cada linha tenha todas as células preenchidas (não inventado).
  */
  function blankHonorariosForm() {
    return {
      gerarVariaveisHonorarios: false,
      escritorio: "",
      rubricas: [],
    };
  }

  // Categoria D em todos os valores — mesma situação de proveniência das
  // demais áreas desta fase. MS-0027-F2 recebe o gatilho desligado
  // propositalmente, para exercitar o estado "nada configurado ainda" com
  // mock explícito (em vez de cair no fallback, como CH-0042/MS-0027-F1).
  const HONORARIOS_MOCKS_POR_EMPRESA = {
    "PA-0011": {
      gerarVariaveisHonorarios: true,
      escritorio: "Contabilidade ABC Ltda",
      rubricas: [
        { rubrica: "INSS Patronal", descricao: "Encargo patronal sobre a folha de pagamento", encargo: "20%", faturaComContrato: "Sim" },
        { rubrica: "FGTS", descricao: "Encargo sobre a folha de pagamento", encargo: "8%", faturaComContrato: "Não" },
      ],
    },
    "MS-0027": {
      gerarVariaveisHonorarios: true,
      escritorio: "Escritório Contábil MS",
      rubricas: [{ rubrica: "RAT/SAT", descricao: "Risco de acidente do trabalho", encargo: "2%", faturaComContrato: "Sim" }],
    },
    "MS-0027-F2": {
      gerarVariaveisHonorarios: false,
    },
  };

  function defaultHonorariosForm(empresa) {
    const codigo = empresa && empresa.codigo;
    const overrides = codigo && HONORARIOS_MOCKS_POR_EMPRESA[codigo];
    const form = blankHonorariosForm();
    if (overrides) {
      if (overrides.gerarVariaveisHonorarios !== undefined) form.gerarVariaveisHonorarios = overrides.gerarVariaveisHonorarios;
      if (overrides.escritorio !== undefined) form.escritorio = overrides.escritorio;
      if (overrides.rubricas) form.rubricas = overrides.rubricas.map((r) => Object.assign({}, r));
    }
    return form;
  }

  /*
    Cronograma de Pagamento — Tab própria (D.AREAS já reservava a chave
    "cronograma" desde a Fase 1 — decisão 1 do as-built de Geral), com 1
    único formulário para as 3 categorias de trabalhador (Empregados,
    Estagiários, Contribuintes Individuais), cada uma com sua própria
    tabela de 6 eventos fixos (ver docs/folha-pagamento-fase7-analise-
    arquitetura-cronograma.md, seção 3/5). Estrutura idêntica entre
    categorias (confirmado pela fonte, seção 8 do Mapeamento) — mesmo
    array `EVENTOS_CRONOGRAMA` usado para as 3.

    Nomes de evento: "Folha Mensal" é a leitura estrutural da subseção
    "11.1 Geral" da fonte (decisão provisória 1 da arquitetura — a fonte
    não nomeia esse evento literalmente); "Adiantamento" e "Participação de
    Lucros" são replicados por analogia ao mesmo trio de campos (decisão
    provisória 2 — citados só em texto corrido no Mapeamento, seção 6/7,
    sem linha própria de detalhamento). "13º Adiantamento"/"13º Integral —
    dezembro"/"13º Integral — competências diferentes de dezembro" têm
    detalhamento linha a linha na fonte (Anexo B, 11.2).
  */
  const EVENTOS_CRONOGRAMA = [
    "Folha Mensal",
    "Adiantamento",
    "Participação de Lucros",
    "13º Adiantamento",
    "13º Integral — dezembro",
    "13º Integral — competências diferentes de dezembro",
  ];

  function blankCronogramaCategoriaForm() {
    return {
      linhas: EVENTOS_CRONOGRAMA.map((evento) => ({ evento, mesPagamento: "", formaVencimento: "", totalDias: "" })),
      antecipacaoSabado: false,
    };
  }

  function blankCronogramaForm() {
    return {
      empregados: blankCronogramaCategoriaForm(),
      estagiarios: blankCronogramaCategoriaForm(),
      contribuintes: blankCronogramaCategoriaForm(),
    };
  }

  // Categoria D em todos os valores (nenhuma captura de tela do Domínio foi
  // conferida especificamente para Cronograma — mesma situação já aceita
  // nas Fases 3-6). CH-0042 e MS-0027-F1 deliberadamente SEM entrada neste
  // mapa — caem no fallback de blankCronogramaForm() (as 3 categorias
  // vazias), exercitando o estado "nenhuma configuração ainda" (seção 12 do
  // relatório desta tarefa, item 3). Mocks desenhados para exercitar,
  // juntos: tabela preenchida (PA-0011/MS-0027 "empregados"), tabela
  // parcialmente preenchida (PA-0011 "estagiarios", MS-0027
  // "contribuintes"), e as 2 pontas da dependência condicional do "13º
  // Adiantamento" — PA-0011 usa "Último dia útil" (Total de dias fica
  // vazio/inativo de propósito) e MS-0027 usa uma forma de vencimento
  // diferente (Total de dias habilitado e preenchido).
  const CRONOGRAMA_MOCKS_POR_EMPRESA = {
    "PA-0011": {
      empregados: {
        linhas: {
          "Folha Mensal": { mesPagamento: "No mesmo mês", formaVencimento: "Dias corridos antecipados", totalDias: "5" },
          Adiantamento: { mesPagamento: "No mesmo mês", formaVencimento: "Dias corridos antecipados", totalDias: "15" },
          "Participação de Lucros": { mesPagamento: "1º Mês subsequente", formaVencimento: "Dias corridos adiados", totalDias: "10" },
          // Forma de vencimento = "Último dia útil" — único caso em que a
          // fonte dispensa "Total de dias" (seção 6.1/7.1 da arquitetura);
          // deixado vazio de propósito para exercitar o estado inativo.
          "13º Adiantamento": { mesPagamento: "1º Mês subsequente", formaVencimento: "Último dia útil" },
          "13º Integral — dezembro": { mesPagamento: "No mesmo mês", formaVencimento: "Dias corridos antecipados", totalDias: "20" },
          "13º Integral — competências diferentes de dezembro": { mesPagamento: "No mesmo mês", formaVencimento: "Dias corridos antecipados", totalDias: "5" },
        },
        antecipacaoSabado: true,
      },
      // "estagiarios" parcialmente preenchida — só "Folha Mensal"; os
      // demais 5 eventos permanecem em branco (Categoria D).
      estagiarios: {
        linhas: {
          "Folha Mensal": { mesPagamento: "No mesmo mês", formaVencimento: "Dias corridos antecipados", totalDias: "5" },
        },
      },
      // "contribuintes" sem override — cai no fallback vazio (mesma
      // empresa exercitando categoria preenchida, parcial e vazia ao mesmo
      // tempo, prova de isolamento entre categorias).
    },
    "MS-0027": {
      empregados: {
        linhas: {
          "Folha Mensal": { mesPagamento: "1º Mês subsequente", formaVencimento: "Dias corridos adiados", totalDias: "5" },
          Adiantamento: { mesPagamento: "No mesmo mês", formaVencimento: "Dias corridos antecipados", totalDias: "15" },
          "Participação de Lucros": { mesPagamento: "1º Mês subsequente", formaVencimento: "Dias corridos adiados", totalDias: "10" },
          // Forma de vencimento diferente de "Último dia útil" — Total de
          // dias fica habilitado e preenchido (ponta oposta da mesma
          // dependência condicional exercitada em PA-0011).
          "13º Adiantamento": { mesPagamento: "No mesmo mês", formaVencimento: "Dias corridos antecipados", totalDias: "20" },
          "13º Integral — dezembro": { mesPagamento: "No mesmo mês", formaVencimento: "Dias corridos antecipados", totalDias: "20" },
          "13º Integral — competências diferentes de dezembro": { mesPagamento: "No mesmo mês", formaVencimento: "Dias corridos adiados", totalDias: "5" },
        },
      },
      // "estagiarios" sem override — fallback vazio.
      contribuintes: {
        linhas: {
          "Folha Mensal": { mesPagamento: "1º Mês subsequente", formaVencimento: "Dias corridos adiados", totalDias: "5" },
          "13º Integral — dezembro": { mesPagamento: "No mesmo mês", formaVencimento: "Dias corridos antecipados", totalDias: "20" },
        },
      },
    },
    "MS-0027-F2": {
      // Categoria D — gatilho opcional isolado, com a tabela ainda vazia:
      // exercita o checkbox "Antecipar pagamento..." independentemente do
      // estado da tabela (mesmo princípio de "MS-0027-F2" em Contabilidade/
      // Honorários — Fase 6 — de isolar 1 estado específico por mock).
      empregados: { antecipacaoSabado: true },
    },
  };

  function defaultCronogramaForm(empresa) {
    const codigo = empresa && empresa.codigo;
    const overrides = codigo && CRONOGRAMA_MOCKS_POR_EMPRESA[codigo];
    const form = blankCronogramaForm();
    if (overrides) {
      ["empregados", "estagiarios", "contribuintes"].forEach((categoria) => {
        const catOverride = overrides[categoria];
        if (!catOverride) return;
        if (catOverride.linhas) {
          form[categoria].linhas.forEach((linha) => {
            const ov = catOverride.linhas[linha.evento];
            if (ov) Object.assign(linha, ov);
          });
        }
        if (catOverride.antecipacaoSabado !== undefined) form[categoria].antecipacaoSabado = catOverride.antecipacaoSabado;
      });
    }
    return form;
  }

  // ===== Histórico (Fase 8) — mocks estáticos/demonstrativos =====
  // Fonte: docs/folha-pagamento-fase8-analise-arquitetura-historico.md.
  // IMPORTANTE: nenhum destes eventos é produzido pelos handlers de "Salvar"
  // das Fases 1-7 — nenhuma instrumentação real existe nesta implementação
  // (decisão registrada na arquitetura, seções 3.4/14/16 — instrumentar os
  // handlers já congelados é decisão futura separada, não tomada aqui). Todo
  // evento abaixo é Categoria D (demonstrativo): não representa nenhuma
  // alteração real ocorrida no protótipo.
  //
  // Forma de cada evento: { id, data, hora, usuario, area, acao, alteracoes?
  // , descricao? }. "alteracoes" (campo/de/para) reaproveita exatamente o
  // mesmo formato de EmpresasData.registrarEventoHistorico/
  // getHistoricoAlteracoes (prototype/empresas/js/data.js) para a mudança
  // granular; "descricao" cobre o evento que é melhor representado como uma
  // frase única (ex.: abertura de nova vigência), quando não há um par
  // de/para célula a célula para tabular. "area" reaproveita exatamente os
  // labels já existentes em AREAS (acima) — nenhuma taxonomia nova.
  // Listas já ordenadas do evento mais recente para o mais antigo.
  const HISTORICO_MOCKS_POR_EMPRESA = {
    "PA-0011": [
      {
        id: "PA-0011-hist-4", data: "12/08/2026", hora: "14:22", usuario: "Wender Jonathan", area: "Cronograma", acao: "Atualização de parâmetros",
        alteracoes: [{ campo: "Mês do pagamento (Folha Mensal — Empregados)", de: "1º Mês subsequente", para: "No mesmo mês" }],
      },
      {
        id: "PA-0011-hist-3", data: "30/07/2026", hora: "10:05", usuario: "Andressa Lima", area: "Adiantamento", acao: "Atualização de parâmetros",
        alteracoes: [
          { campo: "Percentual", de: "35%", para: "40%" },
          { campo: "Base de Cálculo", de: "Salário Contratual", para: "Salário e Adicionais" },
        ],
      },
      {
        id: "PA-0011-hist-2", data: "18/06/2026", hora: "09:40", usuario: "Wender Jonathan", area: "Regime", acao: "Nova vigência iniciada",
        descricao: "Nova vigência do Regime iniciada em 06/2026, a partir da vigência anterior.",
      },
      {
        id: "PA-0011-hist-1", data: "02/03/2026", hora: "16:15", usuario: "Elaine Calazans", area: "Geral", acao: "Atualização de parâmetros",
        alteracoes: [{ campo: "Competência atual", de: "2026-02", para: "2026-03" }],
      },
    ],
    "MS-0027": [
      {
        id: "MS-0027-hist-2", data: "22/07/2026", hora: "11:30", usuario: "Andressa Lima", area: "13º Salário", acao: "Atualização de parâmetros",
        alteracoes: [{ campo: "Percentual de adiantamento", de: "45%", para: "50%" }],
      },
      {
        id: "MS-0027-hist-1", data: "10/04/2026", hora: "08:52", usuario: "Wender Jonathan", area: "Contabilidade", acao: "Atualização de parâmetros",
        alteracoes: [{ campo: "Separar lançamentos por", de: "Não Separar", para: "Por centro de custo" }],
      },
    ],
    // "CH-0042" e "MS-0027-F2" permanecem sem entrada — caem no fallback
    // vazio (nenhum evento), exercitando o estado vazio da aba (empresa sem
    // nenhuma alteração registrada até o momento).
    "MS-0027-F1": [
      {
        id: "MS-0027-F1-hist-1", data: "05/05/2026", hora: "13:00", usuario: "Elaine Calazans", area: "Férias", acao: "Atualização de parâmetros",
        alteracoes: [{ campo: "Calcular 1/3 de férias para Estagiários", de: "Não", para: "Sim" }],
      },
    ],
  };

  // Delegação para a infraestrutura de eventos reais (P24, Pacote 1 —
  // docs/folha-pagamento-fase8-p24-projeto-tecnico-historico-real.md,
  // Decisão 2/D-8). Assinatura, retorno e comportamento observável
  // preservados: sem eventos reais, retorna exatamente os mesmos mocks de
  // sempre (D-6). Nenhuma lógica de persistência/D-6 vive aqui — apenas a
  // delegação.
  function getHistoricoEventos(empresa) {
    return global.FolhaHistoricoEventos.getHistoricoEventosFolha(empresa, HISTORICO_MOCKS_POR_EMPRESA);
  }

  global.FolhaData = {
    AREAS,
    OPCOES: O,
    defaultGeralForm,
    defaultRegimeForm,
    defaultArredondamentoForm,
    defaultAdiantamentoForm,
    defaultDecimoTerceiroForm,
    defaultFeriasForm,
    defaultContabilidadeForm,
    defaultHonorariosForm,
    defaultCronogramaForm,
    getHistoricoEventos,
    getQueryParam: function (name) {
      return new URLSearchParams(window.location.search).get(name);
    },
  };
})(window);
