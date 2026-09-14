/*
  Vigências da trilha Fiscal — modelo empresa × vigência (etapa "Vigência
  Funcional"). Antes desta etapa, FiscalData.VIGENCIAS era uma única lista
  global usada para qualquer empresa (docs/parametros-fiscais-as-built.md,
  seção 3, limitação registrada). Este módulo substitui aquela lista por um
  conjunto próprio por empresa, isolado e persistido, e concentra a única
  regra de criação de vigência definida nesta etapa: data de início
  obrigatória, válida e posterior ao início da vigência atual — nenhuma
  regra de conflito mais sofisticada foi inventada.

  Cada vigência = { id, dataInicio, dataFim (null = atual) }. As chaves
  regimeTributario/anexo/tipoEstabelecimento do mock anterior eram só
  metadado de exibição da linha do tempo (shared/js/vigencia.js não as
  utiliza mais na etapa atual — ver renderTimelineItem) e foram descartadas
  aqui: recriá-las por vigência sem uma origem real seria inventar dado.

  Seed inicial: PA-0011 preserva o histórico de 3 vigências já usado para
  validar o componente (mesmas datas do antigo FiscalData.VIGENCIAS). As
  demais empresas — incluindo qualquer empresa importada — recebem uma
  única vigência "atual" com data de início padrão, já que não existe
  origem real para reconstruir um histórico anterior a esta etapa.
*/
(function (global) {
  const SEED_POR_EMPRESA = {
    "PA-0011": [
      { id: "pa-v3", dataInicio: "01/01/2026", dataFim: null },
      { id: "pa-v2", dataInicio: "01/07/2025", dataFim: "31/12/2025" },
      { id: "pa-v1", dataInicio: "15/03/2015", dataFim: "30/06/2025" },
    ],
    "CH-0042": [{ id: "ch-v1", dataInicio: "02/01/2020", dataFim: null }],
  };
  const SEED_PADRAO = [{ id: "padrao-v1", dataInicio: "01/01/2015", dataFim: null }];

  const OVERRIDES_KEY = "autopilot_prototype_fiscal_vigencias_v1";

  function getOverrides() {
    try {
      const raw = window.localStorage.getItem(OVERRIDES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function persistOverrides(overrides) {
    try {
      window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    } catch (e) {
      /* localStorage indisponível — segue só em memória nesta renderização */
    }
  }

  // Lista de vigências da empresa: se já houve qualquer alteração
  // persistida (inclusive a simples leitura inicial, nunca gravada
  // sozinha), usa o override; senão cai no seed. Isolamento por empresa:
  // cada código só enxerga sua própria chave, nunca a de outra empresa.
  function getVigencias(codigoEmpresa) {
    const overrides = getOverrides();
    if (overrides[codigoEmpresa]) return overrides[codigoEmpresa];
    return SEED_POR_EMPRESA[codigoEmpresa] || SEED_PADRAO;
  }

  function parseDataBr(data) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data || "");
    if (!m) return null;
    const dia = Number(m[1]);
    const mes = Number(m[2]);
    const ano = Number(m[3]);
    const d = new Date(ano, mes - 1, dia);
    if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
    return d;
  }
  function pad2(n) {
    return String(n).padStart(2, "0");
  }
  function formatarData(d) {
    return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear();
  }
  function diaAnterior(dataBr) {
    const d = parseDataBr(dataBr);
    d.setDate(d.getDate() - 1);
    return formatarData(d);
  }

  // Validação mínima explicitamente instruída para esta etapa: obrigatória,
  // formato válido, cronologicamente coerente com a vigência atual (posterior
  // ao início dela). Nenhuma regra de conflito adicional (sobreposição com
  // vigências históricas, antecedência mínima etc.) foi implementada —
  // registrada como pendência no as-built em vez de inventada aqui.
  function validarNovaData(codigoEmpresa, dataInicio) {
    if (!dataInicio) return "Informe a data de início da nova vigência.";
    const data = parseDataBr(dataInicio);
    if (!data) return "Informe uma data válida no formato dd/mm/aaaa.";
    const atual = getVigencias(codigoEmpresa)[0];
    const dataAtual = parseDataBr(atual.dataInicio);
    if (data <= dataAtual) {
      return "A data de início deve ser posterior ao início da vigência atual (" + atual.dataInicio + ").";
    }
    return null;
  }

  function proximoId(codigoEmpresa) {
    const vigencias = getVigencias(codigoEmpresa);
    return codigoEmpresa + "-vig-" + (vigencias.length + 1) + "-" + Date.now();
  }

  // Cria a nova vigência atual e encerra a anterior no dia imediatamente
  // anterior à nova data de início — decisão de prototype explicitamente
  // registrada (a alternativa seria pedir também uma data de fim explícita
  // para a vigência encerrada, mas o enunciado desta etapa não define essa
  // segunda data). NÃO copia parâmetros: a herança dos 9 campos Manual das
  // 4 abas é responsabilidade de fiscal-page.js, que conhece os módulos de
  // dados de cada aba — este módulo só conhece a lista de vigências em si.
  function criarNovaVigencia(codigoEmpresa, dataInicio) {
    const erro = validarNovaData(codigoEmpresa, dataInicio);
    if (erro) throw new Error(erro);

    const vigencias = getVigencias(codigoEmpresa).map((v) => Object.assign({}, v));
    const atualAnterior = vigencias[0];
    atualAnterior.dataFim = diaAnterior(dataInicio);

    const nova = { id: proximoId(codigoEmpresa), dataInicio: dataInicio, dataFim: null };
    const atualizadas = [nova].concat(vigencias);

    const overrides = getOverrides();
    overrides[codigoEmpresa] = atualizadas;
    persistOverrides(overrides);

    return { vigencias: atualizadas, novaVigencia: nova, vigenciaAnteriorId: atualAnterior.id };
  }

  global.FiscalVigenciasData = {
    getVigencias: getVigencias,
    criarNovaVigencia: criarNovaVigencia,
    validarNovaData: validarNovaData,
  };
})(window);
