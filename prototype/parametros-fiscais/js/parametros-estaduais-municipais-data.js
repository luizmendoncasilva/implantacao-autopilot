/*
  Mocks da aba "Estaduais e Municipais" — exclusivos da trilha Fiscal.
  Arquivo renomeado em 2026-09-09 (de estaduais-municipais-data.js) —
  mesma nomenclatura explícita adotada em parametros-estaduais-
  municipais.js; nenhuma mudança de estrutura de dados, só de nome do
  arquivo e do objeto global exportado (ver final do arquivo). A chave de
  `localStorage` (MANUAL_OVERRIDES_KEY, abaixo) foi mantida sem alteração
  deliberadamente, para não invalidar overrides já persistidos por quem
  já usou o protótipo antes desta rodada.

  "Aproveitar créditos de ICMS pelas entradas", "Regime especial de
  apuração do ICMS (RPA)" e "Empresa designada substituta de ISS" foram
  introduzidos em 2026-09-09 como representação Fase 2 (sem mock, sem
  persistência) e tornados funcionais na mesma data ("Ajuste funcional —
  Checkboxes de Estaduais e Municipais"): passaram a ser Checkbox Manual
  como os demais, com mock booleano (`false`/Inativo — nenhum estava
  habilitado antes, por não terem estado algum) e persistidos na mesma
  chave já existente (MANUAL_OVERRIDES_KEY, abaixo). O badge "Fase 2" e as
  legendas explicativas que os acompanhavam na tela foram removidos
  (`parametros-estaduais-municipais.js`) — a prioridade documentada
  (Fase 2, `docs/02-parametros-fiscais.md`, seções 6/7) não mudou, só a
  representação na interface passou a ser funcional por decisão de
  produto desta rodada.

  MVP (docs/parametros-fiscais-as-built.md): "Condição de contribuinte de
  ICMS" (Estaduais, Cockpit) + "Forma de cálculo do ISS" e "ISS fixo por
  classe profissional" (Municipais, Manual — D18/D19).

  Rodada de complementação de conteúdo (docs/02-parametros-fiscais.md,
  seção 6, campos Desejável) adiciona a "Estaduais": "Substituto
  tributário" e "Recolher ICMS/ISS com valor fixo" (Checkbox, Manual —
  reclassificados de Manual para esta rodada após conflito reportado e
  validado contra a SPEC, ver relatório da tarefa), "Base de cálculo do
  FCP/FECP" (D15, Lista suspensa, Manual), "Reduções e deduções da base do
  Simples Nacional" (D16, Lista múltipla, Manual) e "Perfil do SPED
  Fiscal" (D17, Lista suspensa, Manual). "Inscrição Estadual de substituto
  por UF" (Cockpit) não tem mock de valor: a melhoria que permitiria ao
  Cockpit manter uma inscrição por UF ainda não existe (ver
  docs/02-parametros-fiscais.md, seção 13, "Inscrição estadual em demais
  UFs") — o campo é sempre exibido como "sem valor disponível", sem
  inventar dado. "Benefícios e convênios de ICMS" (Cadastro repetível,
  Manual) NÃO tem mock/implementação nesta rodada: a documentação não
  define a estrutura de colunas do cadastro (só descreve o conteúdo em
  prosa — "redução de base, isenção, diferimento e crédito presumido, por
  UF e produto") — lacuna registrada no relatório da tarefa, sem inventar
  estrutura.

  Opções de D15, D16, D17, D18 e D19 (docs/02-parametros-fiscais.md, seção
  14) reproduzidas literalmente — nenhuma opção inventada.
*/
(function (global) {
  const OPCOES_FORMA_CALCULO_ISS = [
    "Percentual sobre faturamento (dentro do DAS)",
    "ISS fixo por profissional habilitado",
    "ISS fixo municipal (fora do DAS)",
    "ISS por regime especial municipal",
  ];

  const OPCOES_CLASSE_PROFISSIONAL = [
    "Advocacia",
    "Contabilidade",
    "Medicina",
    "Odontologia",
    "Engenharia",
    "Arquitetura",
    "Psicologia",
    "Fisioterapia",
    "Veterinária",
    "Outra",
    "Não aplicável",
  ];

  const OPCOES_BASE_CALCULO_FCP_FECP = ["Alíquota do ICMS da nota", "Alíquota do ICMS do movimento de estoque", "Não calcular"];

  const OPCOES_REDUCOES_DEDUCOES_BASE_SN = [
    "Deduzir ICMS-ST da receita bruta",
    "Deduzir pedágio (operações de transporte)",
    "Dedução para emissoras de rádio e TV (horário gratuito)",
    "Não utilizar redução da BC da tabela de alíquota municipal",
    "Considerar todas as casas decimais na redução de BC do ICMS",
    "Aplicar redução de BC do ICMS com receita acumulada zerada",
    "Empresa inscrita no CADIN — sem benefício de redução de BC de ICMS",
    "Redução de ICMS por lei estadual específica",
    "Nenhuma",
  ];

  const OPCOES_PERFIL_SPED_FISCAL = ["Perfil A", "Perfil B", "Perfil C", "Não obrigada"];

  const PADRAO = {
    formaCalculoIss: "Percentual sobre faturamento (dentro do DAS)",
    issFixoClasseProfissional: "Não aplicável",
    substitutoTributario: false,
    recolherIcmsIssValorFixo: false,
    baseCalculoFcpFecp: "Não calcular",
    reducoesDeducoesBaseSn: ["Nenhuma"],
    perfilSpedFiscal: "Não obrigada",
    aproveitarCreditosIcms: false,
    regimeEspecialApuracaoIcms: false,
    empresaSubstitutaIss: false,
  };

  const POR_EMPRESA = {
    "PA-0011": {
      formaCalculoIss: "Percentual sobre faturamento (dentro do DAS)",
      issFixoClasseProfissional: "Não aplicável",
      substitutoTributario: false,
      recolherIcmsIssValorFixo: false,
      baseCalculoFcpFecp: "Alíquota do ICMS da nota",
      reducoesDeducoesBaseSn: ["Deduzir ICMS-ST da receita bruta"],
      perfilSpedFiscal: "Perfil B",
      aproveitarCreditosIcms: false,
      regimeEspecialApuracaoIcms: false,
      empresaSubstitutaIss: false,
    },
    // CH-0042 já é tratada, no mock de Fiscal, como Anexo IV — Serviços
    // (reclassificação de demonstração documentada em gerais-data.js).
    "CH-0042": {
      formaCalculoIss: "ISS fixo por profissional habilitado",
      issFixoClasseProfissional: "Contabilidade",
      substitutoTributario: true,
      recolherIcmsIssValorFixo: true,
      baseCalculoFcpFecp: "Não calcular",
      reducoesDeducoesBaseSn: ["Nenhuma"],
      perfilSpedFiscal: "Não obrigada",
      aproveitarCreditosIcms: false,
      regimeEspecialApuracaoIcms: false,
      empresaSubstitutaIss: false,
    },
  };

  // vigenciaId (etapa "Vigência Funcional"): ver comentário equivalente em
  // gerais-data.js — override agora é { [codigoEmpresa]: { [vigenciaId]:
  // valores } }.
  function getDados(codigoEmpresa, vigenciaId) {
    const base = POR_EMPRESA[codigoEmpresa] || PADRAO;
    const overridesEmpresa = getOverrides()[codigoEmpresa] || {};
    const overrideVigencia = vigenciaId ? overridesEmpresa[vigenciaId] : null;
    return overrideVigencia ? Object.assign({}, base, overrideVigencia) : base;
  }

  // Persistência dos campos Manual desta aba, por empresa × vigência, em
  // localStorage — mesmo padrão técnico já usado em `gerais-data.js`. Não
  // altera "Condição de contribuinte de ICMS" (Cockpit) nem "Inscrição
  // Estadual de substituto por UF" (Cockpit, sem fonte) nem `EmpresasData`.
  const MANUAL_OVERRIDES_KEY = "autopilot_prototype_fiscal_estaduais_municipais_manual_v1";
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

  global.FiscalParametrosEstaduaisMunicipaisData = {
    getDados: getDados,
    setDadosManuais: setDadosManuais,
    OPCOES_FORMA_CALCULO_ISS: OPCOES_FORMA_CALCULO_ISS,
    OPCOES_CLASSE_PROFISSIONAL: OPCOES_CLASSE_PROFISSIONAL,
    OPCOES_BASE_CALCULO_FCP_FECP: OPCOES_BASE_CALCULO_FCP_FECP,
    OPCOES_REDUCOES_DEDUCOES_BASE_SN: OPCOES_REDUCOES_DEDUCOES_BASE_SN,
    OPCOES_PERFIL_SPED_FISCAL: OPCOES_PERFIL_SPED_FISCAL,
  };
})(window);
