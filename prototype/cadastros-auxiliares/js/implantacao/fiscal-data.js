/*
  Mock da Implantação Fiscal — saldos de CPP do DAS para o Fator R.
  Regras: doc CTB-533 v1.1 (Elizandra, 23/10/2026); captura SERPRO: CTB-537.

  - Elegibilidade (RN-01): Simples Nacional, vindo do Cockpit. A atividade
    sujeita ao Fator R é identificada pela Operação Fiscal, sob demanda — por
    isso toda empresa do SN pode iniciar a implantação Fiscal.
  - Janela por PERÍODO de caixa (RN-05): a CPP do DAS do PA M entra no
    período M+1, mês do vencimento. A tela nunca fala em competência nem em
    data de pagamento.
  - Precedência da CPP (RN-04): motor > SERPRO > extrato do DAS > manual.
    Uma fonte de menor prevalência não sobrescreve uma de maior, então só
    período pendente ou manual aceita digitação.
  - "Nova implantação" consulta a SERPRO (RF-201) e já traz os períodos que o
    motor calculou; o que falhar fica pendente com o motivo (RF-204). Nova
    consulta não repete PA já capturado (RF-205).
  - Folha (RN-06/RN-13): vem do DP (só leitura); "não opera DP" e "sem
    movimento" fecham o período sem folha; DP fora da BHub tem a folha
    informada à mão aqui, por período.
*/
(function (global) {
  const PA_REFERENCIA = "10/2026";
  const LIMITE_FATOR_R = 0.28;

  function anterior(mmaaaa) {
    const [m, a] = mmaaaa.split("/").map(Number);
    return m === 1 ? "12/" + (a - 1) : String(m - 1).padStart(2, "0") + "/" + a;
  }
  function antes(a, b) {
    const [ma, aa] = a.split("/").map(Number);
    const [mb, ab] = b.split("/").map(Number);
    return aa < ab || (aa === ab && ma < mb);
  }

  // 12 períodos de caixa anteriores ao PA de referência, em ordem cronológica.
  const PERIODOS = (function () {
    const lista = [];
    let p = PA_REFERENCIA;
    for (let i = 0; i < 12; i++) {
      p = anterior(p);
      lista.unshift(p);
    }
    return lista;
  })();
  // O DAS que paga cada período é o do PA do mês anterior (RN-05).
  function paDoPeriodo(periodo) {
    return anterior(periodo);
  }

  const ROTULO_ORIGEM_CPP = {
    pendente: "Pendente",
    motor: "Calculado pelo motor",
    serpro: "SERPRO",
    extrato: "Extrato do DAS",
    manual: "Manual",
    zero: "Sem CPP",
    nao_compoe: "Não compõe",
  };

  const MODO_FOLHA = {
    dp: { rotulo: "Implantada pela DP", descricao: "Folha, 13º e FGTS vêm da Implantação DP, só para leitura." },
    aguardando_dp: { rotulo: "Aguardando a Implantação DP", descricao: "A empresa opera DP na BHub, mas a Implantação DP ainda não trouxe o histórico de folha." },
    sem_movimento: { rotulo: "Sem movimento de folha", descricao: "Declarado na Implantação DP: a FS12 fica só com a CPP do DAS." },
    nao_opera: { rotulo: "Não opera DP", descricao: "Vem do Cockpit (hr_status): a Implantação DP conta como concluída e a FS12 fica só com a CPP do DAS." },
    dp_fora: { rotulo: "DP fora da BHub", descricao: "A folha (base da CPP, 13º e FGTS) é informada à mão nesta aba, por período (RN-13)." },
  };

  // Empresas fora do Simples (regime do Cockpit) não têm Fator R.
  const FORA_DO_SN = { "MS-0027": "Empresa no Lucro Presumido (Cockpit). O Fator R só existe no Simples Nacional." };

  // Dados de enquadramento usados quando a operação inicia a implantação.
  const ENQUADRAMENTO = {
    "CV-0058": { atividade: "8630-5/03 — Atividade médica ambulatorial", inicioMotor: "07/2026", inicioAtividade: "03/2014", rbt12: 1480000 },
    "EL-0073": { atividade: "7111-1/00 — Serviços de arquitetura", inicioMotor: "10/2026", inicioAtividade: "08/2019", rbt12: 920000 },
    "NC-0091": { atividade: "6204-0/00 — Consultoria em tecnologia da informação", inicioMotor: "10/2026", inicioAtividade: "02/2026", rbt12: 410000 },
    "OP-0105": { atividade: "8630-5/04 — Atividade odontológica", inicioMotor: "11/2026", inicioAtividade: "05/2017", rbt12: 760000 },
  };
  const ENQUADRAMENTO_PADRAO = { atividade: "Atividade sujeita ao Fator R (Anexo III/V) — conferida no BHules", inicioMotor: "11/2026", inicioAtividade: "01/2015", rbt12: 640000 };

  // Retorno simulado da SERPRO por empresa: PAs sem declaração ou com falha de consulta.
  const SERPRO_FALHAS = {
    "CV-0058": { "02/2026": "sem_declaracao", "04/2026": "falha" },
    "EL-0073": { "10/2025": "falha", "05/2026": "sem_declaracao" },
    "OP-0105": { "01/2026": "sem_declaracao" },
  };
  const MOTIVO_SERPRO = {
    sem_declaracao: "PA sem declaração PGDAS-D na SERPRO",
    falha: "Falha na consulta à SERPRO — reprogramada",
  };

  function semente(texto) {
    return texto.split("").reduce((s, c) => (s * 31 + c.charCodeAt(0)) % 9973, 7);
  }
  function valorCpp(codigo, i) {
    return Math.round((1800 + (semente(codigo) % 7200) + i * 37) * 100) / 100;
  }
  function numeroDeclaracao(codigo, pa) {
    return "0" + String(semente(codigo + pa) * 7919).padStart(9, "0").slice(0, 9) + "-" + pa.replace("/", "");
  }

  const STORAGE_KEY = "autopilot_prototype_implantacao_fiscal_v2";
  let store = {};

  function agora() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  const OPERADOR = "Operador BHub";

  // Monta a janela como sai da "Nova implantação": motor, SERPRO e o que ficou pendente.
  function capturar(codigo, ctx, quando, quem) {
    const enq = Object.assign({}, ENQUADRAMENTO_PADRAO, ENQUADRAMENTO[codigo] || {});
    const falhas = SERPRO_FALHAS[codigo] || {};
    const meses = PERIODOS.map((periodo, i) => {
      const pa = paDoPeriodo(periodo);
      const m = { periodo, pa, cpp: null, origemCpp: "pendente", evidencia: null, motivo: null, folha: null, origemFolha: ctx.modoFolha, evidenciaFolha: null };
      if (antes(pa, enq.inicioAtividade)) return Object.assign(m, { origemCpp: "nao_compoe", origemFolha: "nao_compoe" });
      if (ctx.modoFolha === "dp") m.folha = ctx.folhaDp(i, periodo);
      if (!antes(pa, enq.inicioMotor)) return Object.assign(m, { cpp: valorCpp(codigo, i), origemCpp: "motor" });
      if (falhas[pa]) return Object.assign(m, { motivo: falhas[pa] });
      return Object.assign(m, { cpp: valorCpp(codigo, i), origemCpp: "serpro", evidencia: "Declaração " + numeroDeclaracao(codigo, pa) });
    });
    const capturados = meses.filter((m) => m.origemCpp === "serpro").length;
    const pendentes = meses.filter((m) => m.origemCpp === "pendente").length;
    const motor = meses.filter((m) => m.origemCpp === "motor").length;
    return {
      enq,
      concluida: false,
      meses,
      logs: [
        { dataHora: quando, operador: quem, acao: "Nova implantação", detalhe: "Janela dos períodos " + PERIODOS[0] + " a " + PERIODOS[11] + " (DAS dos PAs " + paDoPeriodo(PERIODOS[0]) + " a " + paDoPeriodo(PERIODOS[11]) + ") para o PA " + PA_REFERENCIA + ".", aprovadoPor: null },
        { dataHora: quando, operador: "Sistema", acao: "Consultou a SERPRO", detalhe: capturados + " período(s) capturado(s), " + motor + " já calculado(s) pelo motor, " + pendentes + " pendente(s).", aprovadoPor: null },
      ],
    };
  }

  function seed() {
    const s = {};
    s["CV-0058"] = capturar("CV-0058", { modoFolha: "dp", folhaDp: (i, p) => (p === "01/2026" ? 2 : 1) * (24800 + i * 140) }, "16/10/2026 10:05", "Luiz Felipe Mendonça Silva");
    s["EL-0073"] = capturar("EL-0073", { modoFolha: "dp_fora" }, "20/10/2026 08:40", "Andressa Teles Rodrigues");
    const el = s["EL-0073"].meses;
    el.slice(0, 4).forEach((m, i) => Object.assign(m, { folha: 9800 + i * 60, evidenciaFolha: "Folha_EstudioLumen_" + m.periodo.replace("/", "") + ".pdf", editadoPor: "Andressa Teles Rodrigues", editadoEm: "21/10/2026 15:2" + i }));
    s["NC-0091"] = capturar("NC-0091", { modoFolha: "nao_opera" }, "13/10/2026 11:00", "Andressa Teles Rodrigues");
    const nc = s["NC-0091"];
    const zero = nc.meses.find((m) => m.periodo === "05/2026");
    Object.assign(zero, { cpp: 0, origemCpp: "zero", evidencia: "DAS do PA 04/2026 zerado (sem faturamento)", editadoPor: "Andressa Teles Rodrigues", editadoEm: "14/10/2026 16:02" });
    nc.concluida = true;
    nc.concluidaEm = "15/10/2026";
    nc.concluidaPor = "Andressa Teles Rodrigues";
    nc.logs.push(
      { dataHora: "14/10/2026 16:02", operador: "Andressa Teles Rodrigues", acao: "Registrou período sem CPP", detalhe: "05/2026 — DAS do PA 04/2026 zerado.", aprovadoPor: null },
      { dataHora: "15/10/2026 09:30", operador: "Andressa Teles Rodrigues", acao: "Concluiu implantação", detalhe: "7 períodos resolvidos; 5 anteriores ao início de atividade. FS12 só com a CPP do DAS.", aprovadoPor: null }
    );
    return s;
  }

  try {
    const raw = global.localStorage.getItem(STORAGE_KEY);
    store = raw ? JSON.parse(raw) : seed();
  } catch (e) {
    store = seed();
  }
  Object.keys(store).forEach((c) => {
    store[c].codigo = c;
  });
  function save() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      /* localStorage indisponível — vale só nesta renderização */
    }
  }

  function log(codigo, acao, detalhe, operador) {
    store[codigo].logs.push({ dataHora: agora(), operador: operador || OPERADOR, acao, detalhe, aprovadoPor: null });
  }

  function foraDoSimples(codigo) {
    return FORA_DO_SN[codigo] || null;
  }
  function getImplantacao(codigo) {
    return store[codigo] || null;
  }
  function mes(codigo, periodo) {
    return store[codigo].meses.find((m) => m.periodo === periodo);
  }

  function folhaResolvida(m) {
    if (m.origemFolha === "dp_fora") return m.folha !== null;
    return true;
  }
  function cppResolvida(m) {
    return m.origemCpp !== "pendente";
  }

  function resumo(codigo) {
    const imp = store[codigo];
    if (!imp) return null;
    const meses = imp.meses;
    const exigidos = meses.filter((m) => m.origemCpp !== "nao_compoe");
    const pendencias = [];
    exigidos.forEach((m) => {
      const faltam = [];
      if (!cppResolvida(m)) faltam.push("CPP");
      if (!folhaResolvida(m)) faltam.push("folha");
      if (faltam.length) pendencias.push({ periodo: m.periodo, faltam });
    });
    const cppTotal = meses.reduce((s, m) => s + (m.cpp || 0), 0);
    const folhaTotal = meses.reduce((s, m) => s + (m.folha || 0), 0);
    const fs12 = cppTotal + folhaTotal;
    const fatorR = imp.enq.rbt12 ? fs12 / imp.enq.rbt12 : 0;
    return {
      janela: meses.length,
      exigidos: exigidos.length,
      resolvidos: exigidos.length - pendencias.length,
      pendencias,
      naoCompoe: meses.length - exigidos.length,
      motor: meses.filter((m) => m.origemCpp === "motor").length,
      serproFalhas: meses.filter((m) => m.origemCpp === "pendente" && m.motivo === "falha").length,
      cppTotal,
      folhaTotal,
      fs12,
      rbt12: imp.enq.rbt12,
      fatorR,
      anexo: fatorR >= LIMITE_FATOR_R ? "Anexo III" : "Anexo V",
    };
  }

  // "nao_aplica" | "nao_iniciada" | "em_andamento" | "pronta" | "implantada"
  function status(codigo) {
    if (foraDoSimples(codigo)) return "nao_aplica";
    const imp = store[codigo];
    if (!imp) return "nao_iniciada";
    if (imp.concluida) return "implantada";
    return resumo(codigo).pendencias.length === 0 ? "pronta" : "em_andamento";
  }

  function percentual(codigo) {
    const r = resumo(codigo);
    if (!r) return null;
    return r.exigidos === 0 ? 100 : Math.round((r.resolvidos / r.exigidos) * 100);
  }

  function novaImplantacao(codigo, ctx) {
    if (store[codigo] || foraDoSimples(codigo)) return null;
    store[codigo] = Object.assign(capturar(codigo, ctx, agora(), OPERADOR), { codigo });
    save();
    return resumo(codigo);
  }

  // RF-205: só reconsulta o que falhou; PA já capturado ou sem declaração não é consultado de novo.
  function reconsultarSerpro(codigo) {
    const imp = store[codigo];
    const alvo = imp.meses.filter((m) => m.origemCpp === "pendente" && m.motivo === "falha");
    alvo.forEach((m) => {
      const i = PERIODOS.indexOf(m.periodo);
      Object.assign(m, { cpp: valorCpp(codigo, i), origemCpp: "serpro", motivo: null, evidencia: "Declaração " + numeroDeclaracao(codigo, m.pa) });
    });
    log(codigo, "Consultou a SERPRO de novo", alvo.length + " período(s) com falha reconsultado(s); PAs já capturados não foram consultados.", "Sistema");
    save();
    return alvo.length;
  }

  // RN-09: saldo já consumido num PGDAS-D transmitido não é editável; a correção
  // segue pela retificação (FIS-853). Mock: PGDAS-D já transmitido por empresa.
  const TRANSMITIDOS = { "NC-0091": { pa: "09/2026", em: "20/10/2026" } };
  function transmitido(codigo) {
    return TRANSMITIDOS[codigo] || null;
  }
  // Os períodos da janela do PA transmitido (anteriores a ele) já foram consumidos.
  function consumido(codigo, periodo) {
    const t = TRANSMITIDOS[codigo];
    return !!t && antes(periodo, t.pa);
  }

  function editavelCpp(m, imp, codigo) {
    if (imp.concluida || consumido(codigo || imp.codigo, m.periodo)) return false;
    return ["pendente", "manual", "zero"].indexOf(m.origemCpp) !== -1;
  }

  function implantarCpp(codigo, periodo, valor, evidencia) {
    const imp = store[codigo];
    const m = mes(codigo, periodo);
    if (!m || !editavelCpp(m, imp)) return;
    const anteriorValor = m.cpp;
    Object.assign(m, { cpp: valor, origemCpp: "manual", motivo: null, evidencia: evidencia || m.evidencia || null, editadoPor: OPERADOR, editadoEm: agora() });
    log(codigo, anteriorValor === null ? "Implantou CPP manual" : "Alterou CPP manual", periodo + " — " + formatarMoeda(valor) + (anteriorValor === null ? "" : " (antes " + formatarMoeda(anteriorValor) + ")") + (evidencia ? " · evidência: " + evidencia : "") + ".");
    save();
  }

  function definirEvidencia(codigo, periodo, evidencia) {
    const m = mes(codigo, periodo);
    if (!m || m.origemCpp !== "manual") return;
    m.evidencia = evidencia || null;
    save();
  }

  function confirmarZero(codigo, periodo) {
    const imp = store[codigo];
    const m = mes(codigo, periodo);
    if (!m || !editavelCpp(m, imp)) return;
    Object.assign(m, { cpp: 0, origemCpp: "zero", motivo: null, evidencia: "DAS do PA " + m.pa + " sem CPP", editadoPor: OPERADOR, editadoEm: agora() });
    log(codigo, "Registrou período sem CPP", periodo + " — DAS do PA " + m.pa + " sem CPP.");
    save();
  }

  function limparCpp(codigo, periodo) {
    const imp = store[codigo];
    const m = mes(codigo, periodo);
    if (!m || !editavelCpp(m, imp, codigo) || ["manual", "zero"].indexOf(m.origemCpp) === -1) return;
    Object.assign(m, { cpp: null, origemCpp: "pendente", evidencia: null, editadoPor: OPERADOR, editadoEm: agora() });
    log(codigo, "Limpou CPP", periodo + " — voltou a pendente.");
    save();
  }

  function implantarFolha(codigo, periodo, valor) {
    const imp = store[codigo];
    const m = mes(codigo, periodo);
    if (!m || imp.concluida || m.origemFolha !== "dp_fora" || consumido(codigo, periodo)) return;
    const anteriorValor = m.folha;
    Object.assign(m, { folha: valor, editadoPor: OPERADOR, editadoEm: agora() });
    log(codigo, valor === null ? "Limpou folha manual" : anteriorValor === null ? "Informou folha manual" : "Alterou folha manual", periodo + (valor === null ? "" : " — " + formatarMoeda(valor)) + ".");
    save();
  }

  // RF-206: o extrato traz PAs; os que pagam períodos pendentes da janela preenchem
  // com origem "Extrato do DAS"; PA fora da janela é recusado com o motivo.
  function leituraExtrato(codigo) {
    const imp = store[codigo];
    const lidos = imp.meses
      .filter((m) => m.origemCpp === "pendente" || m.origemCpp === "manual")
      .map((m) => ({ pa: m.pa, periodo: m.periodo, valor: valorCpp(codigo, PERIODOS.indexOf(m.periodo)), aceito: true }));
    lidos.push({ pa: anterior(paDoPeriodo(PERIODOS[0])), periodo: null, valor: valorCpp(codigo, 0), aceito: false, motivo: "PA fora da janela do PA " + PA_REFERENCIA });
    return lidos;
  }

  function aplicarExtrato(codigo, nomeArquivo) {
    const aceitos = leituraExtrato(codigo).filter((l) => l.aceito);
    aceitos.forEach((l) => {
      Object.assign(mes(codigo, l.periodo), { cpp: l.valor, origemCpp: "extrato", motivo: null, evidencia: nomeArquivo, editadoPor: OPERADOR, editadoEm: agora() });
    });
    log(codigo, "Subiu extrato do DAS", aceitos.length + " período(s) preenchido(s) a partir do " + nomeArquivo + "; 1 PA fora da janela recusado.");
    save();
    return aceitos.length;
  }

  // ===== Carga em lote por planilha (RF-104): CNPJ, período, CPP e nº da declaração.
  // Validação por linha, com o motivo e o número da linha recusada; idempotente
  // (a mesma linha reenviada não altera nada).
  const PLANILHA_LOTE = "CargaCPP_Lote_R3.xlsx";
  function linhasPlanilhaMock() {
    return [
      { linha: 2, cnpj: "31.452.118/0001-07", periodo: "03/2026", cpp: "9.212,40", declaracao: "00031245780-022026" },
      { linha: 3, cnpj: "28.907.334/0001-62", periodo: "06/2026", cpp: "4.988,10", declaracao: "00028907334-052026" },
      { linha: 4, cnpj: "28.907.334/0001-62", periodo: "07/2026", cpp: "5.010,00", declaracao: "00028907335-062026" },
      { linha: 5, cnpj: "11.111.111/0001-11", periodo: "05/2026", cpp: "1.200,00", declaracao: "00011111111-042026" },
      { linha: 6, cnpj: "31.452.118/0001-07", periodo: "10/2026", cpp: "9.400,00", declaracao: "00031245781-092026" },
      { linha: 7, cnpj: "28.907.334/0001-62", periodo: "12/2025", cpp: "-50,00", declaracao: "00028907336-112025" },
      { linha: 8, cnpj: "17.880.453/0001-90", periodo: "04/2026", cpp: "2.300,00", declaracao: "00017880453-032026" },
    ];
  }

  function validarLote(infoEmpresaPorCnpj) {
    return linhasPlanilhaMock().map((l) => {
      const empresa = infoEmpresaPorCnpj(l.cnpj);
      const base = Object.assign({}, l, { empresa: empresa ? empresa.nome : null, codigo: empresa ? empresa.codigo : null });
      if (!empresa) return Object.assign(base, { resultado: "recusada", motivo: "CNPJ não encontrado no Cockpit" });
      if (PERIODOS.indexOf(l.periodo) === -1) return Object.assign(base, { resultado: "recusada", motivo: "Período fora da janela do PA " + PA_REFERENCIA });
      const valor = parseMoeda(l.cpp);
      if (valor === null || /-/.test(l.cpp)) return Object.assign(base, { resultado: "recusada", motivo: "CPP inválida: informe valor maior ou igual a zero, com 2 casas" });
      const imp = store[empresa.codigo];
      if (!imp) return Object.assign(base, { resultado: "recusada", motivo: "Implantação Fiscal não iniciada para a empresa" });
      const m = mes(empresa.codigo, l.periodo);
      if (m.origemCpp === "manual" && m.cpp === valor) return Object.assign(base, { valor, resultado: "sem_alteracao", motivo: "Já implantada com este valor" });
      if (!editavelCpp(m, imp, empresa.codigo)) {
        const porque = consumido(empresa.codigo, l.periodo) ? "consumido em PGDAS-D transmitido" : imp.concluida ? "implantação concluída" : "já tem CPP de " + ROTULO_ORIGEM_CPP[m.origemCpp];
        return Object.assign(base, { valor, resultado: "ignorada", motivo: "Período " + porque });
      }
      return Object.assign(base, { valor, resultado: "implanta" });
    });
  }

  function aplicarLote(validacao) {
    const aplicaveis = validacao.filter((l) => l.resultado === "implanta");
    const porEmpresa = {};
    aplicaveis.forEach((l) => {
      Object.assign(mes(l.codigo, l.periodo), { cpp: l.valor, origemCpp: "manual", motivo: null, evidencia: "Lote " + PLANILHA_LOTE + " · declaração " + l.declaracao, editadoPor: OPERADOR, editadoEm: agora() });
      porEmpresa[l.codigo] = (porEmpresa[l.codigo] || 0) + 1;
    });
    Object.keys(porEmpresa).forEach((c) => log(c, "Carga em lote", porEmpresa[c] + " período(s) implantado(s) pela planilha " + PLANILHA_LOTE + "."));
    save();
    return aplicaveis.length;
  }

  function concluir(codigo) {
    if (status(codigo) !== "pronta") return;
    const r = resumo(codigo);
    Object.assign(store[codigo], { concluida: true, concluidaEm: agora().split(" ")[0], concluidaPor: OPERADOR });
    log(codigo, "Concluiu implantação", r.resolvidos + " períodos resolvidos. FS12 de " + formatarMoeda(r.fs12) + "; prévia do Fator R de " + formatarPercentual(r.fatorR) + ".");
    save();
  }

  function reabrir(codigo) {
    if (!store[codigo] || !store[codigo].concluida) return;
    Object.assign(store[codigo], { concluida: false, concluidaEm: null, concluidaPor: null });
    log(codigo, "Reabriu implantação", "Saldos liberados para edição (períodos ainda não consumidos em PA transmitido).");
    save();
  }

  function formatarMoeda(valor) {
    if (valor === null || valor === undefined) return "—";
    return "R$ " + valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // RF-103: valor maior ou igual a zero, com até 2 casas decimais.
  function parseMoeda(texto) {
    const limpo = String(texto || "").trim().replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
    if (limpo === "") return null;
    const n = Number(limpo);
    return isNaN(n) || n < 0 ? null : Math.round(n * 100) / 100;
  }
  function formatarPercentual(fracao) {
    return (fracao * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  }

  global.FiscalImplantacaoData = {
    PA_REFERENCIA,
    PERIODOS,
    LIMITE_FATOR_R,
    ROTULO_ORIGEM_CPP,
    MODO_FOLHA,
    MOTIVO_SERPRO,
    paDoPeriodo,
    foraDoSimples,
    getImplantacao,
    resumo,
    status,
    percentual,
    novaImplantacao,
    reconsultarSerpro,
    editavelCpp,
    transmitido,
    consumido,
    PLANILHA_LOTE,
    validarLote,
    aplicarLote,
    implantarCpp,
    definirEvidencia,
    confirmarZero,
    limparCpp,
    implantarFolha,
    leituraExtrato,
    aplicarExtrato,
    concluir,
    reabrir,
    formatarMoeda,
    parseMoeda,
    formatarPercentual,
  };
})(window);
