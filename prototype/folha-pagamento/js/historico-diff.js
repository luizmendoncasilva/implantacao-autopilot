/*
  Diff genérico orientado a schema — Folha de Pagamento (P24, Pacote 3:
  docs/folha-pagamento-fase8-p24-projeto-tecnico-historico-real.md).

  diffArea(snapshotForm, novoForm, schema, ctxExtra) percorre EXCLUSIVAMENTE
  os descritores declarados em `schema` (historico-schemas.js) — nunca
  `Object.keys()` do formulário. Um path que não está no schema nunca é
  comparado, nunca aparece no resultado, mesmo que exista em `novoForm`.

  Tipos de descritor suportados:
  - "scalar": campo simples (string/número/boolean), possivelmente aninhado
    (path com pontos) — cada folha é 1 descritor próprio, não um nó "objeto"
    genérico (ver historico-schemas.js, nota de adaptação da seção 6/9 do
    Pacote 3: o schema é uma LISTA PLANA de descritores por path completo,
    mesma forma já usada em historico-labels.js — não uma árvore separada
    que precisaria ser mantida em sincronia com o mapa de labels).
  - "array-fixo": tabela de linhas fixas (Arredondamento, Contabilidade >
    Opções, Cronograma) — diff por índice, seguro porque a cardinalidade e
    a ordem são fixas (nenhuma UI permite incluir/excluir linha nessas 3
    tabelas). `campo` composto como "<rótulo da linha> — <rótulo da
    coluna>", nunca um índice numérico cru.
  - "array-dinamico": tabela de linhas dinâmicas (Honorários > rubricas) —
    D-1/D3: se o comprimento mudou, 1 único item de resumo (sem célula a
    célula, sem identificador técnico novo); se o comprimento é igual,
    diff célula a célula por índice (seguro só nesse caso).

  Comparação SEMPRE estrita (`===`) — nenhuma coerção `valor || ""`. Valores
  booleanos, `0`, `""`, `null` e `undefined` são preservados exatamente como
  estão em `snapshotForm`/`novoForm`, sem nenhuma camada de tradução: não
  existe, hoje, nenhuma convenção de exibição de booleano/select no
  Histórico (a UI atual de checkbox usa ícone, não texto "Sim/Não" — ver
  `checkboxField()`/`campoView()` em folha-page.js) — inventar uma
  aqui seria decisão de apresentação não tomada. A eventual formatação para
  exibição (eng.: "Sim"/"Não" em vez de `true`/`false`) pertence à camada de
  UI do Histórico (`blocoEventoHistorico()`, já congelada), não a este
  diff — registrado como limitação conhecida no relatório do Pacote 3.

  D-2/E3: `aplicavelEm(form, ctxExtra)` é avaliado apenas sobre `novoForm`
  (estado FINAL, no momento do salvamento) — nunca sobre `snapshotForm`.
  Um campo alterado e depois reocultado na mesma sessão de edição não gera
  alteração, porque `aplicavelEm(novoForm, ...)` já é falso quando o diff
  roda (ver Teste H do relatório do Pacote 3).
*/
(function (global) {
  function getByPath(obj, path) {
    const keys = path.split(".");
    let cur = obj;
    for (let i = 0; i < keys.length; i++) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[keys[i]];
    }
    return cur;
  }

  // Comparação estrita — `false !== ""`, `0 !== ""`, `null !== undefined`
  // são todas diferenças reais. Nenhuma normalização.
  function diferente(antes, depois) {
    return antes !== depois;
  }

  function diffScalar(descritor, snapshotForm, novoForm, ctxExtra, alteracoes) {
    if (descritor.aplicavelEm && !descritor.aplicavelEm(novoForm, ctxExtra)) return;
    const antes = getByPath(snapshotForm, descritor.path);
    const depois = getByPath(novoForm, descritor.path);
    if (diferente(antes, depois)) {
      alteracoes.push({ campo: descritor.label, de: antes, para: depois });
    }
  }

  function diffArrayFixo(descritor, snapshotForm, novoForm, ctxExtra, alteracoes) {
    if (descritor.aplicavelEm && !descritor.aplicavelEm(novoForm, ctxExtra)) return;
    const linhasAntes = getByPath(snapshotForm, descritor.path) || [];
    const linhasDepois = getByPath(novoForm, descritor.path) || [];
    // Cardinalidade e ordem são fixas (mesmo array, mesmo tamanho, mesmas
    // posições sempre) — diff por índice é seguro aqui, e SÓ aqui.
    linhasDepois.forEach((linhaDepois, i) => {
      const linhaAntes = linhasAntes[i];
      if (!linhaAntes) return; // não deveria ocorrer numa tabela de fato fixa
      const rotuloLinha = linhaDepois[descritor.rowLabelKey];
      Object.keys(descritor.colunas).forEach((colKey) => {
        const colDef = descritor.colunas[colKey];
        if (colDef.aplicavelEm && !colDef.aplicavelEm(linhaDepois, novoForm, ctxExtra)) return;
        const antes = linhaAntes[colKey];
        const depois = linhaDepois[colKey];
        if (diferente(antes, depois)) {
          alteracoes.push({ campo: rotuloLinha + " — " + colDef.label, de: antes, para: depois });
        }
      });
    });
  }

  // D-1/D3: resumo de inclusão/exclusão quando o comprimento muda; diff
  // célula a célula por índice SOMENTE quando o comprimento é igual (nesse
  // caso, nenhuma linha foi incluída/excluída na sessão — seguro). Nenhum
  // identificador técnico é introduzido; `honorariosCtx.form.rubricas` não
  // é alterado por este arquivo.
  function diffArrayDinamico(descritor, snapshotForm, novoForm, ctxExtra, alteracoes) {
    if (descritor.aplicavelEm && !descritor.aplicavelEm(novoForm, ctxExtra)) return;
    const antes = getByPath(snapshotForm, descritor.path) || [];
    const depois = getByPath(novoForm, descritor.path) || [];
    if (antes.length !== depois.length) {
      const diferencaQtd = Math.abs(depois.length - antes.length);
      const operacao = depois.length > antes.length ? "incluída(s)" : "excluída(s)";
      alteracoes.push({
        campo: descritor.resumoLabel,
        de: antes.length + " rubrica(s)",
        para: depois.length + " rubrica(s) — " + diferencaQtd + " " + operacao,
      });
      return;
    }
    // Mesmo comprimento: diff célula a célula por índice. Sem rótulo de
    // linha estável (linhas dinâmicas, sem identificador) — "Rubrica N"
    // (posição, 1-based) é usado só como referência de qual linha mudou,
    // não como identidade persistente. Formatação de composição do `campo`
    // (não uma regra de negócio nova): mesmo princípio "<rótulo> — <coluna>"
    // do array-fixo, com o número de posição no lugar do rótulo de linha.
    depois.forEach((linhaDepois, i) => {
      const linhaAntes = antes[i];
      if (!linhaAntes) return;
      Object.keys(descritor.colunas).forEach((colKey) => {
        const colLabel = descritor.colunas[colKey];
        const antesVal = linhaAntes[colKey];
        const depoisVal = linhaDepois[colKey];
        if (diferente(antesVal, depoisVal)) {
          alteracoes.push({ campo: "Rubrica " + (i + 1) + " — " + colLabel, de: antesVal, para: depoisVal });
        }
      });
    });
  }

  // Ponto de entrada único. `schema` é sempre um array de descritores (nunca
  // percorremos `Object.keys(novoForm)` como mecanismo de descoberta — um
  // path fora do schema nunca produz alteração, mesmo que exista no form).
  function diffArea(snapshotForm, novoForm, schema, ctxExtra) {
    const alteracoes = [];
    (schema || []).forEach((descritor) => {
      if (descritor.tipo === "scalar") diffScalar(descritor, snapshotForm, novoForm, ctxExtra, alteracoes);
      else if (descritor.tipo === "array-fixo") diffArrayFixo(descritor, snapshotForm, novoForm, ctxExtra, alteracoes);
      else if (descritor.tipo === "array-dinamico") diffArrayDinamico(descritor, snapshotForm, novoForm, ctxExtra, alteracoes);
    });
    return alteracoes;
  }

  global.FolhaHistoricoDiff = { diffArea, getByPath };
})(window);
