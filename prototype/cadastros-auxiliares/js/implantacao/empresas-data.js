/*
  Mock do console de Implantação DP por empresa — a superfície visual dos
  Épicos 1 a 5 do épico-pai CTB-263/CTB-269 (Linear):
  - Épico 1 (CTB-263) — Dados do Colaborador (carga + Ficha Financeira)
  - Épico 2 (CTB-264) — Dados Financeiros (relatórios de folha, histórico)
  - Épico 3 (CTB-265) — Rubricas: SEM de-para (alinhamento Andressa/Jeniffer,
    10/09/2026) — o Autopilot não faz mais de-para manual de rubrica; a aba
    só mostra, de forma informativa, o que a empresa usou nos últimos 12
    meses (código, descrição, se é rubrica padrão, natureza e incidências).
    Por isso NÃO entra mais na conta de % de conclusão — são só 3 frentes
    que bloqueiam agora: colaboradores, histórico de folha e cálculo em
    paralelo ("são 3 grandes etapas", Andressa).
  - Épico 4 (CTB-267) — Cálculo em Paralelo: roda DEPOIS que colaboradores e
    histórico já foram carregados — aciona o motor para recalcular a folha
    dos últimos 12 meses com as regras atuais e concilia contra os
    relatórios da Domínio já importados. Não gera pacote de relatório
    nenhum ("ele não devolve nenhum pacote pra gente", Jeniffer) — só diz se
    bateu ou não, e se não bateu, aponta campo + colaborador + rubrica que
    divergiu (mesma lógica da conciliação de colaborador contra o Lake).
  - Épico 5 (CTB-268) — Transversais: observabilidade, SLA e auditoria
    (aba Histórico/Log — RT-DP-02: cada etapa registra executor, timestamp
    e desfecho)
  Épico 6 (CTB-269) é este próprio console — amarra os 5 acima por empresa.

  `empresaCodigo` referencia EmpresasData.EMPRESAS (mesmas 3 empresas do
  resto do protótipo).
*/
(function (global) {
  const EMPRESAS_IMPLANTACAO = [
    {
      empresaCodigo: "MS-0027",
      status: "em_andamento",
      etapaAtual: "Dados do Colaborador — conciliação com o Lake",
      dataInicio: "05/08/2026",
      competenciaInicial: "09/2026",
      resumo: {
        financeiro: { carregadas: 7, necessarias: 12 },
        rubricas: { total: 14 },
        calculoParalelo: { validadas: 4, comDivergencia: 1, total: 7 },
      },
      logs: [
        { dataHora: "05/08/2026 09:12", operador: "Andressa Teles Rodrigues", acao: "Iniciou implantação", detalhe: "Contrato assinado, card de DP criado no Pipefy.", aprovadoPor: null },
        { dataHora: "06/08/2026 11:40", operador: "Luiz Felipe Mendonça Silva", acao: "Outorgou procurações", detalhe: "e-CAC, FGTS Digital, Conectividade Social.", aprovadoPor: null },
        { dataHora: "12/08/2026 14:32", operador: "Luiz Felipe Mendonça Silva", acao: "Importou lote de Ficha Financeira", detalhe: "Ficha_Financeira_Metalurgica_Sigma.pdf — 18 colaboradores processados.", aprovadoPor: null },
        { dataHora: "13/08/2026 10:05", operador: "Luiz Felipe Mendonça Silva", acao: "Resolveu divergência", detalhe: "Daniel Marques Porfiro — campo Salário, valor da Ficha Financeira mantido.", aprovadoPor: null },
        { dataHora: "18/08/2026 16:20", operador: "Sistema", acao: "Identificou rubricas utilizadas", detalhe: "14 rubricas identificadas nos últimos 12 meses, com natureza e incidências.", aprovadoPor: null },
        { dataHora: "20/08/2026 08:50", operador: "Sistema", acao: "Carregou competência de histórico", detalhe: "Competência 07/2026 — extrato, folha completa e resumo gravados.", aprovadoPor: null },
      ],
    },
    {
      empresaCodigo: "CH-0042",
      status: "em_andamento",
      etapaAtual: "Dados Financeiros — histórico de folha",
      dataInicio: "10/08/2026",
      competenciaInicial: "09/2026",
      resumo: {
        financeiro: { carregadas: 4, necessarias: 12 },
        rubricas: { total: 9 },
        calculoParalelo: { validadas: 0, comDivergencia: 0, total: 4 },
      },
      logs: [
        { dataHora: "10/08/2026 09:00", operador: "Andressa Teles Rodrigues", acao: "Iniciou implantação", detalhe: "Contrato assinado, card de DP criado no Pipefy.", aprovadoPor: null },
        { dataHora: "14/08/2026 15:10", operador: "Luiz Felipe Mendonça Silva", acao: "Importou lote de Ficha Financeira", detalhe: "Ficha_Financeira_Comercio_Horizonte.pdf — 9 colaboradores processados.", aprovadoPor: null },
        { dataHora: "21/08/2026 10:30", operador: "Sistema", acao: "Carregou competência de histórico", detalhe: "Competência 04/2026 — extrato e folha completa gravados, com divergência de total contra o relatório de origem.", aprovadoPor: null },
      ],
    },
    {
      empresaCodigo: "PA-0011",
      status: "implantada",
      etapaAtual: "Concluída — em operação",
      dataInicio: "15/03/2026",
      competenciaInicial: "05/2026",
      dataConclusao: "28/04/2026",
      resumo: {
        financeiro: { carregadas: 12, necessarias: 12 },
        rubricas: { total: 7 },
        calculoParalelo: { validadas: 12, comDivergencia: 0, total: 12 },
      },
      logs: [
        { dataHora: "15/03/2026 09:00", operador: "Andressa Teles Rodrigues", acao: "Iniciou implantação", detalhe: "Contrato assinado, card de DP criado no Pipefy.", aprovadoPor: null },
        { dataHora: "22/03/2026 11:15", operador: "Luiz Felipe Mendonça Silva", acao: "Importou lote de Ficha Financeira", detalhe: "6 colaboradores processados, sem divergência.", aprovadoPor: null },
        { dataHora: "02/04/2026 14:00", operador: "Sistema", acao: "Carregou histórico completo", detalhe: "12 competências — dezembro/2025 a novembro/2026 fechadas.", aprovadoPor: null },
        { dataHora: "20/04/2026 16:45", operador: "Luiz Felipe Mendonça Silva", acao: "Executou cálculo em paralelo", detalhe: "12 competências calculadas — nenhuma divergência contra o Domínio.", aprovadoPor: null },
        { dataHora: "28/04/2026 10:00", operador: "Andressa Teles Rodrigues", acao: "Concluiu implantação", detalhe: "Passagem de bastão para a operação — status Em Operação no Cockpit.", aprovadoPor: "Jeniffer Dauricio" },
      ],
    },
  ];

  // Épico 2 — competências de histórico de folha, janela dezembro/2025 até a
  // última fechada (RF-DP-509 reporta as ausentes, nunca estima).
  const COMPETENCIAS_JANELA = ["12/2025", "01/2026", "02/2026", "03/2026", "04/2026", "05/2026", "06/2026", "07/2026", "08/2026"];

  function gerarFinanceiro(empresaCodigo, qtdCarregadas) {
    return COMPETENCIAS_JANELA.map((competencia, i) => {
      if (i >= qtdCarregadas) return { competencia, status: "ausente" };
      // Exemplos de divergência de total (RF-DP-507) — o valor gravado não
      // bate com o total do relatório de origem, sempre falha, nunca aviso.
      const divergente = (i === 2 && empresaCodigo === "MS-0027") || (i === 1 && empresaCodigo === "CH-0042");
      return {
        competencia,
        status: divergente ? "divergencia_total" : "carregada",
        proventos: "R$ " + (38000 + i * 900).toLocaleString("pt-BR") + ",00",
        descontos: "R$ " + (9200 + i * 150).toLocaleString("pt-BR") + ",00",
        liquido: "R$ " + (28800 + i * 750).toLocaleString("pt-BR") + ",00",
        totalOrigem: divergente ? "R$ " + (28800 + i * 750 + 120).toLocaleString("pt-BR") + ",00" : null,
      };
    });
  }

  // Épico 3 — rubricas usadas pela empresa nos últimos 12 meses. SEM
  // de-para (alinhamento 10/09/2026): puramente informativo — natureza
  // (Provento/Desconto) e incidências vêm prontas do Lake, sem ação do
  // operador aqui. `rubricaPadrao` indica se é uma rubrica padrão do
  // Autopilot ou específica desta empresa — nenhum dos dois casos bloqueia
  // nada.
  const RUBRICAS_POOL = [
    { codigoEmpresa: "0001", descricao: "Salário Base", rubricaPadrao: "1 — Salário Base", natureza: "Provento", incIrrf: true, incInss: true, incFgts: true, incPis: true },
    { codigoEmpresa: "0100", descricao: "Hora Extra 50%", rubricaPadrao: "100 — Hora Extra 50%", natureza: "Provento", incIrrf: true, incInss: true, incFgts: true, incPis: true },
    { codigoEmpresa: "0150", descricao: "DSR sobre Extras", rubricaPadrao: "150 — DSR sobre Variáveis", natureza: "Provento", incIrrf: true, incInss: true, incFgts: true, incPis: true },
    { codigoEmpresa: "0200", descricao: "Vale Transporte", rubricaPadrao: "200 — Vale Transporte (desconto)", natureza: "Desconto", incIrrf: false, incInss: false, incFgts: false, incPis: false },
    { codigoEmpresa: "0250", descricao: "INSS", rubricaPadrao: "250 — INSS Empregado", natureza: "Desconto", incIrrf: false, incInss: false, incFgts: false, incPis: false },
    { codigoEmpresa: "0300", descricao: "IRRF", rubricaPadrao: "300 — IRRF", natureza: "Desconto", incIrrf: false, incInss: false, incFgts: false, incPis: false },
    { codigoEmpresa: "9361", descricao: "Prêmio Assiduidade", rubricaPadrao: "361 — Prêmio Assiduidade", natureza: "Provento", incIrrf: true, incInss: true, incFgts: true, incPis: true },
    { codigoEmpresa: "9400", descricao: "Adicional Noturno", rubricaPadrao: null, natureza: "Provento", incIrrf: true, incInss: true, incFgts: true, incPis: true },
    { codigoEmpresa: "9450", descricao: "Comissão", rubricaPadrao: null, natureza: "Provento", incIrrf: true, incInss: true, incFgts: true, incPis: true },
  ];
  function gerarRubricas() {
    return RUBRICAS_POOL;
  }

  // Épico 4 — cálculo em paralelo: roda por último, DEPOIS de colaboradores
  // e histórico carregados. Recalcula a folha com as regras atuais do motor
  // e concilia contra os relatórios da Domínio já importados — não gera
  // pacote de relatório (Jeniffer, 10/09/2026); só aponta campo +
  // colaborador + rubrica quando não bate.
  const DIVERGENCIAS_POOL = [
    { colaborador: "Renata Cristina Dias", rubrica: "0250 — INSS", campo: "Base de cálculo do INSS", valorMotor: "R$ 2.980,00", valorOrigem: "R$ 3.100,00" },
    { colaborador: "Camila Ferreira Duarte", rubrica: "0100 — Hora Extra 50%", campo: "Valor calculado", valorMotor: "R$ 412,30", valorOrigem: "R$ 389,90" },
  ];
  function gerarCalculoParalelo(qtdValidadas, qtdDivergencia, financeiro) {
    return financeiro
      .filter((f) => f.status !== "ausente")
      .map((f, i) => {
        const executado = i < qtdValidadas + qtdDivergencia;
        const comDivergencia = executado && i >= qtdValidadas;
        return {
          competencia: f.competencia,
          status: !executado ? "nao_executado" : comDivergencia ? "com_divergencia" : "sem_divergencia",
          executor: executado ? "Luiz Felipe Mendonça Silva" : null,
          dataExecucao: executado ? "2" + (i + 10) + "/08/2026" : null,
          divergencias: comDivergencia ? DIVERGENCIAS_POOL : [],
        };
      });
  }

  function empresaImplantacao(codigo) {
    return EMPRESAS_IMPLANTACAO.find((e) => e.empresaCodigo === codigo);
  }

  function contarPorStatusEmpresa(lista) {
    return {
      total: lista.length,
      emAndamento: lista.filter((e) => e.status === "em_andamento").length,
      implantada: lista.filter((e) => e.status === "implantada").length,
    };
  }

  // Calculado a partir do ImplantacaoData de verdade (js/implantacao/data.js)
  // — nunca um número fixo aqui. Um resumo escrito à mão dessincroniza toda
  // vez que um colaborador muda de status ou de empresa (foi exatamente
  // isso que deixou uma empresa "Implantada" com colaborador em
  // divergência/aguardando eSocial). getColaboradoresAtivos() já exclui
  // desligados, então "total" aqui é sempre a fila ativa de verdade.
  function resumoColaboradores(empresaCodigo) {
    const CD = global.ImplantacaoData;
    if (!CD) return { prontos: 0, total: 0 };
    const lista = CD.getColaboradoresAtivos().filter((c) => c.empresaCodigo === empresaCodigo);
    return { prontos: lista.filter((c) => c.status === "pronto").length, total: lista.length };
  }

  // Junta o resumo estático (financeiro/rubricas/cálculo — não modelados no
  // ImplantacaoData) com o de colaboradores, sempre recalculado. Use esta
  // função em vez de ler `empresaImplant.resumo` direto.
  function resumoCompleto(empresaImplant) {
    return Object.assign({}, empresaImplant.resumo, { colaboradores: resumoColaboradores(empresaImplant.empresaCodigo) });
  }

  // % de conclusão = média das 3 frentes que bloqueiam a implantação
  // (cada uma 0-1) — "colaboradores, subir as folhas e fazer a validação
  // dos cálculos" (Andressa, 10/09/2026). Rubricas não é mais frente:
  // virou aba informativa, sem de-para para resolver. Ignora frente sem
  // nada a fazer (total 0 conta como concluída, não como zero).
  function fracaoFrente(feito, total) {
    return total === 0 ? 1 : feito / total;
  }

  // 24/09/2026 (Andressa, validação Parte 3): parâmetros DP passou a
  // contar como a 4ª frente do percentual, não só um gate à parte —
  // "tem que incluir o parâmetro também" pra considerar 100%.
  // empresaCodigo é opcional pra não quebrar chamadas antigas que ainda
  // não repassam o código (nesse caso mantém as 3 frentes de antes).
  function percentualConclusao(r, empresaCodigo) {
    const fracoes = [
      fracaoFrente(r.colaboradores.prontos, r.colaboradores.total),
      fracaoFrente(r.financeiro.carregadas, r.financeiro.necessarias),
      fracaoFrente(r.calculoParalelo.validadas, r.calculoParalelo.total),
    ];
    if (empresaCodigo) fracoes.push(parametrosConfirmados(empresaCodigo) ? 1 : 0);
    const media = fracoes.reduce((a, b) => a + b, 0) / fracoes.length;
    return Math.round(media * 100);
  }

  // ===== Parâmetros DP (alinhamento Andressa/Jeniffer, 10/09/2026) =====
  // "Passou por todos os steps de implantação, tem a aba de parâmetro. A
  // pessoa obrigatoriamente vai ter que clicar em parâmetro e analisar" —
  // não entra na conta de percentualConclusao (que fica só nas 3 frentes já
  // confirmadas), mas é um requisito à parte pra empresa poder ser
  // considerada implantada de fato: os campos obrigatórios (sindicato,
  // regime, FAP etc.) precisam estar preenchidos na aba de Parâmetros DP, e
  // o operador precisa confirmar manualmente ("ele garantiu que tá tudo
  // configurado, que aí fica o log registrado" — Andressa).
  const CAMPOS_PARAMETROS_DP = {
    "MS-0027": ["FAP", "Percentual de adiantamento"],
    "CH-0042": ["Sindicato vinculado", "Arredondamento"],
    "PA-0011": [],
  };
  const TODOS_CAMPOS_PARAMETROS_DP = ["Sindicato vinculado", "Regime de tributação", "FAP", "Percentual de adiantamento", "Arredondamento"];

  function camposPendentesParametros(empresaCodigo) {
    return CAMPOS_PARAMETROS_DP[empresaCodigo] || [];
  }

  const PARAMETROS_CONFIRMADOS_KEY = "autopilot_prototype_implantacao_parametros_confirmados_v1";
  function loadParametrosConfirmados() {
    try {
      const raw = window.localStorage.getItem(PARAMETROS_CONFIRMADOS_KEY);
      return raw ? JSON.parse(raw) : { "PA-0011": true };
    } catch (e) {
      return { "PA-0011": true };
    }
  }
  function parametrosConfirmados(empresaCodigo) {
    return !!loadParametrosConfirmados()[empresaCodigo];
  }
  function confirmarParametros(empresaCodigo) {
    const atual = loadParametrosConfirmados();
    atual[empresaCodigo] = true;
    try {
      window.localStorage.setItem(PARAMETROS_CONFIRMADOS_KEY, JSON.stringify(atual));
    } catch (e) {
      /* localStorage indisponível — confirmação vale só nesta renderização */
    }
  }

  // ===== Relatórios personalizados (layouts) — alinhamento Andressa/
  // Jeniffer, 10/09/2026: "pode ser separado, pode ser numa aba separada...
  // não necessariamente são esses relatórios que ele subiu" na Ficha
  // Financeira. Aba própria, por tipo de relatório usado no processo de DP
  // (admissão, férias, rescisão), dizendo se a empresa usa o layout padrão
  // da Domínio ou um personalizado — e, se personalizado, o arquivo do
  // layout importado. "Isso ficar depois dentro da tela de parâmetros DP...
  // a gente tem lá admissão é esse relatório, férias é esse relatório" —
  // por ora só existe aqui, na implantação (Parâmetros DP é da Elaine e
  // segue "em breve").
  const TIPOS_RELATORIO = ["Admissão", "Férias", "Rescisão"];

  const RELATORIOS_LAYOUT_SEED = {
    "MS-0027": { Admissão: { arquivo: "Contrato_Admissao_MetalurgicaSigma.pdf", importadoEm: "12/08/2026" } },
    "PA-0011": {
      Admissão: { arquivo: "Contrato_Admissao_ComercioAurora.pdf", importadoEm: "20/03/2026" },
      Férias: { arquivo: "Recibo_Ferias_ComercioAurora.pdf", importadoEm: "20/03/2026" },
      Rescisão: { arquivo: "Termo_Rescisao_ComercioAurora.pdf", importadoEm: "20/03/2026" },
    },
  };

  const RELATORIOS_LAYOUT_KEY = "autopilot_prototype_implantacao_relatorios_layout_v1";
  function loadRelatoriosLayout() {
    try {
      const raw = window.localStorage.getItem(RELATORIOS_LAYOUT_KEY);
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(RELATORIOS_LAYOUT_SEED));
    } catch (e) {
      return JSON.parse(JSON.stringify(RELATORIOS_LAYOUT_SEED));
    }
  }
  function saveRelatoriosLayout(dados) {
    try {
      window.localStorage.setItem(RELATORIOS_LAYOUT_KEY, JSON.stringify(dados));
    } catch (e) {
      /* localStorage indisponível — mudança vale só nesta renderização */
    }
  }

  // Sem layout salvo = usa o padrão Domínio (comportamento atual, nenhuma
  // ação necessária do operador) — mesma convenção de "ausência é o
  // default" usada em parametrosConfirmados/camposPendentesParametros acima.
  function layoutsRelatorios(empresaCodigo) {
    const empresaDados = loadRelatoriosLayout()[empresaCodigo] || {};
    return TIPOS_RELATORIO.map((tipo) => {
      const l = empresaDados[tipo];
      return { tipo: tipo, personalizado: !!l, arquivo: l ? l.arquivo : null, importadoEm: l ? l.importadoEm : null };
    });
  }

  function importarLayoutRelatorio(empresaCodigo, tipo, nomeArquivo, dataImportacao) {
    const dados = loadRelatoriosLayout();
    if (!dados[empresaCodigo]) dados[empresaCodigo] = {};
    dados[empresaCodigo][tipo] = { arquivo: nomeArquivo, importadoEm: dataImportacao };
    saveRelatoriosLayout(dados);
  }

  function removerLayoutRelatorio(empresaCodigo, tipo) {
    const dados = loadRelatoriosLayout();
    if (dados[empresaCodigo]) delete dados[empresaCodigo][tipo];
    saveRelatoriosLayout(dados);
  }

  global.EmpresasImplantacaoData = {
    EMPRESAS_IMPLANTACAO,
    empresaImplantacao,
    contarPorStatusEmpresa,
    resumoColaboradores,
    resumoCompleto,
    percentualConclusao,
    gerarFinanceiro,
    gerarRubricas,
    gerarCalculoParalelo,
    TODOS_CAMPOS_PARAMETROS_DP,
    camposPendentesParametros,
    parametrosConfirmados,
    confirmarParametros,
    TIPOS_RELATORIO,
    layoutsRelatorios,
    importarLayoutRelatorio,
    removerLayoutRelatorio,
  };
})(window);
