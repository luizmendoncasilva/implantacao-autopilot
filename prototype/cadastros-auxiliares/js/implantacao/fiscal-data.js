/*
  Mock da Implantação Fiscal — saldos mensais de CPP do DAS para o Fator R
  (épico CTB-532, protótipo CTB-534; regras finais no doc CTB-533, ainda em
  aberto).

  Regra adotada (texto do épico, que prevalece sobre as issues filhas): toda
  empresa sujeita ao Fator R implanta a CPP dos meses anteriores ao início do
  motor, tenha ou não folha implantada pela Implantação DP — a DP entrega
  folha, 13º e FGTS, mas não a CPP paga no DAS. Meses a partir do início do
  motor vêm da rolagem mensal (FIS-997) e não são editáveis.

  `origem` de cada competência: "pendente" | "implantada" | "extrato"
  (preenchida pelo extrato do DAS) | "zero" (sem CPP confirmado pela
  operação — vazio nunca vira zero sozinho) | "rolagem" | "nao_compoe"
  (antes do início de atividade).

  `pagamento.status` ("pago" | "atraso" | "nao_pago") só faz sentido se o doc
  confirmar que vale o valor recolhido (regime de caixa) — por isso a tela
  sinaliza a coluna como dependente do CTB-533.
*/
(function (global) {
  const PA_REFERENCIA = "10/2026";
  // 12 competências anteriores ao PA, em ordem cronológica.
  const JANELA = ["10/2025", "11/2025", "12/2025", "01/2026", "02/2026", "03/2026", "04/2026", "05/2026", "06/2026", "07/2026", "08/2026", "09/2026"];
  const LIMITE_FATOR_R = 0.28;

  const ROTULO_ORIGEM = {
    pendente: "Pendente",
    implantada: "Implantada",
    extrato: "Extrato do DAS",
    zero: "Sem CPP (zero confirmado)",
    rolagem: "Rolagem do motor",
    nao_compoe: "Não compõe",
  };

  const ORIGEM_FOLHA = {
    dp: { label: "Implantada pela DP", descricao: "Folha, 13º e FGTS vêm da Implantação DP (relatórios da Domínio)." },
    dp_fora: { label: "DP fora da BHub", descricao: "A empresa não opera DP na BHub — não há relatórios de folha para implantar." },
    sem_folha: { label: "Sem movimento de folha", descricao: "Sem empregados e sem pró-labore — não há folha a implantar." },
  };

  const ENQUADRAMENTO = {
    "MS-0027": { sujeitoFatorR: false, motivo: "Empresa no Lucro Presumido. O Fator R só existe no Simples Nacional." },
    "CH-0042": { sujeitoFatorR: false, motivo: "Simples Nacional só com comércio (Anexo I). O Fator R não se aplica a essa atividade." },
    "PA-0011": { sujeitoFatorR: false, motivo: "Simples Nacional com atividades nos Anexos I e II. O Fator R não se aplica a essas atividades." },
    "CV-0058": {
      sujeitoFatorR: true,
      atividade: "8630-5/03 — Atividade médica ambulatorial",
      origemFolha: "dp",
      inicioMotor: "07/2026",
      inicioAtividade: "03/2014",
      rbt12: 1480000,
    },
    "EL-0073": {
      sujeitoFatorR: true,
      atividade: "7111-1/00 — Serviços de arquitetura",
      origemFolha: "dp_fora",
      inicioMotor: "10/2026",
      inicioAtividade: "08/2019",
      rbt12: 920000,
    },
    "NC-0091": {
      sujeitoFatorR: true,
      atividade: "6204-0/00 — Consultoria em tecnologia da informação",
      origemFolha: "sem_folha",
      inicioMotor: "10/2026",
      inicioAtividade: "02/2026",
      rbt12: 410000,
    },
  };

  function mesSeguinte(competencia) {
    const [m, a] = competencia.split("/").map(Number);
    return m === 12 ? "01/" + (a + 1) : String(m + 1).padStart(2, "0") + "/" + a;
  }

  function antes(a, b) {
    const [ma, aa] = a.split("/").map(Number);
    const [mb, ab] = b.split("/").map(Number);
    return aa < ab || (aa === ab && ma < mb);
  }

  function pago(competencia, dia) {
    return { status: "pago", data: (dia || "20") + "/" + mesSeguinte(competencia) };
  }

  // Valores determinísticos (sem Math.random) para a mesma tela abrir igual sempre.
  function folhaCv(i, competencia) {
    const base = 24800 + i * 140;
    return competencia === "12/2025" ? base * 2 : base;
  }

  function seedCv() {
    return JANELA.map((competencia, i) => {
      const cppDas = 9100 + i * 35;
      const mes = { competencia, folhaDp: folhaCv(i, competencia), cpp: null, origem: "pendente", pagamento: pago(competencia), cppExtrato: cppDas };
      if (!antes(competencia, "07/2026")) return Object.assign(mes, { cpp: cppDas, origem: "rolagem" });
      if (antes(competencia, "03/2026")) {
        return Object.assign(mes, { cpp: cppDas, origem: "implantada", editadoPor: "Luiz Felipe Mendonça Silva", editadoEm: "16/10/2026 10:" + String(12 + i).padStart(2, "0") });
      }
      return mes;
    }).map((m) => (m.competencia === "01/2026" ? Object.assign(m, { pagamento: { status: "atraso", data: "05/03/2026" } }) : m));
  }

  function seedEl() {
    return JANELA.map((competencia, i) => ({
      competencia,
      folhaDp: null,
      cpp: null,
      origem: "pendente",
      pagamento: competencia === "06/2026" ? { status: "nao_pago", data: null } : pago(competencia),
      cppExtrato: 5480 + i * 22,
    }));
  }

  function seedNc() {
    return JANELA.map((competencia, i) => {
      if (antes(competencia, "02/2026")) return { competencia, folhaDp: null, cpp: null, origem: "nao_compoe", pagamento: null, cppExtrato: null };
      if (competencia === "03/2026") {
        return { competencia, folhaDp: null, cpp: 0, origem: "zero", pagamento: null, cppExtrato: 0, editadoPor: "Andressa Teles Rodrigues", editadoEm: "14/10/2026 16:02" };
      }
      return {
        competencia,
        folhaDp: null,
        cpp: 1850 + i * 18,
        origem: "extrato",
        pagamento: pago(competencia),
        cppExtrato: 1850 + i * 18,
        editadoPor: "Andressa Teles Rodrigues",
        editadoEm: "14/10/2026 15:48",
      };
    });
  }

  const SEED = {
    "CV-0058": {
      concluida: false,
      meses: seedCv(),
      logs: [
        { dataHora: "15/10/2026 09:10", operador: "Sistema", acao: "Identificou exigência do Fator R", detalhe: "Atividade 8630-5/03 sujeita ao Fator R. Janela de 10/2025 a 09/2026 para o PA 10/2026.", aprovadoPor: null },
        { dataHora: "16/10/2026 10:25", operador: "Luiz Felipe Mendonça Silva", acao: "Implantou CPP", detalhe: "5 competências (10/2025 a 02/2026) digitadas a partir dos extratos do DAS.", aprovadoPor: null },
      ],
    },
    "EL-0073": {
      concluida: false,
      meses: seedEl(),
      logs: [
        { dataHora: "20/10/2026 08:40", operador: "Sistema", acao: "Identificou exigência do Fator R", detalhe: "Atividade 7111-1/00 sujeita ao Fator R. Janela de 10/2025 a 09/2026 para o PA 10/2026.", aprovadoPor: null },
      ],
    },
    "NC-0091": {
      concluida: true,
      concluidaEm: "15/10/2026",
      concluidaPor: "Andressa Teles Rodrigues",
      meses: seedNc(),
      logs: [
        { dataHora: "13/10/2026 11:00", operador: "Sistema", acao: "Identificou exigência do Fator R", detalhe: "Atividade 6204-0/00 sujeita ao Fator R. Início de atividade em 02/2026: 4 competências não compõem a janela.", aprovadoPor: null },
        { dataHora: "14/10/2026 15:48", operador: "Andressa Teles Rodrigues", acao: "Preencheu pelo extrato do DAS", detalhe: "7 competências preenchidas a partir do Extrato_PGDAS-D_NexoConsultoria.pdf.", aprovadoPor: null },
        { dataHora: "14/10/2026 16:02", operador: "Andressa Teles Rodrigues", acao: "Confirmou competência sem CPP", detalhe: "03/2026 — sem faturamento no mês, DAS zerado.", aprovadoPor: null },
        { dataHora: "15/10/2026 09:30", operador: "Andressa Teles Rodrigues", acao: "Concluiu implantação", detalhe: "8 competências resolvidas. FS12 composta só pela CPP do DAS.", aprovadoPor: "Elizandra Souza" },
      ],
    },
  };

  const STORAGE_KEY = "autopilot_prototype_implantacao_fiscal_v1";

  function loadStore() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(SEED));
    } catch (e) {
      return JSON.parse(JSON.stringify(SEED));
    }
  }

  let store = loadStore();

  function save() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      /* localStorage indisponível — mudança vale só nesta renderização */
    }
  }

  function agora() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  const OPERADOR = "Operador BHub";

  function log(codigo, acao, detalhe) {
    store[codigo].logs.push({ dataHora: agora(), operador: OPERADOR, acao, detalhe, aprovadoPor: null });
  }

  function enquadramento(codigo) {
    return ENQUADRAMENTO[codigo] || null;
  }

  function codigosNoEscopo() {
    return Object.keys(ENQUADRAMENTO);
  }

  function getImplantacao(codigo) {
    return store[codigo] || null;
  }

  function mes(codigo, competencia) {
    return store[codigo].meses.find((m) => m.competencia === competencia);
  }

  const RESOLVIDO = ["implantada", "extrato", "zero", "rolagem", "nao_compoe"];

  function resumo(codigo) {
    const enq = enquadramento(codigo);
    const imp = getImplantacao(codigo);
    if (!enq || !enq.sujeitoFatorR || !imp) return null;
    const meses = imp.meses;
    const conta = (origens) => meses.filter((m) => origens.indexOf(m.origem) !== -1).length;
    const naoCompoe = conta(["nao_compoe"]);
    const rolagem = conta(["rolagem"]);
    const exigem = meses.length - naoCompoe - rolagem;
    const implantados = conta(["implantada", "extrato", "zero"]);
    const pendentes = conta(["pendente"]);
    const cppTotal = meses.reduce((s, m) => s + (m.cpp || 0), 0);
    const folhaTotal = meses.reduce((s, m) => s + (m.folhaDp || 0), 0);
    const fs12 = cppTotal + folhaTotal;
    const fatorR = enq.rbt12 ? fs12 / enq.rbt12 : 0;
    return {
      janela: meses.length,
      exigem,
      implantados,
      pendentes,
      rolagem,
      naoCompoe,
      resolvidos: meses.filter((m) => RESOLVIDO.indexOf(m.origem) !== -1).length,
      cppTotal,
      folhaTotal,
      fs12,
      rbt12: enq.rbt12,
      fatorR,
      anexo: fatorR >= LIMITE_FATOR_R ? "Anexo III" : "Anexo V",
      atrasoOuNaoPago: meses.filter((m) => m.pagamento && m.pagamento.status !== "pago" && m.origem !== "nao_compoe").length,
    };
  }

  // "nao_aplica" | "pendente" | "em_andamento" | "pronta" | "implantada"
  function status(codigo) {
    const r = resumo(codigo);
    if (!r) return "nao_aplica";
    if (store[codigo].concluida) return "implantada";
    if (r.pendentes === 0) return "pronta";
    return r.implantados === 0 ? "pendente" : "em_andamento";
  }

  function percentual(codigo) {
    const r = resumo(codigo);
    if (!r) return null;
    return r.exigem === 0 ? 100 : Math.round((r.implantados / r.exigem) * 100);
  }

  function implantarCpp(codigo, competencia, valor) {
    const m = mes(codigo, competencia);
    if (!m || m.origem === "rolagem" || m.origem === "nao_compoe" || store[codigo].concluida) return;
    const anterior = m.cpp;
    m.cpp = valor;
    m.origem = "implantada";
    m.editadoPor = OPERADOR;
    m.editadoEm = agora();
    log(codigo, anterior === null ? "Implantou CPP" : "Alterou CPP", competencia + " — " + formatarMoeda(valor) + (anterior === null ? "" : " (antes " + formatarMoeda(anterior) + ")") + ".");
    save();
  }

  function confirmarZero(codigo, competencia) {
    const m = mes(codigo, competencia);
    if (!m || m.origem === "rolagem" || m.origem === "nao_compoe" || store[codigo].concluida) return;
    m.cpp = 0;
    m.origem = "zero";
    m.editadoPor = OPERADOR;
    m.editadoEm = agora();
    log(codigo, "Confirmou competência sem CPP", competencia + " — registrada como zero.");
    save();
  }

  function limpar(codigo, competencia) {
    const m = mes(codigo, competencia);
    if (!m || ["implantada", "extrato", "zero"].indexOf(m.origem) === -1 || store[codigo].concluida) return;
    m.cpp = null;
    m.origem = "pendente";
    m.editadoPor = OPERADOR;
    m.editadoEm = agora();
    log(codigo, "Limpou competência", competencia + " — voltou a pendente.");
    save();
  }

  // Valores lidos do extrato do DAS — só para as competências ainda pendentes.
  function sugestoesExtrato(codigo) {
    return store[codigo].meses.filter((m) => m.origem === "pendente").map((m) => ({ competencia: m.competencia, valor: m.cppExtrato, pagamento: m.pagamento }));
  }

  function aplicarExtrato(codigo, nomeArquivo) {
    const sugestoes = sugestoesExtrato(codigo);
    sugestoes.forEach((s) => {
      const m = mes(codigo, s.competencia);
      m.cpp = s.valor;
      m.origem = "extrato";
      m.editadoPor = OPERADOR;
      m.editadoEm = agora();
    });
    log(codigo, "Preencheu pelo extrato do DAS", sugestoes.length + " competência(s) preenchida(s) a partir do " + nomeArquivo + ".");
    save();
    return sugestoes.length;
  }

  function concluir(codigo) {
    if (status(codigo) !== "pronta") return;
    const r = resumo(codigo);
    store[codigo].concluida = true;
    store[codigo].concluidaEm = agora().split(" ")[0];
    store[codigo].concluidaPor = OPERADOR;
    log(codigo, "Concluiu implantação", r.resolvidos + " competências resolvidas. FS12 de " + formatarMoeda(r.fs12) + ", Fator R prévio de " + formatarPercentual(r.fatorR) + ".");
    save();
  }

  function reabrir(codigo) {
    if (!store[codigo] || !store[codigo].concluida) return;
    store[codigo].concluida = false;
    store[codigo].concluidaEm = null;
    store[codigo].concluidaPor = null;
    log(codigo, "Reabriu implantação", "Saldos de CPP liberados para edição.");
    save();
  }

  function formatarMoeda(valor) {
    if (valor === null || valor === undefined) return "—";
    return "R$ " + valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parseMoeda(texto) {
    const limpo = String(texto || "").replace(/[^\d,]/g, "").replace(",", ".");
    if (limpo === "") return null;
    const n = Number(limpo);
    return isNaN(n) ? null : Math.round(n * 100) / 100;
  }

  function formatarPercentual(fracao) {
    return (fracao * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  }

  global.FiscalImplantacaoData = {
    PA_REFERENCIA,
    JANELA,
    LIMITE_FATOR_R,
    ROTULO_ORIGEM,
    ORIGEM_FOLHA,
    enquadramento,
    codigosNoEscopo,
    getImplantacao,
    resumo,
    status,
    percentual,
    implantarCpp,
    confirmarZero,
    limpar,
    sugestoesExtrato,
    aplicarExtrato,
    concluir,
    reabrir,
    formatarMoeda,
    parseMoeda,
    formatarPercentual,
  };
})(window);
