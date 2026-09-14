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
    },
    // Comércio Horizonte — mock de Fiscal já trata como Anexo IV/Serviços
    // (ver gerais-data.js); aqui emite NFS-e, coerente com essa mesma
    // reclassificação de demonstração.
    "CH-0042": {
      documentosFiscaisEmitidos: ["NFS-e"],
      serieNumeracao: [{ tipoDocumento: "NFS-e", serie: "1", numeracao: "1 a 999999", estabelecimento: "Matriz" }],
      esocialParametrizacaoBasica: false,
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

  // Persistência do único campo Manual desta aba (eSocial — parametrização
  // básica; rodada de refinamento funcional — jornada de edição), por
  // empresa × vigência, em localStorage — mesmo padrão técnico já usado em
  // `gerais-data.js`. Não altera Documentos fiscais emitidos/Série e
  // numeração (BHules) nem PGDAS-D/Guias avulsas/DEFIS/DASN-SIMEI (Motor de
  // cálculo/Sistema).
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
    PGDAS_DAS_STATUS: PGDAS_DAS_STATUS,
  };
})(window);
