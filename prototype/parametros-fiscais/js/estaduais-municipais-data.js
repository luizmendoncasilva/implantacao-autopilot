/*
  Mocks da aba "Estaduais e Municipais" — exclusivos da trilha Fiscal.
  Escopo EXCLUSIVO do MVP (docs/02-parametros-fiscais.md, seções 6 e 7):
  "Condição de contribuinte de ICMS", "Forma de cálculo do ISS" e "ISS fixo
  por classe profissional". Nenhum dos demais campos de Estaduais/Municipais
  (Desejável/Fase 2) tem mock aqui.

  Opções de D18 e D19 (docs/02-parametros-fiscais.md, seção 14) reproduzidas
  literalmente — nenhuma opção inventada.
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

  const PADRAO = {
    formaCalculoIss: "Percentual sobre faturamento (dentro do DAS)",
    issFixoClasseProfissional: "Não aplicável",
  };

  const POR_EMPRESA = {
    "PA-0011": {
      formaCalculoIss: "Percentual sobre faturamento (dentro do DAS)",
      issFixoClasseProfissional: "Não aplicável",
    },
    // CH-0042 já é tratada, no mock de Fiscal, como Anexo IV — Serviços
    // (reclassificação de demonstração documentada em gerais-data.js, para
    // exercitar a aba Federais). Por coerência com essa mesma empresa
    // demo, usa aqui valores diferentes dos de PA-0011 nos dois campos
    // Municipais só para exercitar as duas opções de dicionário — os dois
    // campos permanecem independentes um do outro no código: nenhuma regra
    // condicional entre "Forma de cálculo do ISS" e "ISS fixo por classe
    // profissional" foi criada (pendência registrada no as-built).
    "CH-0042": {
      formaCalculoIss: "ISS fixo por profissional habilitado",
      issFixoClasseProfissional: "Contabilidade",
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

  // Persistência dos 2 campos Manual desta aba (rodada de refinamento
  // funcional — jornada de edição), por empresa × vigência, em
  // localStorage — mesmo padrão técnico já usado em `gerais-data.js`. Não
  // altera "Condição de contribuinte de ICMS" (Cockpit, somente leitura)
  // nem `EmpresasData`.
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

  global.FiscalEstaduaisMunicipaisData = {
    getDados: getDados,
    setDadosManuais: setDadosManuais,
    OPCOES_FORMA_CALCULO_ISS: OPCOES_FORMA_CALCULO_ISS,
    OPCOES_CLASSE_PROFISSIONAL: OPCOES_CLASSE_PROFISSIONAL,
  };
})(window);
