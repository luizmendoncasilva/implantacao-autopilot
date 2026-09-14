/*
  Ações de conciliação de um colaborador (Épico 1) — linha da tabela, drawer
  de comparação Lake × Ficha, modal de linha rejeitada, drawer de
  dependentes e simulação de chegada de Ficha/retorno do eSocial.

  Usado pela aba "Dados do Colaborador" do console por empresa
  (implantacao-console.html) — resolver uma divergência é a MESMA ação não
  importa de onde for aberta (feedback da Andressa/Agrocontar). A antiga
  fila global (implantacao.html, todas as empresas juntas) foi removida —
  implantacao-empresas.html é a única porta de entrada agora.

  Cada página que usa este módulo:
  - inclui a marcação dos drawers/dialogs (#concil-*, #dialog-rejeitado-*,
    #dependentes-*);
  - chama FilaColaborador.setup() uma vez;
  - antes de cada render, chama FilaColaborador.setFilaAtual(ids) com a fila
    de pendentes visível (para o botão "Próximo pendente") e
    FilaColaborador.setOnChange(fn) com a função que deve rodar depois de
    qualquer ação (pra re-renderizar a tabela/cabeçalho da própria página);
  - usa FilaColaborador.rowHtml(colaborador) pra montar cada linha e chama
    FilaColaborador.wireRowEvents() depois de inserir o HTML na página.
*/
(function (global) {
  const D = global.ImplantacaoData;
  const E = global.EmpresasData;

  let filaAtual = []; // ids de colaboradores com divergência, na ordem da tabela atual — para "Próximo pendente"
  let colaboradorAtualId = null;
  let colaboradorAberto = null; // objeto mutado durante a sessão do drawer — precisa ser o mesmo usado para persistir em salvarConciliacao(); buscar de novo em D.getColaboradores() retornaria uma cópia sem as escolhas feitas
  let camposEmEdicaoManual = new Set(); // índices de campos com o input de "digitar manualmente" aberto, reiniciado a cada abertura do drawer
  let onChange = function () {};

  function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  function empresaNome(codigo) {
    const empresa = E.findEmpresaByCodigo(codigo);
    return empresa ? empresa.nome : codigo;
  }

  function encontrarColaborador(id) {
    return D.getColaboradores().find((c) => c.id === id);
  }

  function setFilaAtual(ids) {
    filaAtual = ids;
  }

  function setOnChange(fn) {
    onChange = fn || function () {};
  }

  // ===== Badge de status + linha da tabela =====
  function statusBadge(colaborador) {
    let html;
    if (colaborador.status === "pronto") {
      html = '<span class="badge badge-success">' + Icon("check", "size-3-5") + " Pronto</span>";
    } else if (colaborador.status === "divergencia") {
      const naoResolvidos = D.camposNaoResolvidos(colaborador).length;
      const rotulo = naoResolvidos === 1 && colaborador.camposDivergentes[0].valorLake === null
        ? "1 campo ausente"
        : naoResolvidos + (naoResolvidos === 1 ? " campo divergente" : " campos divergentes");
      html =
        '<span class="badge badge-warning">' + Icon("alert-triangle", "size-3-5") + " Divergência</span>" +
        '<div class="status-cell-hint">' + rotulo + "</div>";
    } else if (colaborador.status === "nao_encontrado_lake") {
      html =
        '<span class="badge badge-info">' + Icon("plus", "size-3-5") + " Novo colaborador</span>" +
        '<div class="status-cell-hint" style="color:var(--info-text);">Não encontrado no Lake</div>';
    } else if (colaborador.status === "rejeitado") {
      html =
        '<span class="badge badge-destructive">' + Icon("circle-x", "size-3-5") + " Rejeitado</span>" +
        '<div class="status-cell-hint" style="color:var(--destructive-text);">linha ' + colaborador.linhaFicha + " da Ficha</div>";
    } else if (colaborador.status === "aguardando_esocial") {
      html =
        '<span class="badge badge-outline">' + Icon("landmark", "size-3-5") + " Aguardando eSocial</span>" +
        '<div class="status-cell-hint" style="color:var(--muted-foreground);">Simular retorno do eSocial</div>';
    } else {
      html =
        '<span class="badge badge-secondary">' + Icon("clock", "size-3-5") + " Pendente conciliação</span>" +
        // Affordance exclusiva do protótipo (não existe no produto real —
        // lá a conciliação roda sozinha quando a Ficha chega, sem clique do
        // operador). Deixa explícito pra não parecer bug de UI real.
        '<div class="status-cell-hint" style="color:var(--muted-foreground);">Simular chegada da Ficha</div>';
    }
    // Pendência cadastral (RF-DP-405) é independente do status principal —
    // pode aparecer até junto de "Pronto" (RN-DP-20: não bloqueia a carga).
    if (colaborador.pendenciasCadastrais && colaborador.pendenciasCadastrais.length) {
      const qtd = colaborador.pendenciasCadastrais.length;
      html += '<div class="status-cell-hint" style="color:var(--muted-foreground);">' + qtd + (qtd === 1 ? " pendência cadastral" : " pendências cadastrais") + "</div>";
    }
    return html;
  }

  // Linhas com drawer de conferência (comparação de campos ou dados da
  // Ficha sem Lake). "rejeitado" é tratado à parte (abre um modal, não o
  // drawer — não há nada para conciliar, só o motivo da rejeição).
  function colaboradorPrecisaDeAcao(colaborador) {
    return colaborador.status === "divergencia" || colaborador.status === "nao_encontrado_lake";
  }

  function rowHtml(colaborador) {
    const abreDrawer = colaboradorPrecisaDeAcao(colaborador);
    const abreRejeicao = colaborador.status === "rejeitado";
    // Pendente conciliação = Lake sem Ficha ainda. Clicar simula a Ficha
    // "chegando" e a conciliação automática de back-end rodando — não abre
    // nada por si só, só dispara simularConciliacaoFicha() (ver comentário
    // lá). Prototipagem: no produto real isso acontece sozinho quando um
    // novo lote de Ficha Financeira é importado, não por clique do operador.
    const simulaConciliacao = colaborador.status === "pendente_conciliacao";
    // Mesma ideia para "aguardando eSocial" — no produto real o retorno do
    // eSocial chega sozinho, sem clique (RF-DP-409).
    const simulaEsocial = colaborador.status === "aguardando_esocial";
    const clicavel = abreDrawer || abreRejeicao || simulaConciliacao || simulaEsocial;
    const dataAttr = abreDrawer
      ? ' data-abrir-concil="' + colaborador.id + '"'
      : abreRejeicao
      ? ' data-abrir-rejeitado="' + colaborador.id + '"'
      : simulaConciliacao
      ? ' data-simular-conciliacao="' + colaborador.id + '"'
      : simulaEsocial
      ? ' data-simular-esocial="' + colaborador.id + '"'
      : "";
    const temDependentes = colaborador.dependentes && colaborador.dependentes.length;
    const dependentesComPendencia = temDependentes ? colaborador.dependentes.filter((d) => d.pendencias && d.pendencias.length).length : 0;
    return (
      "<tr" + (clicavel ? ' class="row-clickable"' + dataAttr : "") + ">" +
      "<td><div class=\"flex flex-col gap-0-5 min-w-0\">" +
      '<span class="text-sm font-medium truncate">' + colaborador.nome + "</span>" +
      '<span class="text-xs text-muted truncate">' + colaborador.cargo + "</span>" +
      (temDependentes
        ? '<button type="button" class="btn-link link-info w-fit" data-abrir-dependentes="' + colaborador.id + '" style="margin-top:2px;">' +
          Icon("users", "size-3-5") + " " + colaborador.dependentes.length + (colaborador.dependentes.length === 1 ? " dependente" : " dependentes") +
          (dependentesComPendencia ? " · " + dependentesComPendencia + " c/ pendência" : "") +
          "</button>"
        : "") +
      "</div></td>" +
      '<td class="col-pad-md font-mono">' + colaborador.cpf + "</td>" +
      '<td class="col-pad-md">' + statusBadge(colaborador) + "</td>" +
      '<td class="col-pad-end">' +
      (clicavel
        ? Icon("arrow-right", "size-4")
        : colaborador.status === "pronto"
        ? '<button type="button" class="btn-icon-chev" data-visualizar-colaborador="' + colaborador.id + '" aria-label="Visualizar" title="Visualizar ficha completa">' + Icon("arrow-up-right", "size-4") + "</button>"
        : "") +
      "</td>" +
      "</tr>"
    );
  }

  function wireRowEvents() {
    document.querySelectorAll("[data-abrir-concil]").forEach((el) => {
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("click", () => abrirDrawerConcil(Number(el.getAttribute("data-abrir-concil"))));
      el.addEventListener("keydown", (e) => {
        if (e.target !== el) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirDrawerConcil(Number(el.getAttribute("data-abrir-concil")));
        }
      });
    });
    document.querySelectorAll("[data-abrir-rejeitado]").forEach((el) => {
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("click", () => abrirModalRejeitado(Number(el.getAttribute("data-abrir-rejeitado"))));
      el.addEventListener("keydown", (e) => {
        if (e.target !== el) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirModalRejeitado(Number(el.getAttribute("data-abrir-rejeitado")));
        }
      });
    });
    document.querySelectorAll("[data-simular-conciliacao]").forEach((el) => {
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("click", () => simularConciliacaoFicha(Number(el.getAttribute("data-simular-conciliacao"))));
      el.addEventListener("keydown", (e) => {
        if (e.target !== el) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          simularConciliacaoFicha(Number(el.getAttribute("data-simular-conciliacao")));
        }
      });
    });
    document.querySelectorAll("[data-simular-esocial]").forEach((el) => {
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("click", () => simularRetornoEsocial(Number(el.getAttribute("data-simular-esocial"))));
      el.addEventListener("keydown", (e) => {
        if (e.target !== el) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          simularRetornoEsocial(Number(el.getAttribute("data-simular-esocial")));
        }
      });
    });
    // Botão de dependentes fica dentro de uma linha que pode ela mesma ser
    // clicável (abrir drawer/rejeição/simulação) — precisa parar a
    // propagação pra não disparar as duas ações no mesmo clique.
    document.querySelectorAll("[data-abrir-dependentes]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        abrirDrawerDependentes(Number(el.getAttribute("data-abrir-dependentes")));
      });
    });
    document.querySelectorAll("[data-visualizar-colaborador]").forEach((el) => {
      el.addEventListener("click", () => global.VisualizarColaborador.open(el.getAttribute("data-visualizar-colaborador"), onChange));
    });
  }

  // ===== Modal — linha rejeitada (RF-DP-402/403) =====
  // Corrige o campo inválido ali mesmo e reprocessa só a linha (RF-DP-408) —
  // continua dialog, não drawer: só informação + uma correção pontual, sem
  // comparação de campos.
  let colaboradorRejeitadoId = null;

  const RAZOES_CAMPO_INVALIDO = {
    cpf: { rotulo: "CPF", validar: (v) => D.validarCpf(v) },
    nome: { rotulo: "Nome completo", validar: (v) => D.validarNome(v) },
  };

  function abrirModalRejeitado(id) {
    const colaborador = encontrarColaborador(id);
    if (!colaborador) return;
    colaboradorRejeitadoId = id;
    document.getElementById("dialog-rejeitado-nome").textContent = colaborador.nome + " · CPF " + colaborador.cpf;
    document.getElementById("dialog-rejeitado-motivo").textContent = colaborador.motivoRejeicao || "Motivo não informado.";
    document.getElementById("dialog-rejeitado-linha").textContent = "Linha " + colaborador.linhaFicha + " da Ficha Financeira — " + empresaNome(colaborador.empresaCodigo);

    const def = RAZOES_CAMPO_INVALIDO[colaborador.campoInvalido];
    document.getElementById("dialog-rejeitado-label").textContent = (def ? def.rotulo : "Valor") + " extraído — corrija antes de reprocessar";
    const input = document.getElementById("dialog-rejeitado-input");
    input.value = colaborador.valorExtraido || "";
    input.setAttribute("aria-invalid", "false");
    document.getElementById("dialog-rejeitado-erro").style.display = "none";
    document.getElementById("btn-rejeitado-reprocessar").disabled = true;
    UI.openDialog(document.getElementById("dialog-rejeitado"));
    input.focus();
  }

  function validarCampoRejeitado() {
    const colaborador = encontrarColaborador(colaboradorRejeitadoId);
    const def = colaborador && RAZOES_CAMPO_INVALIDO[colaborador.campoInvalido];
    const input = document.getElementById("dialog-rejeitado-input");
    const valido = def ? def.validar(input.value) : false;
    input.setAttribute("aria-invalid", String(!valido && input.value.trim() !== ""));
    document.getElementById("dialog-rejeitado-erro").style.display = !valido && input.value.trim() !== "" ? "" : "none";
    document.getElementById("btn-rejeitado-reprocessar").disabled = !valido;
    return valido;
  }

  // Ao corrigir com sucesso, a linha é reprocessada: se a conciliação contra
  // o Lake não encontra mais nenhum problema, vira "pendente_conciliacao"
  // (aguardando o mesmo ciclo automático de qualquer colaborador); se aponta
  // divergência de verdade (mock: `camposDivergentes` pré-carregado), vai
  // direto para "divergencia" e o próprio drawer de conferência já abre —
  // não faz sentido corrigir o motivo da rejeição e deixar o operador
  // procurar de novo na tabela se sobrou outra coisa para resolver.
  function salvarCorrecaoRejeitado() {
    if (!validarCampoRejeitado()) return;
    const colaborador = encontrarColaborador(colaboradorRejeitadoId);
    if (!colaborador) return;
    const valorCorrigido = document.getElementById("dialog-rejeitado-input").value.trim();
    colaborador[colaborador.campoInvalido] = valorCorrigido;
    const encontrouDivergencia = colaborador.camposDivergentes && colaborador.camposDivergentes.length > 0;
    colaborador.status = encontrouDivergencia ? "divergencia" : "pendente_conciliacao";
    const colaboradores = D.getColaboradores().map((c) => (c.id === colaborador.id ? colaborador : c));
    D.setColaboradores(colaboradores);
    UI.closeDialog(document.getElementById("dialog-rejeitado"));
    onChange();
    if (encontrouDivergencia) {
      UI.showToast("Linha reprocessada", colaborador.nome + " foi conciliado com o Lake, mas ainda tem divergência pendente.", "info");
      abrirDrawerConcil(colaborador.id);
    } else {
      UI.showToast("Linha reprocessada", colaborador.nome + " entrou na fila de conciliação com o Lake.");
    }
  }

  // ===== Simular chegada da Ficha Financeira (só protótipo) =====
  // "pendente_conciliacao" é o estado antes de qualquer Ficha existir para o
  // colaborador — no produto real, a conciliação contra o Lake roda sozinha
  // em back-end assim que um lote de Ficha é importado. Como este protótipo
  // não tem back-end de verdade, este clique simula esse instante: se havia
  // divergência preparada no mock, ela aparece agora; senão, o colaborador
  // já sai conciliado como "Pronto".
  function simularConciliacaoFicha(id) {
    const colaborador = encontrarColaborador(id);
    if (!colaborador) return;
    const encontrouDivergencia = colaborador.camposDivergentes && colaborador.camposDivergentes.length > 0;
    colaborador.status = encontrouDivergencia ? "divergencia" : "pronto";
    const colaboradores = D.getColaboradores().map((c) => (c.id === colaborador.id ? colaborador : c));
    D.setColaboradores(colaboradores);
    onChange();
    if (encontrouDivergencia) {
      UI.showToast("Ficha Financeira conciliada", colaborador.nome + " tem divergência com o Lake — confira abaixo.", "info");
      abrirDrawerConcil(colaborador.id);
    } else {
      UI.showToast("Ficha Financeira conciliada", colaborador.nome + " está pronto — nenhuma divergência encontrada.");
    }
  }

  // ===== Simular retorno do eSocial (RF-DP-401/409) — só protótipo =====
  // Categoria resolvida, o colaborador volta ao fluxo normal: entra em
  // "pendente_conciliacao" aguardando a Ficha Financeira, como qualquer
  // outro colaborador recém-carregado.
  function simularRetornoEsocial(id) {
    const colaborador = encontrarColaborador(id);
    if (!colaborador) return;
    const categoria = colaborador.categoriaEsocial || "Empregado — CLT";
    colaborador.status = "pendente_conciliacao";
    const colaboradores = D.getColaboradores().map((c) => (c.id === colaborador.id ? colaborador : c));
    D.setColaboradores(colaboradores);
    onChange();
    UI.showToast("eSocial retornou a categoria", colaborador.nome + ": " + categoria + " — entrou na fila aguardando a Ficha Financeira.");
  }

  // ===== Drawer de dependentes (RF-DP-406) — sufixo próprio pra não colidir
  // com o drawer principal de conferência. Cada dependente pode ter uma
  // pendência de complemento; "Marcar como completo" é a única ação — sem
  // comparação de campo, por isso não reaproveita field-compare. =====
  function dependenteRowHtml(dependente, indice) {
    const pendente = dependente.pendencias && dependente.pendencias.length > 0;
    return (
      '<div class="list-row" style="align-items:flex-start;">' +
      '<div class="flex flex-col gap-0-5 min-w-0">' +
      '<span class="text-sm font-medium truncate">' + escapeHtml(dependente.nome) + "</span>" +
      '<span class="text-xs text-muted">' + escapeHtml(dependente.parentesco) + " · CPF " + escapeHtml(dependente.cpf) + " · nasc. " + escapeHtml(dependente.dataNascimento) + "</span>" +
      (pendente
        ? '<span class="text-xs" style="color:var(--warning-text);">' + dependente.pendencias.map(escapeHtml).join(" · ") + "</span>"
        : '<span class="text-xs" style="color:var(--success-text);">Completo</span>') +
      "</div>" +
      (pendente
        ? '<button type="button" class="btn-link link-info shrink-0" data-resolver-dependente="' + indice + '">Marcar como completo</button>'
        : "") +
      "</div>"
    );
  }

  function renderDependentes(colaborador) {
    document.getElementById("dependentes-nome").textContent = colaborador.nome + " · " + empresaNome(colaborador.empresaCodigo);
    const lista = document.getElementById("dependentes-lista");
    lista.innerHTML = colaborador.dependentes.map((d, i) => dependenteRowHtml(d, i)).join("");
    lista.querySelectorAll("[data-resolver-dependente]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const indice = Number(btn.getAttribute("data-resolver-dependente"));
        colaborador.dependentes[indice].pendencias = [];
        const colaboradores = D.getColaboradores().map((c) => (c.id === colaborador.id ? colaborador : c));
        D.setColaboradores(colaboradores);
        renderDependentes(colaborador);
        onChange();
      });
    });
  }

  function abrirDrawerDependentes(id) {
    const colaborador = encontrarColaborador(id);
    if (!colaborador || !colaborador.dependentes) return;
    renderDependentes(colaborador);
    UI.openSheet(document.getElementById("dependentes-overlay"), document.getElementById("dependentes-panel"));
  }

  function fecharDrawerDependentes() {
    UI.closeSheet(document.getElementById("dependentes-overlay"), document.getElementById("dependentes-panel"));
  }

  // ===== Drawer de Conferência (Concil) =====
  function fieldCompareHtml(colaborador, campo, indice) {
    const lakeVazio = campo.valorLake === null || campo.valorLake === undefined;
    const fichaVazia = campo.valorFicha === null || campo.valorFicha === undefined;
    function optionHtml(origem, valor, vazio) {
      const selecionado = campo.valorEscolhido === origem;
      return (
        '<div class="field-compare-option' + (selecionado ? " is-selected" : "") + '" data-origem="' + origem + '" data-campo="' + indice + '">' +
        '<div class="field-compare-option-src">' + (origem === "lake" ? "Lake (Domínio)" : "Ficha Financeira") + "</div>" +
        '<div class="field-compare-option-val' + (vazio ? " is-missing" : "") + '">' + (vazio ? "Não informado" : valor) + "</div>" +
        '<div class="field-compare-check">' + Icon("check", "size-3-5") + "</div>" +
        "</div>"
      );
    }

    // Terceiro caminho — nem Lake nem Ficha Financeira têm o valor correto
    // (os dois desatualizados, por exemplo): a pessoa digita o valor à mão.
    // Três estados possíveis: link para abrir, input aberto para digitar, ou
    // o valor já digitado (mesmo cartão "selecionado" dos dois de cima, só
    // ocupando a largura inteira).
    function manualHtml() {
      if (campo.valorEscolhido === "manual") {
        return (
          '<div class="field-compare-option field-compare-option-wide is-selected" data-campo="' + indice + '">' +
          '<div class="field-compare-option-src">Digitado manualmente</div>' +
          '<div class="field-compare-option-val">' + escapeHtml(campo.valorManual) + "</div>" +
          '<div class="field-compare-check">' + Icon("check", "size-3-5") + "</div>" +
          "</div>" +
          '<div class="field-compare-manual-toggle">' +
          '<button type="button" class="btn-link link-info" data-editar-manual="' + indice + '">Alterar valor digitado</button>' +
          "</div>"
        );
      }
      if (camposEmEdicaoManual.has(indice)) {
        return (
          '<div class="field-compare-manual-edit">' +
          '<input type="text" class="field-input" data-manual-input="' + indice + '" placeholder="Digite o valor correto" value="' + escapeHtml(campo.valorManual || "") + '" />' +
          '<button type="button" class="btn btn-sm" data-usar-manual="' + indice + '">Usar este valor</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-cancelar-manual="' + indice + '">Cancelar</button>' +
          "</div>"
        );
      }
      return (
        '<div class="field-compare-manual-toggle">' +
        '<button type="button" class="btn-link link-info" data-abrir-manual="' + indice + '">Nenhum dos dois está correto? Digitar valor manualmente</button>' +
        "</div>"
      );
    }

    return (
      '<div class="field-compare' + (campo.resolvido ? " is-resolved" : "") + '" data-field-compare="' + indice + '">' +
      '<div class="field-compare-head">' + campo.campo + "</div>" +
      '<div class="field-compare-options">' +
      optionHtml("lake", campo.valorLake, lakeVazio) +
      optionHtml("ficha", campo.valorFicha, fichaVazia) +
      "</div>" +
      manualHtml() +
      "</div>"
    );
  }

  // Linha que passou pelo Modal de Rejeição antes de chegar aqui — o
  // registro guarda motivoRejeicao/campoInvalido/valorExtraido mesmo depois
  // de corrigido (nunca são apagados), então dá pra reconstruir esse
  // contexto sem precisar de um campo "veio de rejeição" à parte.
  function avisoRejeicaoAnteriorHtml(colaborador) {
    if (!colaborador.motivoRejeicao) return "";
    const def = { cpf: "CPF", nome: "Nome completo" }[colaborador.campoInvalido] || "Campo";
    return (
      '<div class="alert alert-info">' + Icon("info", "size-4") +
      '<div class="alert-desc"><b>Esta linha tinha sido rejeitada na importação.</b> ' + escapeHtml(colaborador.motivoRejeicao) +
      " Corrigido — " + def + " atual: <b>" + escapeHtml(colaborador[colaborador.campoInvalido]) + "</b>.</div></div>"
    );
  }

  // RF-DP-410 — conferência extra contra o eSocial: só um alerta, não é
  // resolvido aqui (não há botão de escolha) porque essa checagem nunca
  // sobrescreve o cadastro, é tratada à parte pela Implantação.
  function esocialDeltaHtml(colaborador) {
    if (!colaborador.esocialDelta) return "";
    const d = colaborador.esocialDelta;
    return (
      '<div class="alert alert-warning">' + Icon("landmark", "size-4") +
      '<div class="alert-desc"><b>Conferência com o eSocial — só checagem, não sobrescreve.</b> ' +
      "Campo <b>" + escapeHtml(d.campo) + "</b>: Autopilot está com <b>" + escapeHtml(d.valorAutopilot) + "</b>, eSocial tem <b>" + escapeHtml(d.valorEsocial) + "</b>. Trate na origem ou registre ciência.</div></div>"
    );
  }

  function renderCampos(colaborador) {
    document.getElementById("concil-campos").innerHTML =
      avisoRejeicaoAnteriorHtml(colaborador) +
      colaborador.camposDivergentes.map((c, i) => fieldCompareHtml(colaborador, c, i)).join("") +
      esocialDeltaHtml(colaborador);
    wireFieldCompareEvents(colaborador);
  }

  function wireFieldCompareEvents(colaborador) {
    document.querySelectorAll("[data-field-compare]").forEach((bloco) => {
      const indice = Number(bloco.getAttribute("data-field-compare"));
      const campo = colaborador.camposDivergentes[indice];

      bloco.querySelectorAll(".field-compare-option[data-origem]").forEach((opt) => {
        opt.addEventListener("click", () => {
          campo.valorEscolhido = opt.getAttribute("data-origem");
          campo.resolvido = true;
          camposEmEdicaoManual.delete(indice);
          renderCampos(colaborador);
          atualizarResumo(colaborador);
        });
      });

      const btnAbrirManual = bloco.querySelector("[data-abrir-manual]");
      if (btnAbrirManual) {
        btnAbrirManual.addEventListener("click", () => {
          camposEmEdicaoManual.add(indice);
          renderCampos(colaborador);
        });
      }
      const btnEditarManual = bloco.querySelector("[data-editar-manual]");
      if (btnEditarManual) {
        btnEditarManual.addEventListener("click", () => {
          camposEmEdicaoManual.add(indice);
          renderCampos(colaborador);
        });
      }
      const btnCancelarManual = bloco.querySelector("[data-cancelar-manual]");
      if (btnCancelarManual) {
        btnCancelarManual.addEventListener("click", () => {
          camposEmEdicaoManual.delete(indice);
          renderCampos(colaborador);
        });
      }
      const btnUsarManual = bloco.querySelector("[data-usar-manual]");
      if (btnUsarManual) {
        btnUsarManual.addEventListener("click", () => {
          const input = bloco.querySelector("[data-manual-input]");
          const valor = input.value.trim();
          if (!valor) return;
          campo.valorManual = valor;
          campo.valorEscolhido = "manual";
          campo.resolvido = true;
          camposEmEdicaoManual.delete(indice);
          renderCampos(colaborador);
          atualizarResumo(colaborador);
        });
      }
    });
  }

  function atualizarResumo(colaborador) {
    const naoResolvidos = D.camposNaoResolvidos(colaborador).length;
    document.getElementById("concil-resumo-texto").innerHTML =
      naoResolvidos === 0
        ? "<b>Todos os campos foram resolvidos.</b> Ao salvar, este colaborador passa para o status Pronto."
        : "<b>" + naoResolvidos + (naoResolvidos === 1 ? " campo divergente" : " campos divergentes") + " entre o Lake e a Ficha Financeira.</b> Escolha, campo a campo, qual valor está correto. Os campos sem divergência não aparecem aqui.";
  }

  // Alterna a cor/ícone do alerta de resumo e quais botões do rodapé
  // aparecem, conforme o tipo de conteúdo do drawer. "divergencia" é o
  // padrão (comparação de campos); "novo" é o caminho do colaborador achado
  // na Ficha mas sem correspondência no Lake.
  function configurarDrawerParaTipo(tipo) {
    const alerta = document.getElementById("concil-resumo");
    alerta.classList.toggle("alert-warning", tipo !== "novo");
    alerta.classList.toggle("alert-info", tipo === "novo");
    document.getElementById("icon-concil-resumo").innerHTML = Icon(tipo === "novo" ? "plus" : "alert-triangle", "size-4");
    document.getElementById("concil-salvar").style.display = tipo === "novo" ? "none" : "";
    document.getElementById("concil-ignorar").style.display = tipo === "novo" ? "" : "none";
    document.getElementById("concil-criar").style.display = tipo === "novo" ? "" : "none";
  }

  // ===== Conteúdo do drawer para status "nao_encontrado_lake" — sem
  // contraparte do Lake para comparar, só os dados extraídos da própria
  // Ficha Financeira (somente leitura, reaproveitando .detail-grid) e a
  // decisão de criar o cadastro ou deixar pendente. =====
  function renderNovoSemLake(colaborador) {
    configurarDrawerParaTipo("novo");
    document.getElementById("concil-resumo-texto").innerHTML =
      "<b>Colaborador não encontrado no Lake (Domínio).</b> A Ficha Financeira trouxe os dados abaixo, mas não existe cadastro correspondente desta empresa no Lake — pode ser uma admissão recente ainda não sincronizada.";

    const campos = colaborador.dadosFicha || {};
    const linhas = Object.keys(campos)
      .map((rotulo) => '<div class="detail-field"><span class="detail-field-label">' + rotulo + '</span><div class="detail-field-value">' + escapeHtml(String(campos[rotulo])) + "</div></div>")
      .join("");
    document.getElementById("concil-campos").innerHTML =
      '<div class="detail-section"><h3 class="detail-section-title">Dados extraídos da Ficha Financeira</h3><div class="detail-grid">' + linhas + "</div></div>";
  }

  function atualizarFila() {
    const restantes = filaAtual.filter((id) => id !== colaboradorAtualId);
    document.getElementById("concil-fila-texto").textContent = restantes.length + (restantes.length === 1 ? " pendente na fila" : " pendentes na fila");
    document.getElementById("concil-proximo").style.display = restantes.length === 0 ? "none" : "";
  }

  function abrirDrawerConcil(id) {
    const colaborador = encontrarColaborador(id);
    if (!colaborador) return;
    colaboradorAtualId = id;
    colaboradorAberto = colaborador;
    camposEmEdicaoManual.clear();
    document.getElementById("concil-avatar").textContent = D.iniciais(colaborador.nome);
    document.getElementById("concil-title").textContent = colaborador.nome;
    document.getElementById("concil-sub").textContent = empresaNome(colaborador.empresaCodigo) + " · CPF " + colaborador.cpf;

    if (colaborador.status === "nao_encontrado_lake") {
      renderNovoSemLake(colaborador);
    } else {
      configurarDrawerParaTipo("divergencia");
      renderCampos(colaborador);
      atualizarResumo(colaborador);
    }
    atualizarFila();
    UI.openSheet(document.getElementById("concil-overlay"), document.getElementById("concil-panel"));
  }

  function fecharDrawerConcil() {
    UI.closeSheet(document.getElementById("concil-overlay"), document.getElementById("concil-panel"));
    colaboradorAtualId = null;
    colaboradorAberto = null;
  }

  // Regra de negócio a confirmar com engenharia (ver handoff, seção 7): ao
  // fechar sem resolver todos os campos, a conciliação salva parcialmente
  // (as escolhas já feitas ficam guardadas no colaborador), mas a linha
  // continua como Divergência até todos os campos serem resolvidos.
  function salvarConciliacao() {
    if (!colaboradorAberto) return;
    const todosResolvidos = D.camposNaoResolvidos(colaboradorAberto).length === 0;
    colaboradorAberto.status = todosResolvidos ? "pronto" : "divergencia";
    // Persiste o próprio objeto mutado (com as escolhas de campo já feitas),
    // não uma cópia recém-lida do storage — ver comentário de
    // `colaboradorAberto` acima.
    const nomeAtualizado = colaboradorAberto.nome;
    const colaboradores = D.getColaboradores().map((c) => (c.id === colaboradorAberto.id ? colaboradorAberto : c));
    D.setColaboradores(colaboradores);
    fecharDrawerConcil();
    onChange();
    UI.showToast(
      todosResolvidos ? "Conciliação concluída" : "Conciliação salva parcialmente",
      todosResolvidos ? nomeAtualizado + " está pronto." : "Os campos escolhidos foram salvos; ainda há divergências pendentes."
    );
  }

  // ===== Ações do colaborador "nao_encontrado_lake" =====
  function criarColaboradorSemLake() {
    if (!colaboradorAberto) return;
    colaboradorAberto.status = "pronto";
    const nome = colaboradorAberto.nome;
    const colaboradores = D.getColaboradores().map((c) => (c.id === colaboradorAberto.id ? colaboradorAberto : c));
    D.setColaboradores(colaboradores);
    fecharDrawerConcil();
    onChange();
    UI.showToast("Colaborador criado", nome + " foi cadastrado no Autopilot a partir da Ficha Financeira.");
  }

  function ignorarNovoSemLake() {
    // Não muda nada no colaborador — ele continua "nao_encontrado_lake" e
    // disponível na fila para revisão posterior.
    fecharDrawerConcil();
  }

  function irParaProximoPendente() {
    const proximoId = filaAtual.find((id) => id !== colaboradorAtualId);
    if (proximoId === undefined) return;
    abrirDrawerConcil(proximoId);
  }

  function setup() {
    document.getElementById("concil-close").addEventListener("click", fecharDrawerConcil);
    document.getElementById("concil-overlay").addEventListener("click", fecharDrawerConcil);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.getElementById("concil-panel").classList.contains("is-open")) fecharDrawerConcil();
    });
    document.getElementById("concil-salvar").addEventListener("click", salvarConciliacao);
    document.getElementById("concil-criar").addEventListener("click", criarColaboradorSemLake);
    document.getElementById("concil-ignorar").addEventListener("click", ignorarNovoSemLake);
    document.getElementById("concil-proximo").addEventListener("click", irParaProximoPendente);

    document.querySelectorAll("[data-close-dialog]").forEach((el) => {
      el.addEventListener("click", () => UI.closeDialog(document.getElementById(el.getAttribute("data-close-dialog"))));
    });
    document.querySelectorAll(".dialog-overlay").forEach((dlgOverlay) => {
      dlgOverlay.addEventListener("click", (e) => {
        if (e.target === dlgOverlay) UI.closeDialog(dlgOverlay);
      });
    });
    document.getElementById("dialog-rejeitado-input").addEventListener("input", validarCampoRejeitado);
    document.getElementById("btn-rejeitado-reprocessar").addEventListener("click", salvarCorrecaoRejeitado);

    const dependentesOverlay = document.getElementById("dependentes-overlay");
    const dependentesPanel = document.getElementById("dependentes-panel");
    document.getElementById("dependentes-close").addEventListener("click", fecharDrawerDependentes);
    dependentesOverlay.addEventListener("click", fecharDrawerDependentes);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dependentesPanel.classList.contains("is-open")) fecharDrawerDependentes();
    });
  }

  global.FilaColaborador = {
    statusBadge,
    colaboradorPrecisaDeAcao,
    rowHtml,
    wireRowEvents,
    setFilaAtual,
    setOnChange,
    setup,
  };
})(window);
