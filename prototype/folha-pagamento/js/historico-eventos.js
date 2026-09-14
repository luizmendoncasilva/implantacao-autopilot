/*
  Infraestrutura de eventos reais do Histórico — Folha de Pagamento (P24,
  Pacote 1: docs/folha-pagamento-fase8-p24-projeto-tecnico-historico-real.md).

  Namespace próprio (FolhaHistoricoEventos), separado de FolhaData (data.js)
  por decisão do projeto técnico — data.js só delega para cá (seção 8/Decisão
  2 da Rev. 3), não contém nenhuma lógica de persistência ou de D-6.

  Mesmo padrão de persistência já usado em prototype/empresas/js/data.js
  (registrarEventoHistorico/getHistoricoAlteracoes): localStorage namespaced
  por empresa, eventos mais recentes primeiro (unshift), try/catch defensivo
  em toda leitura/escrita. NÃO é uma auditoria real (sem backend, sem
  autenticação) — é a mesma simulação de auditoria já usada em Empresas,
  aplicada à Folha.

  Neste pacote (Pacote 1), estas funções são criadas e testadas
  isoladamente. Nenhum handler de "Salvar" as chama ainda — essa integração
  pertence exclusivamente ao Pacote 5 (confirmarSalvamentoCtx()/handler de
  Geral), conforme D-8.
*/
(function (global) {
  const HISTORICO_EVENTOS_KEY = "autopilot_folha_historico_eventos_v1";

  // Usuário fixo do protótipo — MESMO valor e MESMO papel já usados em
  // prototype/empresas/js/data.js (HISTORICO_USUARIO_PROTOTIPO) e exibidos
  // no rodapé da sidebar (prototype/shared/js/shell.js, sidebar-user). Não é
  // um segundo usuário fictício: não há como importar a constante de
  // empresas/js/data.js (não é exposta em EmpresasData), então o mesmo
  // valor é replicado aqui, como já ocorre entre empresas/js/data.js e
  // shared/js/shell.js hoje.
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
      // empresas/js/data.js.
      return {};
    }
  }

  // Lê somente os eventos reais (registrados nesta infraestrutura) de uma
  // empresa — nunca os mocks. Array vazio quando não houver eventos, quando
  // a empresa não tiver entrada, ou quando o conteúdo estiver ausente/
  // corrompido.
  function getEventosReais(codigoEmpresa) {
    if (!codigoEmpresa) return [];
    const salvos = getEventosSalvos();
    const eventos = salvos[codigoEmpresa];
    return Array.isArray(eventos) ? eventos : [];
  }

  // Cria e persiste 1 evento real. Formato idêntico ao já usado pelos mocks
  // do Histórico (FolhaData.HISTORICO_MOCKS_POR_EMPRESA) — nenhum campo novo
  // é introduzido. `acao` é sempre "Atualização de parâmetros" (D-7 — única
  // ação efetiva neste pacote/nesta implementação).
  function registrarEventoHistoricoFolha(codigoEmpresa, area, alteracoes) {
    if (!codigoEmpresa) return;
    const agora = new Date();
    const evento = {
      id: codigoEmpresa + "-" + agora.getTime(),
      data: pad2(agora.getDate()) + "/" + pad2(agora.getMonth() + 1) + "/" + agora.getFullYear(),
      hora: pad2(agora.getHours()) + ":" + pad2(agora.getMinutes()),
      usuario: HISTORICO_USUARIO_PROTOTIPO,
      area: area,
      acao: "Atualização de parâmetros",
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
      // renderização, mesmo critério defensivo já usado em
      // empresas/js/data.js. Não lança exceção para a aplicação.
    }
    return evento;
  }

  // Decisão D-6 (Rev. 2/3): por empresa, havendo ao menos 1 evento real, a
  // listagem usa SOMENTE eventos reais (mocks somem para aquela empresa);
  // sem evento real, mostra os mocks (comportamento atual, inalterado).
  // Nunca concatena mocks + reais. `mocksPorEmpresa` é passado pelo chamador
  // (data.js) — esta função nunca lê nem altera os mocks diretamente.
  function getHistoricoEventosFolha(empresa, mocksPorEmpresa) {
    const codigo = empresa && empresa.codigo;
    if (!codigo) return [];
    const eventosReais = getEventosReais(codigo);
    if (eventosReais.length) return eventosReais;
    return (mocksPorEmpresa && mocksPorEmpresa[codigo]) || [];
  }

  global.FolhaHistoricoEventos = {
    getEventosReais,
    registrarEventoHistoricoFolha,
    getHistoricoEventosFolha,
  };
})(window);
