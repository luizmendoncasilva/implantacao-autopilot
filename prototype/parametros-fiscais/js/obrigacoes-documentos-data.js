/*
  Mocks da aba "Obrigações e Documentos Fiscais" — exclusivos da trilha
  Fiscal. Escopo EXCLUSIVO do MVP (docs/02-parametros-fiscais.md, seções 9 e
  11, campos Essenciais): "Documentos fiscais emitidos" e "Série e
  numeração" (Documentos Fiscais, origem BHules, 100% somente leitura) +
  "PGDAS-D e DAS" (Motor de cálculo), "Guias avulsas de ICMS e ISS", "DEFIS",
  "DASN-SIMEI" (Sistema, regra fixa) e "eSocial — parametrização básica"
  (Manual) (Obrigações Acessórias).

  Opções de D22 (docs/02-parametros-fiscais.md, seção 14) reproduzidas
  literalmente — nenhuma opção inventada.

  Rodada de complementação de conteúdo (docs/02-parametros-fiscais.md,
  seção 11, campos Desejável) adiciona a "Obrigações Acessórias": "DTE-SN"
  (Checkbox, Manual), "Procuração eletrônica / Integra Contador" (D23,
  Lista suspensa, Manual), "EFD-Reinf e DCTFWeb" (Checkbox, Manual),
  "EFD-ICMS/IPI (SPED Fiscal)" (Checkbox, Manual) e "MIT" (Checkbox,
  Manual). "DeSTDA" é Regra fixa/Sistema, somente leitura — habilitada
  automaticamente para optante do SN com inscrição estadual (mesma nota
  documentada para DEFIS/DASN-SIMEI) — por isso não tem mock aqui, é
  derivada em obrigacoes-documentos.js a partir de empresa.dadosGerais.ie,
  mesmo critério já usado por "Condição de contribuinte de ICMS"
  (parametros-estaduais-municipais.js).

  "SINTEGRA" (rodada "Ajuste — Obrigações e Documentos Fiscais",
  2026-09-09): documentado como Fase 2 (docs/02-parametros-fiscais.md,
  seção 11), mas tornado funcional por decisão explícita de produto desta
  rodada — mesmo critério já aplicado aos 3 campos de Estaduais e
  Municipais na rodada anterior (Aproveitar créditos de ICMS/RPA/Empresa
  substituta de ISS): Checkbox, Manual, mock booleano (`false`/Inativo —
  nenhuma empresa tinha estado algum antes desta rodada), persistido na
  mesma chave já existente (MANUAL_OVERRIDES_KEY, abaixo).

  "Documentos fiscais emitidos" (D22, rodada "Correção visual/funcional —
  D22", mesmo dia): passou de somente leitura/BHules para Manual/editável
  — mesma resolução já usada para "Regime de reconhecimento de receita"
  (D06, gerais-data.js) quando um campo passa a ser efetivamente editado
  pelo usuário. `documentosFiscaisEmitidos` (array, já existente na
  estrutura) passou a entrar em `setDadosManuais`, na mesma chave já
  existente — nenhuma chave nova. "Série e numeração" **não muda** —
  continua somente leitura, origem BHules, fora de `setDadosManuais`.
*/
(function (global) {
  const OPCOES_DOCUMENTOS_FISCAIS = [
    "NF-e (modelo 55)",
    "NFC-e (modelo 65)",
    "NFS-e",
    "CT-e",
    "CT-e OS",
    "MDF-e",
    "NF3e",
    "BP-e",
    "NFCom",
  ];

  const OPCOES_PROCURACAO_INTEGRA_CONTADOR = [
    "Certificado da própria empresa",
    "Certificado do contador (com procuração)",
    "Procuração eletrônica e-CAC",
  ];

  // "PGDAS-D e DAS": a regra documentada ("mensal por determinação legal,
  // obrigatório mesmo sem movimento") não varia por empresa nem depende de
  // nenhum mock existente — por isso o texto é o mesmo para toda empresa
  // optante pelo Simples Nacional. A variação "acima do sublimite, apurado
  // sem ICMS e ISS" NÃO é modelada aqui: não existe, em nenhum mock desta
  // trilha, uma flag de "empresa acima do sublimite" por empresa (o único
  // lugar em que esse tema aparece é o alerta ilustrativo genérico de
  // FiscalData.ALERTAS, já comentado como "regra real ainda não
  // implementada") — inventar essa flag agora seria criar uma regra de
  // negócio não documentada. Registrado como decisão/pendência no as-built.
  const PGDAS_DAS_STATUS = "Apuração mensal, obrigatória mesmo sem movimento.";

  const PADRAO = {
    documentosFiscaisEmitidos: ["NFS-e"],
    serieNumeracao: [{ tipoDocumento: "NFS-e", serie: "1", numeracao: "1 a 999999", estabelecimento: "Matriz" }],
    esocialParametrizacaoBasica: false,
    dteSnAtivo: false,
    procuracaoEletronicaIntegraContador: "Certificado da própria empresa",
    efdReinfDctfWebAtivo: false,
    efdIcmsIpiAtivo: false,
    mitAtivo: false,
    sintegraAtivo: false,
  };

  const POR_EMPRESA = {
    // Padaria Aurora — comércio: emite NF-e e NFC-e, não NFS-e.
    "PA-0011": {
      documentosFiscaisEmitidos: ["NF-e (modelo 55)", "NFC-e (modelo 65)"],
      serieNumeracao: [
        { tipoDocumento: "NF-e (modelo 55)", serie: "1", numeracao: "1 a 999999", estabelecimento: "Matriz" },
        { tipoDocumento: "NFC-e (modelo 65)", serie: "2", numeracao: "1 a 999999", estabelecimento: "Matriz" },
      ],
      esocialParametrizacaoBasica: true,
      dteSnAtivo: true,
      procuracaoEletronicaIntegraContador: "Certificado do contador (com procuração)",
      efdReinfDctfWebAtivo: true,
      efdIcmsIpiAtivo: false,
      mitAtivo: false,
      sintegraAtivo: false,
    },
    // Comércio Horizonte — mock de Fiscal já trata como Anexo IV/Serviços
    // (ver gerais-data.js); aqui emite NFS-e, coerente com essa mesma
    // reclassificação de demonstração.
    "CH-0042": {
      documentosFiscaisEmitidos: ["NFS-e"],
      serieNumeracao: [{ tipoDocumento: "NFS-e", serie: "1", numeracao: "1 a 999999", estabelecimento: "Matriz" }],
      esocialParametrizacaoBasica: false,
      dteSnAtivo: false,
      procuracaoEletronicaIntegraContador: "Procuração eletrônica e-CAC",
      efdReinfDctfWebAtivo: false,
      efdIcmsIpiAtivo: true,
      mitAtivo: true,
      sintegraAtivo: false,
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
  // localStorage — mesmo padrão técnico já usado em `gerais-data.js`.
  // "Documentos fiscais emitidos" (D22) passou a fazer parte deste
  // mecanismo em 2026-09-09 (ver nota de topo). "Série e numeração" NÃO
  // altera — continua fora de `setDadosManuais`, sempre lida da base
  // (PADRAO/POR_EMPRESA), nunca sobrescrita. PGDAS-D/Guias avulsas/DEFIS/
  // DASN-SIMEI/DeSTDA (Motor de cálculo/Sistema) também continuam fora.
  const MANUAL_OVERRIDES_KEY = "autopilot_prototype_fiscal_obrigacoes_documentos_manual_v1";
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

  global.FiscalObrigacoesDocumentosData = {
    getDados: getDados,
    setDadosManuais: setDadosManuais,
    OPCOES_DOCUMENTOS_FISCAIS: OPCOES_DOCUMENTOS_FISCAIS,
    OPCOES_PROCURACAO_INTEGRA_CONTADOR: OPCOES_PROCURACAO_INTEGRA_CONTADOR,
    PGDAS_DAS_STATUS: PGDAS_DAS_STATUS,
  };
})(window);
