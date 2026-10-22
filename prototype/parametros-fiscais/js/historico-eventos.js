/*
  Infraestrutura de eventos do Histórico de Alterações — Parâmetros Fiscais.

  Motor próprio da trilha Fiscal, não uma reutilização do motor de
  `prototype/empresas/js/data.js` (acoplado a Empresas, sem `vigenciaId`)
  nem uma promoção a `/shared/js` — decisão registrada no diagnóstico desta
  tarefa: replicar o padrão, como já feito em
  `prototype/folha-pagamento/js/historico-eventos.js` (P24), não generalizar
  um serviço compartilhado nesta rodada.

  Mesmo padrão de persistência já usado em Empresas/DP: localStorage
  namespaced por empresa, eventos mais recentes primeiro (unshift),
  try/catch defensivo em toda leitura/escrita. NÃO é uma auditoria real
  (sem backend, sem autenticação).

  Diferença estrutural em relação a Empresas e a DP/Regime: os campos
  Manual da Fiscal são persistidos por empresa × vigência (ver
  gerais-data.js e as demais *-data.js desta trilha, "Vigência Funcional").
  Por isso o evento aqui carrega `vigenciaId`, obrigatório — sem
  equivalente em Empresas (sem vigência) nem necessário em DP/Regime (onde
  "Iniciar nova vigência" está desabilitado, então só existe a vigência
  ativa — ver docs/folha-pagamento-fase8-p24-projeto-tecnico-historico-real.md,
  seção 7.2). Na Fiscal "Iniciar nova vigência" já é uma ação real, então a
  vigência de cada alteração precisa ficar registrada de forma inequívoca.
*/
(function (global) {
  const HISTORICO_EVENTOS_KEY = "autopilot_prototype_fiscal_historico_eventos_v1";

  // Usuário fixo do protótipo — mesmo valor já usado em
  // prototype/empresas/js/data.js (HISTORICO_USUARIO_PROTOTIPO) e em
  // prototype/folha-pagamento/js/historico-eventos.js, espelhando o rodapé
  // da sidebar (prototype/shared/js/shell.js). Não é um usuário novo.
  const HISTORICO_USUARIO_PROTOTIPO = "Elaine Calazans";

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function getEventosSalvos() {
    try {
      const raw = window.localStorage.getItem(HISTORICO_EVENTOS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      // JSON inválido/corrompido ou localStorage indisponível — nunca lança
      // exceção para a aplicação, mesmo critério defensivo já usado em
      // Empresas/DP.
      return {};
    }
  }

  // Lê os eventos de uma empresa, mais recentes primeiro. Array vazio
  // quando não houver eventos, quando a empresa não tiver entrada, ou
  // quando o conteúdo estiver ausente/corrompido — nenhum mock/seed existe
  // nesta trilha (o motor já nasce instrumentado nos 4 pontos de
  // salvamento reais, diferente do que DP fez inicialmente em P24).
  function getEventosHistoricoFiscal(codigoEmpresa) {
    if (!codigoEmpresa) return [];
    const salvos = getEventosSalvos();
    const eventos = salvos[codigoEmpresa];
    return Array.isArray(eventos) ? eventos : [];
  }

  // Cria e persiste 1 evento. Não registra nada quando `alteracoes` está
  // vazio — salvar sem alteração real nunca gera evento (mesma regra já
  // confirmada em Empresas e em DP/P24).
  function registrarEventoHistoricoFiscal(codigoEmpresa, area, vigenciaId, alteracoes) {
    if (!codigoEmpresa || !alteracoes || !alteracoes.length) return;
    const agora = new Date();
    const evento = {
      id: codigoEmpresa + "-" + agora.getTime(),
      data: pad2(agora.getDate()) + "/" + pad2(agora.getMonth() + 1) + "/" + agora.getFullYear(),
      hora: pad2(agora.getHours()) + ":" + pad2(agora.getMinutes()),
      usuario: HISTORICO_USUARIO_PROTOTIPO,
      area: area,
      vigenciaId: vigenciaId,
      alteracoes: alteracoes,
    };
    const salvos = getEventosSalvos();
    const eventosDaEmpresa = Array.isArray(salvos[codigoEmpresa]) ? salvos[codigoEmpresa] : [];
    eventosDaEmpresa.unshift(evento);
    salvos[codigoEmpresa] = eventosDaEmpresa;
    try {
      window.localStorage.setItem(HISTORICO_EVENTOS_KEY, JSON.stringify(salvos));
    } catch (e) {
      // localStorage indisponível/cheio — segue só em memória nesta
      // renderização, mesmo critério defensivo já usado em Empresas/DP.
    }
    return evento;
  }

  // Diff raso genérico — compara os valores BRUTOS (antes[chave] !==
  // depois[chave]), não os já formatados, para não repetir a limitação já
  // registrada no `diffCampos` de Empresas (coerção `||""`, que trata
  // `false`/`0` como vazio e os esconderia de uma alteração real, ex.:
  // "Aviso de troca de faixa de receita bruta" true → false).
  // `labels` é um mapa { chave: rótulo exibido }; `formatadores` (opcional)
  // é um mapa { chave: valor => texto } para exibir o valor no mesmo
  // formato já usado pelo card de cada aba (percentual com "%", booleano
  // como Ativo/Inativo) — sem isso, o padrão é exibir o valor bruto, ou
  // "—" quando vazio/indefinido (mesmo padrão visual já usado em
  // Empresas/DP para "de"/"para").
  function diffCampos(labels, antes, depois, formatadores) {
    const alteracoes = [];
    Object.keys(labels).forEach((chave) => {
      if (antes[chave] === depois[chave]) return;
      const formatar = (formatadores && formatadores[chave]) || function (v) {
        return v === undefined || v === null || v === "" ? "—" : String(v);
      };
      alteracoes.push({ campo: labels[chave], de: formatar(antes[chave]), para: formatar(depois[chave]) });
    });
    return alteracoes;
  }

  global.FiscalHistoricoEventos = {
    getEventosHistoricoFiscal: getEventosHistoricoFiscal,
    registrarEventoHistoricoFiscal: registrarEventoHistoricoFiscal,
    diffCampos: diffCampos,
  };
})(window);
