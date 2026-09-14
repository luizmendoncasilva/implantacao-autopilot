/*
  Dados mock da trilha DP > Sindicatos e Convenções — fictícios, só para
  validação de UX/UI (protótipo navegável, sem backend). Campos e agrupamentos
  seguem docs/Especificacao_Cadastro_Sindicato_Convencao.md; nada aqui declara
  regra de negócio nova além do que a especificação descreve.

  Mesmo padrão de persistência local usado em cadastros-auxiliares/js/socios/data.js:
  lista inicial embutida + overlay em localStorage (prefixo "autopilot_prototype_",
  limpo pelo FAB "Restaurar dados do protótipo").
*/
(function (global) {
  function loadStore(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallback));
    } catch (e) {
      return JSON.parse(JSON.stringify(fallback));
    }
  }
  function saveStore(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* localStorage indisponível — segue só em memória nesta renderização */
    }
  }

  // ===== Sindicatos (Parte I da especificação) =====
  const SINDICATOS_INICIAL = [
    {
      codigo: "SIND-0001",
      nome: "Sindicato dos Empregados no Comércio de Goiânia",
      cep: "74.223-000", endereco: "Rua das Flores", numero: "500", complemento: "Sala 2",
      bairro: "Setor Bueno", cidade: "Goiânia", uf: "GO",
      cnpj: "01.234.567/0001-89", telefone: "(62) 3210-9900", fax: "",
      site: "www.sintracomgo.org.br", email: "contato@sintracomgo.org.br",
      tipoEntidade: "Sindicato", cnes: "SIND.0001.2024",
    },
    {
      codigo: "SIND-0002",
      nome: "Sindicato dos Trabalhadores nas Indústrias Metalúrgicas de Goiânia",
      cep: "74.675-000", endereco: "Av. Industrial", numero: "1200", complemento: "",
      bairro: "Distrito Industrial", cidade: "Goiânia", uf: "GO",
      cnpj: "02.345.678/0001-70", telefone: "(62) 3299-1188", fax: "(62) 3299-1189",
      site: "www.metalurgicosgoiania.org.br", email: "secretaria@metalurgicosgoiania.org.br",
      tipoEntidade: "Sindicato", cnes: "SIND.0002.2024",
    },
    {
      codigo: "SIND-0003",
      nome: "Federação dos Professores do Estado de Goiás",
      cep: "74.030-010", endereco: "Av. Anhanguera", numero: "3400", complemento: "8º andar",
      bairro: "Centro", cidade: "Goiânia", uf: "GO",
      cnpj: "03.456.789/0001-61", telefone: "(62) 3224-5500", fax: "",
      site: "www.fepeg.org.br", email: "fepeg@fepeg.org.br",
      tipoEntidade: "Federação", cnes: "SIND.0003.2024",
    },
  ];

  // ===== Convenções Coletivas (Partes II e III da especificação) =====
  // Cada convenção referencia o sindicato por `sindicatoCodigo` (vínculo
  // obrigatório). Os três registros abaixo cobrem deliberadamente estados
  // distintos (preenchida/rica, com blocos vazios, com histórico processual)
  // para que o protótipo demonstre todos os estados listados na especificação
  // de UX sem depender de o usuário criar dados do zero.
  const CONVENCOES_INICIAL = [
    {
      codigo: "CONV-0001",
      sindicatoCodigo: "SIND-0001",
      descricao: "Convenção Coletiva 2026 — Comerciários de Goiânia",
      configGerais: {
        salarioMesAdmissao: "sempre-30-dias",
        calcProporcionalidadeHorista: "dias-do-mes",
        adicionalNoturno: "25,00",
        horaExtra: "60,00",
        mesesFeriasProporcionais: "12",
        indenizar13FeriasAvisoReavido: "sim",
        descontarDSRFaltaIntegral: { ativo: true, proporcao: "1/6" },
        calcularDSRProfessorMensalista: false,
        calcularSalarioProporcionalDias: "nao",
        regrasDiasReais: { semEventos: false, comAfastamento: false, comFerias: false, rescisao: false, admissao: false, divisor: false },
      },
      dataBasePrazos: {
        dataBase: "01/05",
        calcularDiferencaContribAssistencial: true,
        diasAusenciaAbonados: { ativo: true, dias: "3" },
        percentualMaxVT: "",
        limiteCargaHoraria: { ativo: false, min: "", max: "" },
        diasIndenizacaoDataBase: "30",
        naoPagarIndenizacaoAposDataLimite: "01/04",
        diasAssistenciaHomologacao: "10",
        diasPagamentoRescisao: "",
        formaApuracaoDias: "dias-corridos-antecipados",
        regrasContratoExperiencia: true,
      },
      contribuicoes: {
        assistencial: { ativa: true, mesFolha: "Maio", formaFolha: "percentual", diasFolha: "30", mes13: "Novembro", forma13: "percentual", dias13: "20", descontoAdmissaoPercentual: "1,00", semDescontarEmpregado: false },
        associativa: { ativa: false, mesFolha: "", formaFolha: "", diasFolha: "", mes13: "", forma13: "", dias13: "" },
        confederativa: { ativa: true, mesFolha: "Maio", formaFolha: "percentual", diasFolha: "30", mes13: "", forma13: "", dias13: "", naoCumular: true },
        sindical: { ativa: true, mes: "Março", forma: "percentual", diasTotal: "30" },
        mesContribuicaoSindicalAnual: "Março",
        gradeConfiguracaoContribAssistencial: [
          { faixa: "Até 1 salário mínimo", percentual: "1,00", valorFixo: "" },
          { faixa: "Acima de 1 salário mínimo", percentual: "1,50", valorFixo: "" },
        ],
      },
      empresasVinculadas: ["PA-0011", "CH-0042"],
      pisoSalarial: [
        { codigo: "PISO-01", descricao: "Balconista", valor: "1.750,00" },
        { codigo: "PISO-02", descricao: "Caixa", valor: "1.820,00" },
        { codigo: "PISO-03", descricao: "Repositor", valor: "1.680,00" },
      ],
      historico: [
        { data: "01/05/2026", descricao: "Reajuste anual — data-base 2026", tipo: "Convenção Coletiva", numeroProcesso: "", percentualCCT: "5,20" },
        { data: "01/05/2025", descricao: "Reajuste anual — data-base 2025", tipo: "Convenção Coletiva", numeroProcesso: "", percentualCCT: "4,60" },
      ],
      condicionais: {
        calculos: {
          ferias: {
            pagarAvosAfastamento180: true,
            novoPeriodoAquisitivoColetivas: false,
            adiantar13Ferias: true,
            fracaoMinimaAvos: { ativo: true, dias: "15" },
            gratificacaoFerias: { ativo: false },
          },
          decimoTerceiro: {
            avosLimitadosAfastamento: { ativo: true, dias: "180" },
            maiorGradeProfessor: false,
            reaproveitarUltimoValorAdicional: true,
          },
          avisoPrevio: {
            avisoMisto: true,
            tratamentoLei12506: "indenizado",
            liminarInssAvisoIndenizado: false,
            suspensaoFeriasColetivas: true,
          },
          garantiaSemestral: { aplicacaoProfessorAulista: false },
          licencaPremio: { possui: false, pagarMediaAdicional: false, indenizarNaoGozados: false },
          resilicaoProfessor: { calcular13ReducaoGrade: false, calcularFeriasReducaoGrade: false },
          adicionalTempoServico: { possuiGrade: true, grade: [
            { periodicidade: "A cada 5 anos", percentual: "5,00", base: "Salário-base" },
            { periodicidade: "A cada 10 anos", percentual: "10,00", base: "Salário-base" },
          ] },
        },
        comissionado: {
          pagar13ProporcionalEntreRegimes: false,
          possuiGarantiaMinima: false,
        },
        medias: {
          considerarMaisFavoravel: true,
          mediasDiferenciadasModalidade13: false,
          reaproveitamentoMediaFerias: true,
          mediaDiferenciadaComissoes: false,
          formaCalculoMedia: "convencao",
        },
        estabilidade: {
          extensaoAposFerias: false,
          projecaoAvisoPrevioIndenizado: true,
          dilatacaoFeriasGozadas: false,
        },
        indenizacaoEspecial: { possuiRescisao: false, possuiAfastamento: false },
        plr: {
          proporcionalidadeMesesTrabalhados: true,
          regraMesCheio: true,
          plrNaRescisao: true,
          projecaoAvisoPrevio: false,
        },
        observacoes: "Convenção revisada em 2026 — pendente anexar cópia digitalizada do texto homologado no TRT-18.",
      },
    },
    {
      codigo: "CONV-0002",
      sindicatoCodigo: "SIND-0001",
      descricao: "Convenção Coletiva 2026 — Vigilantes (categoria diferenciada)",
      configGerais: {
        salarioMesAdmissao: "sempre-30-dias",
        calcProporcionalidadeHorista: "",
        adicionalNoturno: "20,00",
        horaExtra: "50,00",
        mesesFeriasProporcionais: "",
        indenizar13FeriasAvisoReavido: "",
        descontarDSRFaltaIntegral: { ativo: false, proporcao: "" },
        calcularDSRProfessorMensalista: false,
        calcularSalarioProporcionalDias: "",
        regrasDiasReais: { semEventos: false, comAfastamento: false, comFerias: false, rescisao: false, admissao: false, divisor: false },
      },
      dataBasePrazos: {
        dataBase: "01/09",
        calcularDiferencaContribAssistencial: false,
        diasAusenciaAbonados: { ativo: false, dias: "" },
        percentualMaxVT: "",
        limiteCargaHoraria: { ativo: false, min: "", max: "" },
        diasIndenizacaoDataBase: "",
        naoPagarIndenizacaoAposDataLimite: "",
        diasAssistenciaHomologacao: "",
        diasPagamentoRescisao: "",
        formaApuracaoDias: "",
        regrasContratoExperiencia: false,
      },
      contribuicoes: {
        assistencial: { ativa: false, mesFolha: "", formaFolha: "", diasFolha: "", mes13: "", forma13: "", dias13: "", descontoAdmissaoPercentual: "", semDescontarEmpregado: false },
        associativa: { ativa: false, mesFolha: "", formaFolha: "", diasFolha: "", mes13: "", forma13: "", dias13: "" },
        confederativa: { ativa: false, mesFolha: "", formaFolha: "", diasFolha: "", mes13: "", forma13: "", dias13: "", naoCumular: false },
        sindical: { ativa: false, mes: "", forma: "", diasTotal: "" },
        mesContribuicaoSindicalAnual: "",
        gradeConfiguracaoContribAssistencial: [],
      },
      empresasVinculadas: [],
      pisoSalarial: [],
      historico: [],
      condicionais: {
        calculos: {
          ferias: { pagarAvosAfastamento180: false, novoPeriodoAquisitivoColetivas: false, adiantar13Ferias: false, fracaoMinimaAvos: { ativo: false, dias: "" }, gratificacaoFerias: { ativo: false } },
          decimoTerceiro: { avosLimitadosAfastamento: { ativo: false, dias: "" }, maiorGradeProfessor: false, reaproveitarUltimoValorAdicional: false },
          avisoPrevio: { avisoMisto: false, tratamentoLei12506: "", liminarInssAvisoIndenizado: false, suspensaoFeriasColetivas: false },
          garantiaSemestral: { aplicacaoProfessorAulista: false },
          licencaPremio: { possui: false, pagarMediaAdicional: false, indenizarNaoGozados: false },
          resilicaoProfessor: { calcular13ReducaoGrade: false, calcularFeriasReducaoGrade: false },
          adicionalTempoServico: { possuiGrade: false, grade: [] },
        },
        comissionado: { pagar13ProporcionalEntreRegimes: false, possuiGarantiaMinima: false },
        medias: { considerarMaisFavoravel: false, mediasDiferenciadasModalidade13: false, reaproveitamentoMediaFerias: false, mediaDiferenciadaComissoes: false, formaCalculoMedia: "" },
        estabilidade: { extensaoAposFerias: false, projecaoAvisoPrevioIndenizado: false, dilatacaoFeriasGozadas: false },
        indenizacaoEspecial: { possuiRescisao: false, possuiAfastamento: false },
        plr: { proporcionalidadeMesesTrabalhados: false, regraMesCheio: false, plrNaRescisao: false, projecaoAvisoPrevio: false },
        observacoes: "",
      },
    },
    {
      codigo: "CONV-0003",
      sindicatoCodigo: "SIND-0002",
      descricao: "Convenção Coletiva 2026 — Metalúrgicos de Goiânia",
      configGerais: {
        salarioMesAdmissao: "sempre-30-dias",
        calcProporcionalidadeHorista: "conforme-dias-do-mes",
        adicionalNoturno: "30,00",
        horaExtra: "70,00",
        mesesFeriasProporcionais: "12",
        indenizar13FeriasAvisoReavido: "sim",
        descontarDSRFaltaIntegral: { ativo: false, proporcao: "" },
        calcularDSRProfessorMensalista: false,
        calcularSalarioProporcionalDias: "sim",
        regrasDiasReais: { semEventos: true, comAfastamento: true, comFerias: false, rescisao: true, admissao: false, divisor: true },
      },
      dataBasePrazos: {
        dataBase: "01/11",
        calcularDiferencaContribAssistencial: false,
        diasAusenciaAbonados: { ativo: false, dias: "" },
        percentualMaxVT: "5,00",
        limiteCargaHoraria: { ativo: true, min: "180", max: "220" },
        diasIndenizacaoDataBase: "30",
        naoPagarIndenizacaoAposDataLimite: "01/10",
        diasAssistenciaHomologacao: "10",
        diasPagamentoRescisao: "10",
        formaApuracaoDias: "dias-uteis",
        regrasContratoExperiencia: false,
      },
      contribuicoes: {
        assistencial: { ativa: true, mesFolha: "Novembro", formaFolha: "percentual", diasFolha: "30", mes13: "Dezembro", forma13: "percentual", dias13: "20", descontoAdmissaoPercentual: "1,00", semDescontarEmpregado: true },
        associativa: { ativa: true, mesFolha: "Novembro", formaFolha: "valor-fixo", diasFolha: "30", mes13: "", forma13: "", dias13: "" },
        confederativa: { ativa: false, mesFolha: "", formaFolha: "", diasFolha: "", mes13: "", forma13: "", dias13: "", naoCumular: false },
        sindical: { ativa: true, mes: "Março", forma: "percentual", diasTotal: "30" },
        mesContribuicaoSindicalAnual: "Março",
        gradeConfiguracaoContribAssistencial: [{ faixa: "Todos os salários", percentual: "2,00", valorFixo: "" }],
      },
      empresasVinculadas: ["MS-0027", "MS-0027-F1", "MS-0027-F2"],
      pisoSalarial: [
        { codigo: "PISO-01", descricao: "Ajudante de produção", valor: "1.690,00" },
        { codigo: "PISO-02", descricao: "Soldador", valor: "2.340,00" },
        { codigo: "PISO-03", descricao: "Torneiro mecânico", valor: "2.510,00" },
        { codigo: "PISO-04", descricao: "Encarregado de produção", valor: "3.120,00" },
      ],
      historico: [
        { data: "01/11/2026", descricao: "Dissídio coletivo — TRT 18ª Região", tipo: "Sentença normativa", numeroProcesso: "0010234-56.2026.5.18.0000", percentualCCT: "6,10" },
        { data: "01/11/2025", descricao: "Acordo coletivo — reajuste antecipado", tipo: "Acordo Coletivo", numeroProcesso: "", percentualCCT: "5,00" },
        { data: "01/11/2024", descricao: "Convenção coletiva — data-base 2024", tipo: "Convenção Coletiva", numeroProcesso: "", percentualCCT: "4,80" },
      ],
      condicionais: {
        calculos: {
          ferias: { pagarAvosAfastamento180: false, novoPeriodoAquisitivoColetivas: true, adiantar13Ferias: false, fracaoMinimaAvos: { ativo: false, dias: "" }, gratificacaoFerias: { ativo: true } },
          decimoTerceiro: { avosLimitadosAfastamento: { ativo: false, dias: "" }, maiorGradeProfessor: false, reaproveitarUltimoValorAdicional: false },
          avisoPrevio: { avisoMisto: false, tratamentoLei12506: "aviso-indenizado", liminarInssAvisoIndenizado: true, suspensaoFeriasColetivas: false },
          garantiaSemestral: { aplicacaoProfessorAulista: false },
          licencaPremio: { possui: true, pagarMediaAdicional: true, indenizarNaoGozados: false },
          resilicaoProfessor: { calcular13ReducaoGrade: false, calcularFeriasReducaoGrade: false },
          adicionalTempoServico: { possuiGrade: false, grade: [] },
        },
        comissionado: { pagar13ProporcionalEntreRegimes: true, possuiGarantiaMinima: true },
        medias: { considerarMaisFavoravel: true, mediasDiferenciadasModalidade13: true, reaproveitamentoMediaFerias: false, mediaDiferenciadaComissoes: true, formaCalculoMedia: "clt" },
        estabilidade: { extensaoAposFerias: true, projecaoAvisoPrevioIndenizado: false, dilatacaoFeriasGozadas: true },
        indenizacaoEspecial: { possuiRescisao: true, possuiAfastamento: false },
        plr: { proporcionalidadeMesesTrabalhados: true, regraMesCheio: true, plrNaRescisao: false, projecaoAvisoPrevio: true },
        observacoes: "",
      },
    },
  ];

  const SINDICATOS_KEY = "autopilot_prototype_sindicatos_v1";
  const CONVENCOES_KEY = "autopilot_prototype_convencoes_v1";

  function getSindicatos() { return loadStore(SINDICATOS_KEY, SINDICATOS_INICIAL); }
  function setSindicatos(lista) { saveStore(SINDICATOS_KEY, lista); }
  function findSindicatoByCodigo(codigo) { return getSindicatos().find((s) => s.codigo === codigo); }

  function getConvencoes() { return loadStore(CONVENCOES_KEY, CONVENCOES_INICIAL); }
  function setConvencoes(lista) { saveStore(CONVENCOES_KEY, lista); }
  function findConvencaoByCodigo(codigo) { return getConvencoes().find((c) => c.codigo === codigo); }
  function convencoesDoSindicato(sindicatoCodigo) { return getConvencoes().filter((c) => c.sindicatoCodigo === sindicatoCodigo); }

  function proximoCodigo(lista, prefixo) {
    const numeros = lista
      .map((item) => Number((item.codigo || "").replace(prefixo + "-", "")))
      .filter((n) => !Number.isNaN(n));
    const proximo = (numeros.length ? Math.max(...numeros) : 0) + 1;
    return prefixo + "-" + String(proximo).padStart(4, "0");
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  const TIPO_ENTIDADE_OPCOES = ["Sindicato", "Federação", "Confederação"];
  const UF_OPCOES = ["GO", "SP", "RJ", "MG", "DF", "MT", "MS", "TO", "BA", "PR", "SC", "RS", "PE", "CE"];

  const CONFIG_GERAIS_OPCOES = {
    salarioMesAdmissao: [{ value: "sempre-30-dias", label: "Sempre 30 dias" }, { value: "dias-corridos", label: "Dias corridos do mês" }],
    calcProporcionalidadeHorista: [{ value: "dias-do-mes", label: "Conforme dias do mês" }, { value: "conforme-dias-do-mes", label: "Conforme escala/dias trabalhados" }],
    mesesFeriasProporcionais: Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
    simNao: [{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }],
    proporcaoDSR: [{ value: "1/5", label: "1/5" }, { value: "1/6", label: "1/6" }],
  };
  const FORMA_APURACAO_DIAS_OPCOES = [{ value: "dias-corridos-antecipados", label: "Dias corridos antecipados" }, { value: "dias-uteis", label: "Dias úteis" }];
  const MESES_OPCOES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const FORMA_CONTRIBUICAO_OPCOES = [{ value: "percentual", label: "Percentual" }, { value: "valor-fixo", label: "Valor fixo" }];
  const TIPO_HISTORICO_OPCOES = ["Convenção Coletiva", "Acordo Coletivo", "Sentença normativa"];
  const TRATAMENTO_LEI_OPCOES = [{ value: "aviso-indenizado", label: "Considerar como aviso indenizado" }, { value: "aviso-trabalhado", label: "Considerar como aviso trabalhado" }];
  const FORMA_CALCULO_MEDIA_OPCOES = [{ value: "clt", label: "CLT" }, { value: "convencao", label: "Convenção Coletiva" }];

  global.SindicatosData = {
    SINDICATOS_INICIAL,
    getSindicatos, setSindicatos, findSindicatoByCodigo,
    getConvencoes, setConvencoes, findConvencaoByCodigo, convencoesDoSindicato,
    proximoCodigo, getQueryParam,
    TIPO_ENTIDADE_OPCOES, UF_OPCOES,
    CONFIG_GERAIS_OPCOES, FORMA_APURACAO_DIAS_OPCOES, MESES_OPCOES,
    FORMA_CONTRIBUICAO_OPCOES, TIPO_HISTORICO_OPCOES, TRATAMENTO_LEI_OPCOES, FORMA_CALCULO_MEDIA_OPCOES,
  };
})(window);
