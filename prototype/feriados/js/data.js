/*
  Dados e regras da Tabela de Feriados (Autopilot > Parâmetros Gerais).

  Fonte única e transversal (DP, Fiscal e Contábil vão consumir esta tabela;
  o protótipo não simula esse consumo). Três abrangências separadas —
  Federal, Estadual e Municipal —, município sempre identificado pelo código
  IBGE. A empresa é vinculada automaticamente pelo IBGE do município dela,
  por isso aqui só existe o contador informativo de empresas vinculadas.

  Fixo: só dia/mês (vale para todos os anos). Móvel: data completa, mantida a
  cada ano. Nada é excluído: só inativar/reativar, para preservar o histórico.

  Dados ilustrativos — conferir antes de virarem dado real. Persistência em
  localStorage com o prefixo autopilot_prototype_ (o "Restaurar dados do
  protótipo" limpa estas chaves).
*/
(function (global) {
  const STORAGE_KEY = "autopilot_prototype_feriados_v1";
  const LOG_KEY = "autopilot_prototype_feriados_log_v1";
  const USUARIO_ATUAL = "Elaine C.";
  const ANO_PADRAO = 2026;
  const ANOS = [2025, 2026, 2027, 2028];

  const UFS = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"];

  const ABRANGENCIAS = { federal: "Federal", estadual: "Estadual", municipal: "Municipal" };
  const TIPOS = { fixo: "Fixo", movel: "Móvel" };
  const ORIGENS = { api: "API", dominio: "Carga Domínio", manual: "Manual" };
  const ACOES = { criado: "Criado", editado: "Editado", inativado: "Inativado", reativado: "Reativado" };

  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const DIAS_NO_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const DIAS_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  // Catálogo mínimo só para o combobox; `empresas` é fictício (vínculo automático pelo IBGE).
  const MUNICIPIOS = [
    { ibge: "3550308", nome: "São Paulo", uf: "SP", empresas: 214 },
    { ibge: "3509502", nome: "Campinas", uf: "SP", empresas: 41 },
    { ibge: "3543402", nome: "Ribeirão Preto", uf: "SP", empresas: 18 },
    { ibge: "3106200", nome: "Belo Horizonte", uf: "MG", empresas: 87 },
    { ibge: "3148004", nome: "Patos de Minas", uf: "MG", empresas: 12 },
    { ibge: "3170206", nome: "Uberlândia", uf: "MG", empresas: 29 },
    { ibge: "3118601", nome: "Contagem", uf: "MG", empresas: 0 },
    { ibge: "5208707", nome: "Goiânia", uf: "GO", empresas: 156 },
    { ibge: "5201405", nome: "Aparecida de Goiânia", uf: "GO", empresas: 34 },
    { ibge: "5201108", nome: "Anápolis", uf: "GO", empresas: 22 },
    { ibge: "3304557", nome: "Rio de Janeiro", uf: "RJ", empresas: 98 },
    { ibge: "3303302", nome: "Niterói", uf: "RJ", empresas: 15 },
    { ibge: "2927408", nome: "Salvador", uf: "BA", empresas: 46 },
    { ibge: "4314902", nome: "Porto Alegre", uf: "RS", empresas: 38 },
    { ibge: "4106902", nome: "Curitiba", uf: "PR", empresas: 52 },
    { ibge: "5300108", nome: "Brasília", uf: "DF", empresas: 63 },
  ];

  function feriado(id, abrangencia, uf, ibge, descricao, tipo, dia, mes, ano, origem, obs) {
    return { id, abrangencia, uf, ibge, descricao, tipo, dia, mes, ano, origem, obs: obs || "", ativo: true };
  }

  const FERIADOS_INICIAL = [
    feriado(1, "federal", null, null, "Confraternização Universal", "fixo", 1, 1, null, "api"),
    feriado(2, "federal", null, null, "Tiradentes", "fixo", 21, 4, null, "api"),
    feriado(3, "federal", null, null, "Dia do Trabalho", "fixo", 1, 5, null, "api"),
    feriado(4, "federal", null, null, "Independência do Brasil", "fixo", 7, 9, null, "api"),
    feriado(5, "federal", null, null, "Nossa Senhora Aparecida", "fixo", 12, 10, null, "api"),
    feriado(6, "federal", null, null, "Finados", "fixo", 2, 11, null, "api"),
    feriado(7, "federal", null, null, "Proclamação da República", "fixo", 15, 11, null, "api"),
    feriado(8, "federal", null, null, "Consciência Negra", "fixo", 20, 11, null, "api"),
    feriado(9, "federal", null, null, "Natal", "fixo", 25, 12, null, "api"),

    feriado(10, "estadual", "SP", null, "Revolução Constitucionalista", "fixo", 9, 7, null, "api", "Feriado estadual — fundamento legal a conferir"),
    feriado(11, "estadual", "RJ", null, "São Jorge", "fixo", 23, 4, null, "api"),
    feriado(12, "estadual", "RJ", null, "Carnaval", "movel", 17, 2, 2026, "api"),
    feriado(13, "estadual", "RS", null, "Revolução Farroupilha", "fixo", 20, 9, null, "api"),
    feriado(14, "estadual", "BA", null, "Independência da Bahia", "fixo", 2, 7, null, "api"),

    feriado(15, "municipal", "SP", "3550308", "Aniversário da cidade", "fixo", 25, 1, null, "dominio"),
    feriado(16, "municipal", "SP", "3550308", "Sexta-feira Santa", "movel", 3, 4, 2026, "dominio"),
    feriado(17, "municipal", "SP", "3550308", "Corpus Christi", "movel", 4, 6, 2026, "dominio"),
    feriado(18, "municipal", "MG", "3106200", "Assunção de Nossa Senhora", "fixo", 15, 8, null, "dominio"),
    feriado(19, "municipal", "MG", "3106200", "Imaculada Conceição", "fixo", 8, 12, null, "dominio"),
    feriado(20, "municipal", "MG", "3106200", "Corpus Christi", "movel", 4, 6, 2026, "dominio"),
    feriado(21, "municipal", "MG", "3148004", "Nossa Senhora da Abadia", "fixo", 15, 8, null, "manual"),
    feriado(22, "municipal", "GO", "5208707", "Aniversário da cidade", "fixo", 24, 10, null, "dominio"),
    feriado(23, "municipal", "GO", "5208707", "Feriado decretado (extraordinário)", "movel", 13, 11, 2026, "manual", "Decreto municipal extraordinário — válido apenas em 2026"),
  ];

  // Marca o 20 (BH, Corpus Christi) como inativo — ver evento "inativado" no log inicial.
  FERIADOS_INICIAL[19].ativo = false;

  function dataTxt(dia, mes, ano) {
    return pad2(dia) + "/" + pad2(mes) + (ano ? "/" + ano : "");
  }

  function evento(id, feriadoId, usuario, em, acao, motivo, alteracoes) {
    return { id, feriadoId, usuario, em, acao, motivo: motivo || "", alteracoes: alteracoes || [] };
  }

  function camposCriacao(f, dataInicial) {
    const campos = [{ campo: "Descrição", de: null, para: f.descricao }, { campo: "Tipo", de: null, para: TIPOS[f.tipo] }, { campo: "Data", de: null, para: dataInicial || formatarDataFeriado(f) }];
    if (f.abrangencia !== "federal") campos.push({ campo: "UF", de: null, para: f.uf });
    if (f.abrangencia === "municipal") campos.push({ campo: "Município", de: null, para: rotuloMunicipio(f.ibge) });
    if (f.obs) campos.push({ campo: "Observação", de: null, para: f.obs });
    return campos;
  }

  function logInicial() {
    const eventos = [];
    let seq = 1;
    function add(feriadoId, usuario, em, acao, motivo, alteracoes) {
      eventos.push(evento(seq++, feriadoId, usuario, em, acao, motivo, alteracoes));
    }
    FERIADOS_INICIAL.forEach((f) => {
      if (f.id === 21) {
        add(f.id, "Andressa R.", "2026-03-10T15:00", "criado", "Cadastro manual solicitado pelo DP", camposCriacao(f));
      } else if (f.id === 23) {
        add(f.id, "Jaqueline S.", "2026-10-01T09:20", "criado", "Decretado pela prefeitura; incluído manualmente após a publicação oficial", camposCriacao(f, "12/11/2026"));
      } else if (f.origem === "api") {
        add(f.id, "Sistema (API)", "2026-01-12T06:00", "criado", "Carga automática via API", camposCriacao(f));
      } else {
        add(f.id, "Sistema (Carga Domínio)", "2026-02-03T08:15", "criado", "Carga inicial do Domínio", camposCriacao(f));
      }
    });
    add(12, "Andressa R.", "2026-02-20T14:05", "editado", "Correção da data (terça-feira de Carnaval)", [{ campo: "Data", de: "16/02/2026", para: "17/02/2026" }]);
    add(15, "Jaqueline S.", "2026-06-02T11:10", "editado", "Padronização da descrição", [{ campo: "Descrição", de: "Aniversário de São Paulo", para: "Aniversário da cidade" }]);
    add(20, "Jaqueline S.", "2026-05-28T16:40", "inativado", "Prefeitura trata a data como ponto facultativo (fora desta tabela)", []);
    add(10, "Andressa R.", "2026-09-14T10:32", "editado", "Inclusão do fundamento legal", [{ campo: "Observação", de: null, para: "Feriado estadual — fundamento legal a conferir" }]);
    add(23, "Jaqueline S.", "2026-10-02T11:05", "editado", "Decreto retificado: nova data", [{ campo: "Data", de: "12/11/2026", para: "13/11/2026" }]);
    return eventos;
  }

  // ===== Armazenamento =====

  function carregar(chave, fallback) {
    try {
      const raw = global.localStorage.getItem(chave);
      return raw ? JSON.parse(raw) : fallback();
    } catch (e) {
      return fallback();
    }
  }
  function gravar(chave, valor) {
    try {
      global.localStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {
      /* localStorage indisponível — segue só em memória nesta renderização */
    }
  }

  let cacheFeriados = null;
  let cacheLog = null;

  function getFeriados() {
    if (!cacheFeriados) cacheFeriados = carregar(STORAGE_KEY, () => JSON.parse(JSON.stringify(FERIADOS_INICIAL)));
    return cacheFeriados;
  }
  function getLog() {
    if (!cacheLog) cacheLog = carregar(LOG_KEY, logInicial);
    return cacheLog;
  }
  function salvar() {
    gravar(STORAGE_KEY, getFeriados());
    gravar(LOG_KEY, getLog());
  }

  function agora() {
    const d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + "T" + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  function registrarEvento(feriadoId, acao, motivo, alteracoes) {
    const log = getLog();
    const id = log.reduce((max, e) => Math.max(max, e.id), 0) + 1;
    log.push(evento(id, feriadoId, USUARIO_ATUAL, agora(), acao, motivo, alteracoes));
  }

  // ===== Formatação e datas =====

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatarDataFeriado(f) {
    return f.tipo === "movel" ? dataTxt(f.dia, f.mes, f.ano) : dataTxt(f.dia, f.mes);
  }

  function formatarDataHora(iso) {
    const [data, hora] = iso.split("T");
    const [a, m, d] = data.split("-");
    return d + "/" + m + "/" + a + " às " + hora;
  }
  function formatarDataIso(iso) {
    const [a, m, d] = iso.split("T")[0].split("-");
    return d + "/" + m + "/" + a;
  }

  function criarData(ano, mes, dia) {
    const d = new Date(ano, mes - 1, dia);
    return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia ? d : null;
  }

  // Fixo ocorre em todo ano; móvel só no ano em que foi cadastrado.
  function dataNoAno(f, ano) {
    if (f.tipo === "movel") return f.ano === ano ? criarData(ano, f.mes, f.dia) : null;
    return criarData(ano, f.mes, f.dia);
  }

  function diaDaSemana(data) {
    return DIAS_SEMANA[data.getDay()];
  }

  function dataBrParaPartes(dataBr) {
    const p = (dataBr || "").split("/");
    if (p.length !== 3) return null;
    const dia = Number(p[0]);
    const mes = Number(p[1]);
    const ano = Number(p[2]);
    return criarData(ano, mes, dia) ? { dia, mes, ano } : null;
  }

  // Domingo de Páscoa (Meeus/Jones/Butcher) — só para sugerir datas de móveis no "Preparar ano seguinte".
  function pascoa(ano) {
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
  }

  function esc(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizar(texto) {
    return (texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  // Devolve "dd/mm/aaaa" quando a descrição é um móvel calculável pela Páscoa; senão null.
  function sugerirDataMovel(descricao, ano) {
    const nome = normalizar(descricao);
    let deslocamento = null;
    if (nome.includes("carnaval")) deslocamento = -47;
    else if (nome.includes("sexta-feira santa")) deslocamento = -2;
    else if (nome.includes("corpus christi")) deslocamento = 60;
    if (deslocamento === null) return null;
    const p = pascoa(ano);
    const d = new Date(p.getFullYear(), p.getMonth(), p.getDate() + deslocamento);
    return dataTxt(d.getDate(), d.getMonth() + 1, d.getFullYear());
  }

  // ===== Locais =====

  function municipio(ibge) {
    return MUNICIPIOS.find((m) => m.ibge === ibge) || null;
  }
  function rotuloMunicipio(ibge) {
    const m = municipio(ibge);
    return m ? m.ibge + " – " + m.nome : ibge;
  }
  function municipiosDaUf(uf) {
    return MUNICIPIOS.filter((m) => !uf || m.uf === uf).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  function chaveLocal(f) {
    if (f.abrangencia === "federal") return "BR";
    if (f.abrangencia === "estadual") return f.uf;
    return f.ibge;
  }

  function rotuloLocal(f) {
    if (f.abrangencia === "federal") return "Nacional";
    if (f.abrangencia === "estadual") return f.uf;
    return rotuloMunicipio(f.ibge) + "/" + f.uf;
  }

  // ===== Consulta =====

  function ultimoEvento(feriadoId) {
    const eventos = getLog().filter((e) => e.feriadoId === feriadoId);
    return eventos.reduce((ult, e) => (!ult || e.em >= ult.em ? e : ult), null);
  }

  function eventosDoFeriado(feriadoId) {
    return getLog()
      .filter((e) => e.feriadoId === feriadoId)
      .sort((a, b) => (a.em < b.em ? 1 : a.em > b.em ? -1 : b.id - a.id));
  }

  function encontrar(id) {
    return getFeriados().find((f) => f.id === id) || null;
  }

  function resumoMunicipio(ibge, ano) {
    const m = municipio(ibge);
    const feriados = getFeriados().filter((f) => f.ativo && dataNoAno(f, ano));
    return {
      municipio: m,
      municipais: feriados.filter((f) => f.abrangencia === "municipal" && f.ibge === ibge).length,
      federais: feriados.filter((f) => f.abrangencia === "federal").length,
      estaduais: m ? feriados.filter((f) => f.abrangencia === "estadual" && f.uf === m.uf).length : 0,
      empresas: m ? m.empresas : 0,
      totalCadastrados: getFeriados().filter((f) => f.abrangencia === "municipal" && f.ibge === ibge).length,
    };
  }

  // ===== Regras de cadastro =====

  function mesmaOcorrencia(a, b) {
    if (a.tipo === "movel" && b.tipo === "movel") return a.ano === b.ano && a.dia === b.dia && a.mes === b.mes;
    return a.dia === b.dia && a.mes === b.mes;
  }

  // Duplicidade: mesma data + mesma abrangência + mesmo local (fixo vale para todos os anos).
  function buscarDuplicidade(candidato, ignorarId) {
    return (
      getFeriados().find(
        (f) =>
          f.id !== ignorarId &&
          f.abrangencia === candidato.abrangencia &&
          chaveLocal(f) === chaveLocal(candidato) &&
          mesmaOcorrencia(f, candidato)
      ) || null
    );
  }

  function valoresParaLog(f) {
    return {
      Descrição: f.descricao,
      Tipo: TIPOS[f.tipo],
      Data: formatarDataFeriado(f),
      UF: f.abrangencia === "federal" ? null : f.uf,
      Município: f.abrangencia === "municipal" ? rotuloMunicipio(f.ibge) : null,
      Observação: f.obs || null,
    };
  }

  function diferencas(antes, depois) {
    const a = valoresParaLog(antes);
    const d = valoresParaLog(depois);
    return Object.keys(a)
      .filter((campo) => a[campo] !== d[campo])
      .map((campo) => ({ campo, de: a[campo], para: d[campo] }));
  }

  function normalizarDados(dados) {
    const movel = dados.tipo === "movel";
    return {
      abrangencia: dados.abrangencia,
      uf: dados.abrangencia === "federal" ? null : dados.uf,
      ibge: dados.abrangencia === "municipal" ? dados.ibge : null,
      descricao: dados.descricao.trim(),
      tipo: dados.tipo,
      dia: dados.dia,
      mes: dados.mes,
      ano: movel ? dados.ano : null,
      obs: (dados.obs || "").trim(),
    };
  }

  function criar(dados, motivo) {
    const feriados = getFeriados();
    const novo = Object.assign({ id: feriados.reduce((max, f) => Math.max(max, f.id), 0) + 1, origem: "manual", ativo: true }, normalizarDados(dados));
    feriados.push(novo);
    registrarEvento(novo.id, "criado", motivo, camposCriacao(novo));
    salvar();
    return novo;
  }

  function editar(id, dados, motivo) {
    const atual = encontrar(id);
    const antes = Object.assign({}, atual);
    Object.assign(atual, normalizarDados(dados));
    registrarEvento(id, "editado", motivo, diferencas(antes, atual));
    salvar();
    return atual;
  }

  function alterarStatus(id, ativo, motivo) {
    const f = encontrar(id);
    f.ativo = ativo;
    registrarEvento(id, ativo ? "reativado" : "inativado", motivo, []);
    salvar();
    return f;
  }

  global.FeriadosData = {
    ANO_PADRAO,
    ANOS,
    UFS,
    ABRANGENCIAS,
    TIPOS,
    ORIGENS,
    ACOES,
    MESES,
    DIAS_NO_MES,
    MUNICIPIOS,
    getFeriados,
    encontrar,
    eventosDoFeriado,
    ultimoEvento,
    municipio,
    rotuloMunicipio,
    municipiosDaUf,
    rotuloLocal,
    chaveLocal,
    resumoMunicipio,
    dataNoAno,
    diaDaSemana,
    formatarDataFeriado,
    formatarDataHora,
    formatarDataIso,
    dataBrParaPartes,
    sugerirDataMovel,
    normalizar,
    esc,
    normalizarDados,
    buscarDuplicidade,
    diferencas,
    criar,
    editar,
    alterarStatus,
  };
})(window);
