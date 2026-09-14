/*
  Dados mock do Cadastro de Rubricas (DP) — fictícios, só para validação de
  UX/UI (protótipo navegável, sem backend). Estrutura de campos segue
  docs/Especificacao_Cadastro_Rubricas.md, Fase 1 (ver
  docs/folha-pagamento-pendencias-fases1-8.md e o diagnóstico desta tarefa
  para o critério de escopo).

  Mesmo padrão de persistência local já usado em Sindicatos/Convenções
  (prototype/sindicatos/js/data.js): lista inicial embutida + overlay em
  localStorage (prefixo "autopilot_prototype_"), limpo pelo FAB "Restaurar
  dados do protótipo".

  Fase 1: só a Aba Geral tinha campos funcionais (`geral`). `somaBaseCalculo`
  já existia na estrutura (array de referências a outra rubrica por código) —
  a UX completa dessa aba fica para uma fase futura.

  Fase 2: adiciona o modelo de dados da Aba Configurações (`configuracoes`),
  com os 5 grupos da especificação (seção 6).

  Fase 4: `vigencias` ganha metadados de exibição (tipoCalculo, classificacao,
  taxa) em cada item — mesmo mecanismo já documentado em
  shared/js/vigencia.js ("regimeTributario/anexo/tipoEstabelecimento são
  opcionais... metadado de exibição da linha do tempo"), sem alterar a API
  do VigenciaSelector. A rubrica 1020 ganha uma 2ª vigência (histórica) só
  para exercitar a navegação entre vigências na UI — não representa uma
  regra de negócio real de abertura de vigência (isso continua sem gatilho
  automático nesta fase; ver rubrica-detail.js).

  Fase 3: completa a estrutura de dados das 3 abas restantes.
  - `somaBaseCalculo` (já existia desde a Fase 1) ganha UX completa.
  - `rescisao` (seção 8 da especificação): os 3 grupos (Emitir no Termo de
    Rescisão, Homolognet, Saldo de salário de rescisão). Os campos "Rubrica"
    dos grupos Homolognet e Saldo de salário referenciam outra rubrica
    cadastrada (mesmo conceito de `somaBaseCalculo`), então usam o mesmo
    formato `{ codigoRubrica }` implícito (armazenado como string de código).
  - `esocial` (seção 9 da especificação): Natureza da rubrica, Incidências
    (IRRF/INSS/FGTS/PIS) e eSocial Doméstico. NENHUM catálogo oficial da
    Tabela 3 do eSocial ou de códigos de incidência foi encontrado em
    nenhuma outra trilha do projeto (busca feita antes desta fase, conforme
    exigido pela tarefa) — os campos ficam como texto livre (Código +
    Descrição preenchida manualmente), sem select/combobox e sem validação
    contra tabela oficial. Ver relatório desta fase para o detalhamento da
    busca.
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

  const RUBRICAS_KEY = "autopilot_prototype_rubricas_v1";

  // Estrutura-base da Aba Configurações (Fase 2, seção 6 da especificação) —
  // compartilhada entre os mocks e blankRubrica() para não repetir os 5
  // grupos por extenso em cada registro. "Sobre" (grupo Médias) reaproveita
  // o mesmo catálogo de Base de cálculo da Aba Geral (O.baseCalculo) — a
  // especificação não define um catálogo próprio para essa referência, só
  // descreve "base selecionável"; reaproveitar evita inventar uma lista nova
  // sem fonte.
  function blankConfiguracoes() {
    return {
      adicional: { avisoPrevio: false, decimoTerceiroFerias: false, licencaPremio: false, afastamentos: false },
      medias: { avisoPrevio: false, decimoTerceiro: false, ferias: false, licencaPremio: false, afastamentos: false, saldoSalario: false, corrigeMedia: false, sobre: "" },
      relatorios: { fichaFinanceira: false, dirfComprovante: false, rais: false },
      lancamentosFixos: { calcularFerias: false, calcular13: false },
      opcoes: {
        componeHorasMes: false,
        refleteDSR: false,
        descontaDSR: false,
        calculaDuranteAfastamento: false,
        componeLiquido: false,
        apareceRelatorios: false,
        apareceRecibos: false,
        componeAdiantamentoSalarial: false,
        detalharLancamentosPorServico: false,
        calculaDiferencaPiso: false,
        calculaDiferencaRubrica: false,
        pagaProporcional: false,
        naoConsiderarFaltasFerias: false,
        naoConsiderarFaltasRescisao: false,
        naoConsiderarFaltasAfastamento: false,
        naoConsiderarFaltasOutras: false,
      },
    };
  }

  // Estrutura-base da Aba Rescisão (Fase 3, seção 8 da especificação).
  function blankRescisao() {
    return {
      emitirTermoRescisao: false,
      campo: "",
      campo23: false,
      // "mesAnteriorEProjecao" | "somenteMesAnterior" | "somenteProjecao"
      campo23Opcao: "",
      gerarHomolognet: false,
      homolognetRubricaCodigo: "",
      homolognetCodigoExterno: "",
      gerarSaldoSalarioRescisao: false,
      saldoSalarioRubricaCodigo: "",
    };
  }

  // Estrutura-base da Aba e-Social (Fase 3, seção 9 da especificação). Sem
  // catálogo oficial disponível no projeto (Tabela 3 do eSocial, códigos de
  // incidência IRRF/INSS/FGTS/PIS) — todos os campos de código/descrição
  // ficam como texto livre nesta fase (ver nota no topo do arquivo).
  function blankEsocial() {
    return {
      natureza: { codigo: "", descricao: "" },
      incidencias: {
        irrf: { codigo: "", descricao: "" },
        inss: { codigo: "", descricao: "" },
        fgts: { codigo: "", descricao: "" },
        pis: { codigo: "", descricao: "" },
      },
      domestico: { ativo: false, codigo: "" },
    };
  }

  // Código eSocial/Natureza (Tabela 3) não têm fonte oficial disponível no
  // projeto (ver diagnóstico desta tarefa) — os valores abaixo são fictícios,
  // só para exercitar os campos, nunca uma referência real da Tabela 3 do
  // eSocial.
  const RUBRICAS_INICIAL = [
    {
      codigo: "1000",
      codigoEsocial: "1000",
      nome: "Salário Base",
      dataInicio: "01/01/2024",
      situacao: "Ativo",
      dataFim: null,
      geral: { tipoRubrica: "provento", tipoCalculo: "lancado", unidade: "valor", baseCalculo: "", classificacao: "salario", taxa: "" },
      configuracoes: {
        adicional: { avisoPrevio: false, decimoTerceiroFerias: false, licencaPremio: false, afastamentos: false },
        medias: { avisoPrevio: false, decimoTerceiro: false, ferias: false, licencaPremio: false, afastamentos: false, saldoSalario: false, corrigeMedia: false, sobre: "" },
        relatorios: { fichaFinanceira: true, dirfComprovante: true, rais: true },
        lancamentosFixos: { calcularFerias: false, calcular13: false },
        opcoes: {
          componeHorasMes: false, refleteDSR: false, descontaDSR: false, calculaDuranteAfastamento: false,
          componeLiquido: true, apareceRelatorios: true, apareceRecibos: true, componeAdiantamentoSalarial: true,
          detalharLancamentosPorServico: false, calculaDiferencaPiso: false, calculaDiferencaRubrica: false,
          pagaProporcional: false, naoConsiderarFaltasFerias: false, naoConsiderarFaltasRescisao: false,
          naoConsiderarFaltasAfastamento: false, naoConsiderarFaltasOutras: false,
        },
      },
      somaBaseCalculo: [],
      rescisao: {
        emitirTermoRescisao: true,
        campo: "Campo 1 (exemplo)",
        campo23: true,
        campo23Opcao: "mesAnteriorEProjecao",
        gerarHomolognet: false,
        homolognetRubricaCodigo: "",
        homolognetCodigoExterno: "",
        gerarSaldoSalarioRescisao: false,
        saldoSalarioRubricaCodigo: "",
      },
      // Valores fictícios de exemplo — não representam código/descrição
      // oficiais da Tabela 3 do eSocial nem de tabelas de incidência (não há
      // catálogo oficial disponível no projeto; ver nota no topo do arquivo).
      esocial: {
        natureza: { codigo: "9001", descricao: "Natureza de exemplo (sem catálogo oficial)" },
        incidencias: {
          irrf: { codigo: "1", descricao: "Código de exemplo (sem catálogo oficial)" },
          inss: { codigo: "11", descricao: "Código de exemplo (sem catálogo oficial)" },
          fgts: { codigo: "11", descricao: "Código de exemplo (sem catálogo oficial)" },
          pis: { codigo: "00", descricao: "Código de exemplo (sem catálogo oficial)" },
        },
        domestico: { ativo: false, codigo: "" },
      },
      vigencias: [{ id: "rub-1000-v1", dataInicio: "01/01/2024", dataFim: null, tipoCalculo: "lancado", classificacao: "salario", taxa: "" }],
    },
    {
      codigo: "1010",
      codigoEsocial: "1010",
      nome: "Hora Extra 50%",
      dataInicio: "01/01/2024",
      situacao: "Ativo",
      dataFim: null,
      geral: { tipoRubrica: "provento", tipoCalculo: "automatico", unidade: "horas", baseCalculo: "salario-base", classificacao: "hora-extra", taxa: "50" },
      configuracoes: {
        adicional: { avisoPrevio: false, decimoTerceiroFerias: true, licencaPremio: false, afastamentos: false },
        medias: { avisoPrevio: false, decimoTerceiro: true, ferias: true, licencaPremio: false, afastamentos: false, saldoSalario: false, corrigeMedia: true, sobre: "salario-base" },
        relatorios: { fichaFinanceira: true, dirfComprovante: true, rais: false },
        lancamentosFixos: { calcularFerias: false, calcular13: false },
        opcoes: {
          componeHorasMes: true, refleteDSR: true, descontaDSR: false, calculaDuranteAfastamento: false,
          componeLiquido: true, apareceRelatorios: true, apareceRecibos: true, componeAdiantamentoSalarial: false,
          detalharLancamentosPorServico: false, calculaDiferencaPiso: false, calculaDiferencaRubrica: false,
          pagaProporcional: true, naoConsiderarFaltasFerias: true, naoConsiderarFaltasRescisao: false,
          naoConsiderarFaltasAfastamento: true, naoConsiderarFaltasOutras: false,
        },
      },
      somaBaseCalculo: [],
      rescisao: blankRescisao(),
      esocial: blankEsocial(),
      vigencias: [{ id: "rub-1010-v1", dataInicio: "01/01/2024", dataFim: null, tipoCalculo: "automatico", classificacao: "hora-extra", taxa: "50" }],
    },
    {
      codigo: "1020",
      codigoEsocial: "1020",
      nome: "Adicional Noturno",
      dataInicio: "01/03/2024",
      situacao: "Ativo",
      dataFim: null,
      // Exercita "Soma na Base de Cálculo" referenciando outra rubrica do
      // mock (1000) — só o dado; a UX desta aba é de fase futura.
      geral: { tipoRubrica: "provento", tipoCalculo: "automatico", unidade: "percentual", baseCalculo: "salario-base", classificacao: "adicional", taxa: "20" },
      configuracoes: {
        adicional: { avisoPrevio: false, decimoTerceiroFerias: false, licencaPremio: false, afastamentos: false },
        medias: { avisoPrevio: true, decimoTerceiro: false, ferias: false, licencaPremio: false, afastamentos: false, saldoSalario: false, corrigeMedia: false, sobre: "salario-base" },
        relatorios: { fichaFinanceira: true, dirfComprovante: false, rais: false },
        lancamentosFixos: { calcularFerias: false, calcular13: false },
        opcoes: {
          componeHorasMes: false, refleteDSR: false, descontaDSR: false, calculaDuranteAfastamento: false,
          componeLiquido: true, apareceRelatorios: true, apareceRecibos: true, componeAdiantamentoSalarial: false,
          detalharLancamentosPorServico: false, calculaDiferencaPiso: false, calculaDiferencaRubrica: false,
          pagaProporcional: false, naoConsiderarFaltasFerias: false, naoConsiderarFaltasRescisao: false,
          naoConsiderarFaltasAfastamento: false, naoConsiderarFaltasOutras: false,
        },
      },
      somaBaseCalculo: [{ codigoRubrica: "1000" }],
      rescisao: {
        emitirTermoRescisao: false,
        campo: "",
        campo23: false,
        campo23Opcao: "",
        gerarHomolognet: true,
        homolognetRubricaCodigo: "1000",
        homolognetCodigoExterno: "EXT-1020",
        gerarSaldoSalarioRescisao: false,
        saldoSalarioRubricaCodigo: "",
      },
      esocial: {
        natureza: { codigo: "9002", descricao: "Natureza de exemplo (sem catálogo oficial)" },
        incidencias: {
          irrf: { codigo: "1", descricao: "Código de exemplo (sem catálogo oficial)" },
          inss: { codigo: "00", descricao: "Código de exemplo (sem catálogo oficial)" },
          fgts: { codigo: "00", descricao: "Código de exemplo (sem catálogo oficial)" },
          pis: { codigo: "00", descricao: "Código de exemplo (sem catálogo oficial)" },
        },
        domestico: { ativo: false, codigo: "" },
      },
      // 2 vigências (mock) só para exercitar a navegação entre vigências na
      // UI (VigenciaSelector) — a taxa do adicional passou de 15% para 20% a
      // partir de 01/03/2024. Nenhum gatilho real criou esta 2ª vigência
      // automaticamente (ver nota no topo do arquivo e o relatório desta
      // fase); é só dado de demonstração, ordenado da mais recente para a
      // mais antiga (vigencias[0] = atual), conforme exigido por
      // VigenciaSelector.
      vigencias: [
        { id: "rub-1020-v2", dataInicio: "01/03/2024", dataFim: null, tipoCalculo: "automatico", classificacao: "adicional", taxa: "20" },
        { id: "rub-1020-v1", dataInicio: "01/06/2023", dataFim: "29/02/2024", tipoCalculo: "automatico", classificacao: "adicional", taxa: "15" },
      ],
    },
    {
      codigo: "9010",
      codigoEsocial: "9010",
      nome: "Desconto Vale Transporte",
      dataInicio: "01/01/2024",
      situacao: "Ativo",
      dataFim: null,
      geral: { tipoRubrica: "desconto", tipoCalculo: "automatico", unidade: "percentual", baseCalculo: "salario-base", classificacao: "desconto-legal", taxa: "6" },
      configuracoes: {
        adicional: { avisoPrevio: false, decimoTerceiroFerias: false, licencaPremio: false, afastamentos: false },
        medias: { avisoPrevio: false, decimoTerceiro: false, ferias: false, licencaPremio: false, afastamentos: false, saldoSalario: false, corrigeMedia: false, sobre: "" },
        relatorios: { fichaFinanceira: true, dirfComprovante: false, rais: false },
        lancamentosFixos: { calcularFerias: false, calcular13: false },
        opcoes: {
          componeHorasMes: false, refleteDSR: false, descontaDSR: false, calculaDuranteAfastamento: false,
          componeLiquido: true, apareceRelatorios: true, apareceRecibos: true, componeAdiantamentoSalarial: false,
          detalharLancamentosPorServico: false, calculaDiferencaPiso: false, calculaDiferencaRubrica: false,
          pagaProporcional: false, naoConsiderarFaltasFerias: false, naoConsiderarFaltasRescisao: false,
          naoConsiderarFaltasAfastamento: false, naoConsiderarFaltasOutras: false,
        },
      },
      somaBaseCalculo: [],
      rescisao: {
        emitirTermoRescisao: false,
        campo: "",
        campo23: false,
        campo23Opcao: "",
        gerarHomolognet: false,
        homolognetRubricaCodigo: "",
        homolognetCodigoExterno: "",
        gerarSaldoSalarioRescisao: true,
        saldoSalarioRubricaCodigo: "1000",
      },
      esocial: blankEsocial(),
      vigencias: [{ id: "rub-9010-v1", dataInicio: "01/01/2024", dataFim: null, tipoCalculo: "automatico", classificacao: "desconto-legal", taxa: "6" }],
    },
    {
      codigo: "9020",
      codigoEsocial: "9020",
      nome: "Desconto Convênio Farmácia",
      dataInicio: "01/06/2023",
      situacao: "Inativo",
      dataFim: "31/12/2025",
      geral: { tipoRubrica: "desconto", tipoCalculo: "lancado", unidade: "valor", baseCalculo: "", classificacao: "desconto-convenio", taxa: "" },
      // Todos os grupos zerados — exercita o estado "nada configurado" (mesmo
      // critério já usado em mocks de Folha de Pagamento sem configuração).
      configuracoes: blankConfiguracoes(),
      somaBaseCalculo: [],
      rescisao: blankRescisao(),
      esocial: blankEsocial(),
      vigencias: [{ id: "rub-9020-v1", dataInicio: "01/06/2023", dataFim: null, tipoCalculo: "lancado", classificacao: "desconto-convenio", taxa: "" }],
    },
    {
      codigo: "5000",
      codigoEsocial: "5000",
      nome: "Base de Cálculo INSS (Informativo)",
      dataInicio: "01/01/2024",
      situacao: "Ativo",
      dataFim: null,
      geral: { tipoRubrica: "informativo", tipoCalculo: "automatico", unidade: "valor", baseCalculo: "nenhuma", classificacao: "outra", taxa: "" },
      configuracoes: {
        adicional: { avisoPrevio: false, decimoTerceiroFerias: false, licencaPremio: false, afastamentos: false },
        medias: { avisoPrevio: false, decimoTerceiro: false, ferias: false, licencaPremio: false, afastamentos: false, saldoSalario: false, corrigeMedia: false, sobre: "" },
        relatorios: { fichaFinanceira: false, dirfComprovante: false, rais: false },
        lancamentosFixos: { calcularFerias: false, calcular13: false },
        opcoes: {
          componeHorasMes: false, refleteDSR: false, descontaDSR: false, calculaDuranteAfastamento: false,
          componeLiquido: false, apareceRelatorios: true, apareceRecibos: false, componeAdiantamentoSalarial: false,
          detalharLancamentosPorServico: false, calculaDiferencaPiso: false, calculaDiferencaRubrica: false,
          pagaProporcional: false, naoConsiderarFaltasFerias: false, naoConsiderarFaltasRescisao: false,
          naoConsiderarFaltasAfastamento: false, naoConsiderarFaltasOutras: false,
        },
      },
      somaBaseCalculo: [{ codigoRubrica: "1000" }, { codigoRubrica: "1010" }],
      rescisao: blankRescisao(),
      esocial: {
        natureza: { codigo: "", descricao: "" },
        incidencias: {
          irrf: { codigo: "", descricao: "" },
          inss: { codigo: "", descricao: "" },
          fgts: { codigo: "", descricao: "" },
          pis: { codigo: "", descricao: "" },
        },
        domestico: { ativo: true, codigo: "DOM-5000" },
      },
      vigencias: [{ id: "rub-5000-v1", dataInicio: "01/01/2024", dataFim: null, tipoCalculo: "automatico", classificacao: "outra", taxa: "" }],
    },
  ];

  function getRubricas() { return loadStore(RUBRICAS_KEY, RUBRICAS_INICIAL); }
  function setRubricas(lista) { saveStore(RUBRICAS_KEY, lista); }
  function findRubricaByCodigo(codigo) { return getRubricas().find((r) => r.codigo === codigo); }
  function codigoDuplicado(codigo, codigoAtual) {
    if (!codigo) return false;
    return getRubricas().some((r) => r.codigo === codigo && r.codigo !== codigoAtual);
  }

  function blankRubrica() {
    return {
      codigo: "",
      codigoEsocial: "",
      nome: "",
      dataInicio: "",
      situacao: "Ativo",
      dataFim: null,
      geral: { tipoRubrica: "", tipoCalculo: "", unidade: "", baseCalculo: "", classificacao: "", taxa: "" },
      configuracoes: blankConfiguracoes(),
      somaBaseCalculo: [],
      rescisao: blankRescisao(),
      esocial: blankEsocial(),
      vigencias: [],
    };
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  // ===== Catálogos de opções =====
  // "Base de cálculo" e "Classificação" reproduzem literalmente os exemplos
  // citados na própria especificação (seção 5) — não são um catálogo oficial
  // fechado (não existe fonte para isso no projeto), só as opções que a
  // especificação já enumera como exemplo.
  const O = {
    tipoRubrica: [
      { value: "provento", label: "Provento" },
      { value: "desconto", label: "Desconto" },
      { value: "informativo", label: "Informativo" },
    ],
    tipoCalculo: [
      { value: "lancado", label: "Lançado" },
      { value: "formula", label: "Fórmula" },
      { value: "automatico", label: "Automático" },
    ],
    unidade: [
      { value: "horas", label: "Horas" },
      { value: "dias", label: "Dias" },
      { value: "valor", label: "Valor" },
      { value: "percentual", label: "Percentual" },
      { value: "quantidade", label: "Quantidade" },
    ],
    baseCalculo: [
      { value: "nenhuma", label: "Nenhuma" },
      { value: "salario-base", label: "Salário-base" },
      { value: "salario-minimo", label: "Salário-mínimo" },
    ],
    classificacao: [
      { value: "salario", label: "Salário" },
      { value: "hora-extra", label: "Hora extra" },
      { value: "adicional", label: "Adicional" },
      { value: "beneficio", label: "Benefício" },
      { value: "desconto-legal", label: "Desconto legal" },
      { value: "desconto-convenio", label: "Desconto de convênio" },
      { value: "outra", label: "Outra" },
    ],
    situacao: [
      { value: "Ativo", label: "Ativo" },
      { value: "Inativo", label: "Inativo" },
    ],
  };

  global.RubricasData = {
    RUBRICAS_INICIAL,
    getRubricas, setRubricas, findRubricaByCodigo, codigoDuplicado,
    blankRubrica, getQueryParam,
    O,
  };
})(window);
