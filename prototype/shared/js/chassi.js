/*
  Peças do chassi do Cockpit (novo-chassi-v1, prototype-cockpit-evolucoes),
  sem o BSamurai. Shell.mount() chama Chassi.mount(); a sidebar chama
  Chassi.wireSino(). Decisões herdadas de lá (NOTAS.md do chassi):

  - Busca: lupa, não campo aberto; sugestões enquanto digita, agrupadas em
    módulos (clientes, tarefas, solicitações, documentos); uma linha, um clique;
    cliente abre na gaveta, o resto navega; Enter leva aos resultados.
  - Usuário mora na topbar, não na sidebar.
  - Gaveta única na direita (380px) que EMPURRA o conteúdo em vez de cobrir,
    com as caras "cliente" e "tarefas do cliente". Sem seta de expandir.
  - Sino de atividades na sidebar, com o painel ancorado nele e "Ver todas".
  - Nada aqui executa trabalho: o que levaria a outra tela abre o modal
    "Pra onde você iria".
*/
(function (global) {
  const CD = global.ChassiDados;
  const LIDAS_KEY = "autopilot_prototype_chassi_atividades_lidas_v1";
  const GAVETA_MS = 200;

  let base = "";
  let conteudoGaveta = null; // { tipo: "cliente" | "tarefas", id }
  let termoFicha = "";

  function esc(texto) {
    return String(texto === null || texto === undefined ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fechaAoClicarFora(caixa, fechar) {
    document.addEventListener("mousedown", (e) => {
      if (!caixa.contains(e.target)) fechar();
    });
  }

  // ===== Modal de destino =====
  function garantirDestino() {
    if (document.getElementById("chassi-destino")) return;
    const el = document.createElement("div");
    el.className = "dialog-overlay";
    el.id = "chassi-destino";
    el.innerHTML =
      '<div class="dialog-content" role="dialog" aria-modal="true" aria-labelledby="chassi-destino-titulo" style="max-width:420px;">' +
      '<div class="flex flex-col gap-1"><h2 class="dialog-title" id="chassi-destino-titulo">Pra onde você iria</h2>' +
      '<p class="dialog-description" id="chassi-destino-texto"></p></div>' +
      '<div class="dialog-footer"><button type="button" class="btn" id="chassi-destino-ok">Entendi</button></div></div>';
    document.body.appendChild(el);
    const fechar = () => el.classList.remove("is-open");
    el.addEventListener("click", (e) => {
      if (e.target === el) fechar();
    });
    el.querySelector("#chassi-destino-ok").addEventListener("click", fechar);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && el.classList.contains("is-open")) fechar();
    });
  }

  function abrirDestino(texto) {
    garantirDestino();
    document.getElementById("chassi-destino-texto").textContent = texto;
    document.getElementById("chassi-destino").classList.add("is-open");
    document.getElementById("chassi-destino-ok").focus();
  }

  // ===== Busca global (lupa) =====
  function casa(texto, termo) {
    return String(texto || "").toLowerCase().includes(termo);
  }

  function montarModulos(bruto) {
    const t = bruto.trim().toLowerCase();
    if (!t) return [];
    const digitos = t.replace(/\D/g, "");
    const clientes = CD.CLIENTES.filter((c) => casa(c.nome, t) || casa(c.cnpj, t) || (digitos.length >= 3 && c.cnpj.replace(/\D/g, "").includes(digitos)));
    const tarefas = CD.TAREFAS.filter((x) => casa(x.titulo, t) || casa(x.id, t) || clientes.some((c) => c.id === x.clienteId));
    const dono = clientes[0] || (tarefas.length && tarefas.every((x) => x.clienteId === tarefas[0].clienteId) ? CD.cliente(tarefas[0].clienteId) : null);
    const nomeCurto = (id) => CD.cliente(id).nome.split(" ").slice(0, 2).join(" ");
    const modulos = [];
    if (clientes.length) {
      modulos.push({ rotulo: "Clientes", itens: clientes.map((c) => ({ titulo: c.nome, detalhe: c.cnpj, acao: () => abrirCliente(c.id) })) });
    }
    if (tarefas.length) {
      modulos.push({
        rotulo: "Tarefas",
        itens: tarefas.slice(0, 3).map((x) => ({ titulo: x.titulo, detalhe: x.id + " · " + nomeCurto(x.clienteId), acao: () => abrirDestino("Abriria a tarefa " + x.id + " · " + x.titulo + ".") })),
        rodape: dono ? { texto: "Ver as " + CD.TAREFAS.filter((x) => x.clienteId === dono.id).length + " tarefas deste cliente", acao: () => abrirTarefas(dono.id) } : null,
      });
    }
    [
      { rotulo: "Solicitações", lista: CD.SOLICITACOES, destino: "a solicitação" },
      { rotulo: "Documentos", lista: CD.DOCUMENTOS, destino: "o documento" },
    ].forEach((g) => {
      const itens = g.lista.filter((r) => casa(r.titulo, t) || casa(r.detalhe, t) || clientes.some((c) => c.id === r.clienteId));
      if (itens.length) modulos.push({ rotulo: g.rotulo, itens: itens.map((r) => ({ titulo: r.titulo, detalhe: r.detalhe, acao: () => abrirDestino("Abriria " + g.destino + " " + r.id + " · " + r.titulo + ".") })) });
    });
    return modulos;
  }

  function buscaHtml() {
    return (
      '<div class="chassi-busca" id="chassi-busca">' +
      '<button type="button" class="chassi-icon-btn" id="chassi-busca-btn" aria-label="Buscar" title="Buscar" aria-expanded="false">' + Icon("search", "size-4") + "</button>" +
      '<div class="chassi-popover chassi-busca-panel" id="chassi-busca-panel" role="dialog" aria-label="Busca">' +
      '<div class="chassi-busca-campo">' + Icon("search", "size-3-5") +
      '<input type="text" id="chassi-busca-input" placeholder="Cliente, CNPJ, tarefa, documento…" autocomplete="off" aria-label="Buscar no Cockpit" /></div>' +
      '<div class="chassi-busca-resultados" id="chassi-busca-resultados"></div>' +
      "</div></div>"
    );
  }

  function wireBusca() {
    const caixa = document.getElementById("chassi-busca");
    const btn = document.getElementById("chassi-busca-btn");
    const input = document.getElementById("chassi-busca-input");
    const resultados = document.getElementById("chassi-busca-resultados");
    let acoes = [];

    function fechar() {
      caixa.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }
    function fecharCom(acao) {
      fechar();
      input.value = "";
      render();
      acao();
    }
    function render() {
      const termo = input.value;
      acoes = [];
      const linha = (titulo, detalhe, acao) => {
        acoes.push(acao);
        return '<button type="button" class="chassi-busca-item" data-acao="' + (acoes.length - 1) + '"><span class="chassi-busca-item-titulo">' + esc(titulo) + "</span>" + (detalhe ? '<span class="chassi-busca-item-detalhe">' + esc(detalhe) + "</span>" : "") + "</button>";
      };
      if (!termo.trim()) {
        resultados.innerHTML =
          '<p class="chassi-busca-rotulo">Buscas recentes</p>' +
          CD.BUSCAS_RECENTES.map((r) => '<button type="button" class="chassi-busca-recente" data-recente="' + esc(r) + '">' + Icon("search", "size-3") + esc(r) + "</button>").join("");
      } else {
        const modulos = montarModulos(termo);
        resultados.innerHTML = modulos.length
          ? modulos
              .map(
                (m) =>
                  '<div class="chassi-busca-modulo"><p class="chassi-busca-rotulo">' + m.rotulo + "</p>" +
                  m.itens.map((i) => linha(i.titulo, i.detalhe, i.acao)).join("") +
                  (m.rodape ? (acoes.push(m.rodape.acao), '<button type="button" class="chassi-busca-rodape" data-acao="' + (acoes.length - 1) + '">' + m.rodape.texto + "</button>") : "") +
                  "</div>"
              )
              .join("")
          : '<p class="chassi-busca-vazio">Nada encontrado para “' + esc(termo.trim()) + "”.</p>";
      }
      resultados.querySelectorAll("[data-acao]").forEach((b) => b.addEventListener("click", () => fecharCom(acoes[Number(b.getAttribute("data-acao"))])));
      resultados.querySelectorAll("[data-recente]").forEach((b) =>
        b.addEventListener("click", () => {
          input.value = b.getAttribute("data-recente");
          render();
          input.focus();
        })
      );
    }

    btn.addEventListener("click", () => {
      const abrir = !caixa.classList.contains("is-open");
      caixa.classList.toggle("is-open", abrir);
      btn.setAttribute("aria-expanded", abrir ? "true" : "false");
      if (abrir) {
        render();
        input.focus();
      }
    });
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fechar();
      if (e.key === "Enter" && input.value.trim()) {
        const termo = input.value.trim();
        fecharCom(() => abrirDestino('Abriria a página de resultados para "' + termo + '", com tudo que foi encontrado.'));
      }
    });
    fechaAoClicarFora(caixa, fechar);
  }

  // ===== Menu do usuário =====
  function iniciais(nome) {
    return nome.split(" ").map((p) => p[0]).slice(0, 2).join("");
  }

  function usuarioHtml() {
    const op = CD.OPERADORA;
    return (
      '<div class="chassi-usuario" id="chassi-usuario">' +
      '<button type="button" class="chassi-avatar" id="chassi-usuario-btn" aria-label="' + esc(op.nome) + '" title="' + esc(op.nome) + '" aria-expanded="false">' + iniciais(op.nome) + "</button>" +
      '<div class="chassi-popover chassi-usuario-menu" role="menu">' +
      '<div class="chassi-usuario-quem"><p class="text-sm font-medium">' + esc(op.nome) + '</p><p class="text-xs text-muted">' + esc(op.papel) + "</p></div>" +
      '<div class="chassi-separador"></div>' +
      '<button type="button" class="chassi-menu-item" role="menuitem" data-destino-usuario="config">' + Icon("settings", "size-4") + "Configurações</button>" +
      '<button type="button" class="chassi-menu-item" role="menuitem" data-destino-usuario="sair">' + Icon("log-out", "size-4") + "Sair</button>" +
      "</div></div>"
    );
  }

  function wireUsuario() {
    const caixa = document.getElementById("chassi-usuario");
    const btn = document.getElementById("chassi-usuario-btn");
    const fechar = () => {
      caixa.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    };
    btn.addEventListener("click", () => {
      const abrir = !caixa.classList.contains("is-open");
      caixa.classList.toggle("is-open", abrir);
      btn.setAttribute("aria-expanded", abrir ? "true" : "false");
    });
    caixa.querySelectorAll("[data-destino-usuario]").forEach((b) =>
      b.addEventListener("click", () => {
        fechar();
        abrirDestino(b.getAttribute("data-destino-usuario") === "config" ? "Abriria as configurações — perfil, notificações e preferências." : "Encerraria a sessão e voltaria para a tela de login.");
      })
    );
    fechaAoClicarFora(caixa, fechar);
  }

  // ===== Gaveta =====
  function badge(tom, texto, icone) {
    const classe = { success: "badge-success", warning: "badge-warning", destructive: "badge-destructive", secondary: "badge-secondary", info: "badge-info" }[tom] || "badge-outline";
    return '<span class="badge ' + classe + '">' + (icone ? Icon(icone, "size-3") + " " : "") + texto + "</span>";
  }

  // Casa por começo de palavra (no rótulo, na aba ou num sinônimo); termo sem letra compara só dígitos.
  function campoCasa(campo, termo) {
    const t = termo.trim().toLowerCase();
    if (!t) return false;
    if (!/[a-zà-ú]/i.test(t)) {
      const d = t.replace(/\D/g, "");
      return d.length > 0 && String(campo.valor || "").replace(/\D/g, "").includes(d);
    }
    const palavras = (campo.rotulo + " " + campo.aba + " " + campo.sinonimos.join(" ")).toLowerCase().split(/[\s.·/-]+/);
    if (/[\s.,/-]/.test(t)) return (campo.rotulo + " " + campo.aba).toLowerCase().includes(t);
    return palavras.some((p) => p.startsWith(t));
  }

  function campoHtml(campo) {
    const st = CD.STATUS_CAMPO[campo.status];
    return (
      '<div class="chassi-campo">' +
      '<span class="chassi-campo-aba">' + esc(campo.aba) + "</span>" +
      '<div class="chassi-campo-bloco">' +
      '<div class="flex items-center justify-between gap-2"><span class="detail-field-label">' + esc(campo.rotulo) + "</span>" +
      '<span class="chassi-campo-status is-' + st.tom + '" title="' + st.rotulo + '">' + Icon(st.icone, "size-3-5") + '<span class="sr-only">' + st.rotulo + "</span></span></div>" +
      '<span class="detail-field-value">' + (campo.valor ? esc(campo.valor) : '<span class="detail-field-unavailable">Não informado</span>') + "</span>" +
      "</div></div>"
    );
  }

  function fichaConteudoHtml(cliente) {
    const termo = termoFicha;
    if (!termo.trim()) {
      const nTarefas = CD.TAREFAS.filter((t) => t.clienteId === cliente.id).length;
      return (
        '<div class="chassi-bloco"><span class="chassi-bloco-titulo">Plano</span>' +
        '<div class="detail-grid" style="grid-template-columns:1fr 1fr; gap:12px;">' +
        '<div class="detail-field"><span class="detail-field-label">Plano</span><span class="detail-field-value">' + esc(cliente.plano) + "</span></div>" +
        '<div class="detail-field"><span class="detail-field-label">Mensalidade</span><span class="detail-field-value tabular-nums">' + esc(cliente.mensalidade) + "</span></div>" +
        "</div></div>" +
        (nTarefas ? '<button type="button" class="chassi-link-linha" id="chassi-ver-tarefas">' + Icon("list-checks", "size-4") + "Ver as " + nTarefas + " tarefas deste cliente" + Icon("chevron-right", "size-4") + "</button>" : "")
      );
    }
    const achados = CD.camposDaFicha(cliente).filter((c) => campoCasa(c, termo));
    return (
      (achados.length ? '<div class="flex flex-col gap-3">' + achados.map(campoHtml).join("") + "</div>" : '<p class="text-sm text-muted">Nenhum campo da ficha casa com “' + esc(termo.trim()) + "”.</p>") +
      '<div class="chassi-nao-achou"><p class="text-sm font-medium">Não achou o que procurava?</p>' +
      '<button type="button" class="btn-link link-info" id="chassi-ficha-completa">Abrir a ficha completa</button></div>'
    );
  }

  const ATALHOS_FICHA = ["Inscrição estadual", "Fechamento", "Certificado", "Contatos"];

  function fichaHtml(cliente) {
    const sit = CD.SITUACAO_CLIENTE[cliente.situacao];
    return (
      '<div class="chassi-gaveta-corpo">' +
      '<button type="button" class="chassi-abrir-pagina" id="chassi-abrir-pagina">' + Icon("external-link", "size-3-5") + "Abrir a página do cliente</button>" +
      '<div class="flex flex-col gap-1">' +
      '<h2 class="chassi-ficha-nome">' + esc(cliente.nome) + " " + badge(sit.tom, sit.rotulo) + "</h2>" +
      '<span class="cell-mono text-muted">' + esc(cliente.cnpj) + "</span>" +
      '<span class="text-xs text-muted">Cód. Domínio ' + esc(cliente.codDominio) + " · Origem " + esc(cliente.origem) + "</span>" +
      "</div>" +
      '<div class="chassi-ficha-busca">' + Icon("search", "size-3-5") +
      '<input type="text" id="chassi-ficha-input" placeholder="Inscrição estadual, fechamento, contatos…" autocomplete="off" aria-label="Buscar na ficha" value="' + esc(termoFicha) + '" /></div>' +
      '<div class="chassi-ficha-atalhos" id="chassi-ficha-atalhos">' + ATALHOS_FICHA.map((a) => '<button type="button" class="chassi-atalho" data-atalho="' + a + '">' + a + "</button>").join("") + "</div>" +
      '<div class="chassi-separador"></div>' +
      '<div class="flex flex-col gap-4" id="chassi-ficha-conteudo">' + fichaConteudoHtml(cliente) + "</div>" +
      "</div>"
    );
  }

  function tarefasHtml(cliente) {
    const tarefas = CD.TAREFAS.filter((t) => t.clienteId === cliente.id);
    return (
      '<div class="chassi-gaveta-corpo">' +
      '<div class="flex flex-col gap-2">' +
      tarefas
        .map((t) => {
          const s = CD.SITUACAO_TAREFA[t.situacao];
          return (
            '<button type="button" class="chassi-tarefa" data-tarefa="' + t.id + '">' +
            '<span class="text-sm font-medium">' + esc(t.titulo) + "</span>" +
            '<span class="flex items-center gap-2 flex-wrap">' + badge(s.tom, s.rotulo) + '<span class="text-xs text-muted">' + t.area + " · prazo " + t.prazo + " · " + t.id + "</span></span>" +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<button type="button" class="btn btn-outline btn-sm w-fit" id="chassi-acompanhamento">' + Icon("external-link", "size-3-5") + " Abrir o acompanhamento completo</button>" +
      "</div>"
    );
  }

  function renderGaveta() {
    const aside = document.getElementById("chassi-gaveta");
    if (!aside) return;
    const aberta = conteudoGaveta !== null;
    aside.classList.toggle("is-open", aberta);
    aside.setAttribute("aria-hidden", aberta ? "false" : "true");
    document.body.classList.toggle("chassi-gaveta-aberta", aberta);
    if (!aberta) return;
    const cliente = CD.cliente(conteudoGaveta.id);
    const cabecalho =
      conteudoGaveta.tipo === "tarefas"
        ? '<div class="min-w-0"><h2 class="chassi-gaveta-titulo">' + Icon("list-checks", "size-3-5") + esc(cliente.nome) + '</h2><p class="text-xs text-muted">Tarefas do cliente</p></div>'
        : '<span class="sr-only">Ficha do cliente</span>';
    aside.innerHTML =
      '<div class="chassi-gaveta-inner">' +
      '<div class="chassi-gaveta-cabecalho">' + cabecalho +
      '<button type="button" class="chassi-icon-btn chassi-gaveta-fechar" id="chassi-gaveta-fechar" aria-label="Fechar">' + Icon("x", "size-4") + "</button></div>" +
      (conteudoGaveta.tipo === "cliente" ? fichaHtml(cliente) : tarefasHtml(cliente)) +
      "</div>";
    aside.querySelector("#chassi-gaveta-fechar").addEventListener("click", fecharGaveta);
    const abrirPagina = aside.querySelector("#chassi-abrir-pagina");
    if (abrirPagina) abrirPagina.addEventListener("click", () => abrirDestino("Abriria a página do cliente " + cliente.nome + " no Cockpit."));
    const acompanhamento = aside.querySelector("#chassi-acompanhamento");
    if (acompanhamento) acompanhamento.addEventListener("click", () => abrirDestino("Abriria o acompanhamento completo das tarefas de " + cliente.nome + "."));
    aside.querySelectorAll("[data-tarefa]").forEach((b) => b.addEventListener("click", () => abrirDestino("Abriria a tarefa " + b.getAttribute("data-tarefa") + ".")));
    wireFicha(cliente);
  }

  function wireConteudoFicha(cliente) {
    const verTarefas = document.getElementById("chassi-ver-tarefas");
    if (verTarefas) verTarefas.addEventListener("click", () => abrirTarefas(cliente.id));
    const completa = document.getElementById("chassi-ficha-completa");
    if (completa) completa.addEventListener("click", () => abrirDestino("Abriria a ficha completa de " + cliente.nome + ", com as cinco abas."));
  }

  function wireFicha(cliente) {
    const input = document.getElementById("chassi-ficha-input");
    if (!input) return;
    const atalhos = document.getElementById("chassi-ficha-atalhos");
    const conteudo = document.getElementById("chassi-ficha-conteudo");
    const atualizar = () => {
      termoFicha = input.value;
      conteudo.innerHTML = fichaConteudoHtml(cliente);
      wireConteudoFicha(cliente);
      atalhos.classList.toggle("is-visible", document.activeElement === input && !termoFicha.trim());
    };
    input.addEventListener("input", atualizar);
    input.addEventListener("focus", () => atalhos.classList.toggle("is-visible", !input.value.trim()));
    input.addEventListener("blur", () => setTimeout(() => atalhos.classList.remove("is-visible"), 150));
    atalhos.querySelectorAll("[data-atalho]").forEach((b) =>
      b.addEventListener("mousedown", (e) => {
        e.preventDefault();
        input.value = b.getAttribute("data-atalho");
        atualizar();
      })
    );
    wireConteudoFicha(cliente);
  }

  function abrirCliente(id) {
    termoFicha = "";
    conteudoGaveta = { tipo: "cliente", id };
    renderGaveta();
  }

  function abrirTarefas(id) {
    conteudoGaveta = { tipo: "tarefas", id };
    renderGaveta();
  }

  function fecharGaveta() {
    conteudoGaveta = null;
    renderGaveta();
    setTimeout(() => {
      const aside = document.getElementById("chassi-gaveta");
      if (aside && !conteudoGaveta) aside.innerHTML = "";
    }, GAVETA_MS);
  }

  // ===== Atividades (sino) =====
  function lidas() {
    try {
      return JSON.parse(global.localStorage.getItem(LIDAS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function marcarLidas(ids) {
    const atuais = lidas();
    ids.forEach((id) => {
      if (atuais.indexOf(id) === -1) atuais.push(id);
    });
    try {
      global.localStorage.setItem(LIDAS_KEY, JSON.stringify(atuais));
    } catch (e) {
      /* localStorage indisponível */
    }
  }
  function atividades(aba) {
    const jaLidas = lidas();
    return CD.ATIVIDADES.filter((a) => aba !== "carteira" || a.carteira).map((a) => Object.assign({}, a, { lida: a.lida || jaLidas.indexOf(a.id) !== -1 }));
  }
  function naoLidas() {
    return atividades("todas").filter((a) => !a.lida).length;
  }

  function atividadeHtml(a) {
    return (
      '<button type="button" class="chassi-atividade' + (a.lida ? "" : " is-nao-lida") + '" data-atividade="' + a.id + '">' +
      (a.lida ? "" : '<span class="chassi-dot" aria-label="Não lida"></span>') +
      '<span class="chassi-atividade-titulo">' + esc(a.titulo) + "</span>" +
      '<span class="chassi-atividade-desc">' + esc(a.descricao) + "</span>" +
      '<span class="chassi-atividade-quando">' + esc(a.quando) + "</span>" +
      "</button>"
    );
  }

  function abasHtml(aba) {
    return (
      '<div class="tabs-list" role="tablist">' +
      [["todas", "Todas"], ["carteira", "Minha carteira"]].map((x) => '<button type="button" role="tab" class="tabs-trigger' + (x[0] === aba ? " is-active" : "") + '" data-aba-atividades="' + x[0] + '">' + x[1] + "</button>").join("") +
      "</div>"
    );
  }

  function abrirAtividade(id, aoMudar) {
    marcarLidas([id]);
    aoMudar();
    const a = CD.ATIVIDADES.find((x) => x.id === id);
    abrirDestino("Abriria o que gerou a atividade: " + a.titulo + ".");
  }

  function atualizarDotSino() {
    const sino = document.getElementById("cx-sino");
    if (sino) sino.classList.toggle("has-novidade", naoLidas() > 0);
  }

  function wireSino(sino, opts) {
    let painel = null;
    let aba = "todas";

    function fechar() {
      if (!painel) return;
      painel.remove();
      painel = null;
      sino.classList.remove("is-open");
      sino.setAttribute("aria-expanded", "false");
    }

    function render() {
      const lista = atividades(aba);
      const n = naoLidas();
      painel.innerHTML =
        '<div class="chassi-atividades-cabecalho"><div class="flex items-center gap-2"><span class="text-sm font-semibold">Atividades</span>' + (n ? '<span class="badge badge-info">' + n + " novas</span>" : "") + "</div>" +
        (n ? '<button type="button" class="btn-link link-info text-xs" id="chassi-marcar-lidas">Marcar todas como lidas</button>' : "") + "</div>" +
        '<div class="chassi-atividades-abas">' + abasHtml(aba) + "</div>" +
        '<div class="chassi-atividades-lista">' + lista.slice(0, 15).map(atividadeHtml).join("") + "</div>" +
        '<a class="chassi-atividades-rodape" href="' + base + 'notificacoes/index.html">Ver todas</a>';
      painel.querySelectorAll("[data-aba-atividades]").forEach((b) =>
        b.addEventListener("click", () => {
          aba = b.getAttribute("data-aba-atividades");
          render();
        })
      );
      painel.querySelectorAll("[data-atividade]").forEach((b) =>
        b.addEventListener("click", () =>
          abrirAtividade(Number(b.getAttribute("data-atividade")), () => {
            render();
            atualizarDotSino();
          })
        )
      );
      const marcar = painel.querySelector("#chassi-marcar-lidas");
      if (marcar) {
        marcar.addEventListener("click", () => {
          marcarLidas(CD.ATIVIDADES.map((a) => a.id));
          render();
          atualizarDotSino();
        });
      }
    }

    sino.addEventListener("click", () => {
      if (painel) return fechar();
      painel = document.createElement("div");
      painel.className = "chassi-popover chassi-atividades";
      painel.setAttribute("role", "dialog");
      painel.setAttribute("aria-label", "Atividades");
      const r = sino.getBoundingClientRect();
      const nav = sino.closest(".cx-nav").getBoundingClientRect();
      painel.style.left = nav.right + 12 + "px";
      painel.style.top = r.top + "px";
      document.body.appendChild(painel);
      sino.classList.add("is-open");
      sino.setAttribute("aria-expanded", "true");
      render();
    });
    document.addEventListener("mousedown", (e) => {
      if (!painel || painel.contains(e.target) || sino.contains(e.target)) return;
      if (e.target.closest("#chassi-destino")) return;
      fechar();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && painel && !document.querySelector("#chassi-destino.is-open")) fechar();
    });
    atualizarDotSino();
    if (opts && opts.onReady) opts.onReady();
  }

  // Página "Ver todas" (notificacoes/index.html): mesma lista do sino, 20 por página.
  function renderVerTodas(mount) {
    let aba = "todas";
    let pagina = 0;
    const POR_PAGINA = 20;
    function render() {
      const lista = atividades(aba);
      const total = lista.length;
      const inicio = pagina * POR_PAGINA;
      const fim = Math.min(inicio + POR_PAGINA, total);
      mount.innerHTML =
        '<div class="flex items-center justify-between gap-3 flex-wrap">' + abasHtml(aba) +
        (naoLidas() ? '<button type="button" class="btn btn-outline btn-sm w-fit" id="chassi-ver-todas-lidas">Marcar todas como lidas</button>' : "") + "</div>" +
        '<div class="chassi-atividades-pagina">' + lista.slice(inicio, fim).map(atividadeHtml).join("") + "</div>" +
        '<div class="flex items-center justify-between gap-3 flex-wrap">' +
        '<span class="text-xs text-muted">Mostrando ' + (total ? inicio + 1 : 0) + "–" + fim + " de " + total + "</span>" +
        '<div class="flex gap-2"><button type="button" class="btn btn-outline btn-sm" id="chassi-pag-ant"' + (pagina === 0 ? " disabled" : "") + ">" + Icon("chevron-left", "size-3-5") + " Anterior</button>" +
        '<button type="button" class="btn btn-outline btn-sm" id="chassi-pag-prox"' + (fim >= total ? " disabled" : "") + ">Próxima " + Icon("chevron-right", "size-3-5") + "</button></div></div>";
      mount.querySelectorAll("[data-aba-atividades]").forEach((b) =>
        b.addEventListener("click", () => {
          aba = b.getAttribute("data-aba-atividades");
          pagina = 0;
          render();
        })
      );
      mount.querySelectorAll("[data-atividade]").forEach((b) =>
        b.addEventListener("click", () =>
          abrirAtividade(Number(b.getAttribute("data-atividade")), () => {
            render();
            atualizarDotSino();
          })
        )
      );
      mount.querySelector("#chassi-pag-ant").addEventListener("click", () => {
        pagina -= 1;
        render();
      });
      mount.querySelector("#chassi-pag-prox").addEventListener("click", () => {
        pagina += 1;
        render();
      });
      const todas = mount.querySelector("#chassi-ver-todas-lidas");
      if (todas) {
        todas.addEventListener("click", () => {
          marcarLidas(CD.ATIVIDADES.map((a) => a.id));
          render();
          atualizarDotSino();
        });
      }
    }
    render();
  }

  // ===== Montagem (chamada por Shell.mount) =====
  function topbarDireitaHtml() {
    return '<div class="chassi-topbar-acoes">' + buscaHtml() + '<span class="chassi-filete" aria-hidden="true"></span>' + usuarioHtml() + "</div>";
  }

  function mount(opts) {
    base = opts.base || "";
    wireBusca();
    wireUsuario();
    const aside = document.createElement("aside");
    aside.className = "chassi-gaveta";
    aside.id = "chassi-gaveta";
    aside.setAttribute("aria-hidden", "true");
    aside.setAttribute("aria-label", "Gaveta");
    opts.shellEl.appendChild(aside);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && conteudoGaveta && !document.querySelector(".dialog-overlay.is-open, .sheet-panel.is-open, .chassi-popover:not(.chassi-busca-panel):not(.chassi-usuario-menu)")) fecharGaveta();
    });
  }

  global.Chassi = { mount, topbarDireitaHtml, wireSino, renderVerTodas, abrirDestino, abrirCliente, abrirTarefas, fecharGaveta };
})(window);
