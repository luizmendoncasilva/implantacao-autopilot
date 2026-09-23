# Cockpit — Tokens e Componentes

Catálogo de referência do que já existe em `assets/core/` (os 8 arquivos que compõem o design system, divididos a partir do antigo `cockpit-core.js` monolítico — ver `flow-config-contract.md` para a tabela de qual arquivo tem o quê). Antes de inventar uma classe CSS ou padrão visual novo, procure aqui primeiro.

## Design tokens (CSS vars, já injetadas por `cockpit-01-shell.js`)

```css
--brand-pink: #f25461;        /* cor primária BHub/Cockpit */
--brand-pink-hover: #e83d4d;
--brand-pink-soft: #fde7ea;
--brand-blue: #0171e4;        /* usado em filtros, seletor de período, links de "acompanhamento" */
--brand-blue-soft: rgba(1, 113, 228, 0.10);
--sidebar-bg: #141414;
--sidebar-item: #2a2a2a;
--sidebar-item-hover: #3a3a3a;
--surface: #ffffff;
--surface-muted: #f7f7f8;
--surface-subtle: #fafafa;
--text-primary: #18181b;
--text-secondary: #52525b;
--text-tertiary: #a1a1aa;
--border: #e4e4e7;
--border-strong: #d4d4d8;
--success: #16a34a;   --success-soft: #dcfce7;
--danger: #dc2626;    --danger-soft: #fee2e2;
--warning: #d97706;   --warning-soft: #fef3c7;
--info: #2563eb;      --info-soft: #dbeafe;
```

Fontes: `Inter` (UI geral) e `JetBrains Mono` (classe `.font-mono`, usada para CNPJ, IDs, valores monetários, códigos). Sempre carregar via Google Fonts no `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Ícones: [Lucide](https://lucide.dev) via `<i data-lucide="nome-do-icone">`, sempre seguido de `refreshIcons()` (chama `lucide.createIcons()`) depois de injetar HTML novo dinamicamente.

## Layout base (montado automaticamente por `_buildShell()`, exceto em modo `standalone`)

O core constrói sozinho, ao carregar (a menos que `FLOW_CONFIG.standalone === true`): sidebar fixa esquerda (98px, fundo escuro, ícones + label), topbar sticky com sino de notificações, e a área `.main`. **Você não precisa recriar isso** — ele já injeta no `document.body` quando a página carrega. Marca e itens de navegação vêm do módulo escolhido em `FLOW_CONFIG.module` (DP, Fiscal, Contábil, BPO, Autopilot Configs — ver `flow-config-contract.md`). Seu trabalho é: (1) definir `window.FLOW_CONFIG` (módulo + `entryScreen` ou `standalone`), (2) opcionalmente ocultar partes do shell que não fazem sentido pro seu fluxo (com `display:none!important` por ID/classe), e (3) adicionar telas/seções específicas do seu fluxo.

**A fila de tarefas não é mais a tela de entrada padrão.** Use `FLOW_CONFIG.entryScreen` (`'queue' | 'task' | 'execution' | 'success'`) pra abrir direto na tela pedida, ou `standalone: true` pra pular o shell inteiro (adaptação de layout externo/print, componente isolado).

## Botões

| Classe | Uso |
|---|---|
| `.btn.btn-primary` | Ação principal (rosa) |
| `.btn.btn-secondary` | Ação secundária (branco, borda) |
| `.btn.btn-ghost` | Ação terciária, sem borda |
| `.btn.btn-danger` | Destrutiva, texto vermelho, fundo branco |
| `.btn-danger-solid` | Destrutiva "cheia" (fundo vermelho) — usar em modais de confirmação de ação destrutiva |
| `.btn-lg` | Modificador para botão maior (padding maior) |
| `.btn-decision-yes` / `.btn-decision-no` | Par de botões grandes de decisão binária (ex: "Sim, processar" / "Não, pedir algo ao cliente") — usar dentro de `.decision-card` |
| `.btn-return-queue` | Link discreto vermelho "Devolver à fila", alinhado à direita no header da tarefa |

## Badges e tags

| Classe | Uso |
|---|---|
| `.badge.badge-success/-danger/-warning/-info/-pink/-neutral` | Pill de status |
| `.contact-tag` / `.contact-tag-client` | Tag pequena minúscula (ex: "robô", "cliente", papel do solicitante) |
| `.editable-badge` | Selo amarelo pequeno "editável" ao lado de campo editável |

## Cards e seções

| Classe | Uso |
|---|---|
| `.section-card` | Container branco com borda, padding generoso — bloco base de qualquer seção |
| `.section-title` | Título de seção dentro do card (rosa, uppercase, com ícone) |
| `.section-head` + `.sh-title` / `.sh-sub` | Cabeçalho de página fora do card (título maior + subtítulo) |
| `.subsection-title` | Subtítulo dentro de um card, com linha divisória |
| `.alert-banner` | Faixa de aviso com borda esquerda rosa |
| `.empty-state` | Estado vazio centralizado com ícone circular |
| `.success-hero` | Bloco grande verde de sucesso/conclusão (tela final de fluxo) |
| `.decision-card` | Card de decisão binária com título, descrição e `.decision-btns` |

## Campos e formulários (padrão "view/edit inline")

O padrão do cockpit é campo somente-leitura por padrão, com botão de lápis para editar inline. As funções já prontas (usar ao montar formulários, não reinventar):

- `efText(label, value, tab, section, field)`
- `efDate(label, value, tab, section, field)`
- `efNumber(...)`, `efCurrency(...)`, `efMonthYear(...)`
- `efSelect(label, value, tab, section, field, options)`
- `efToggle(label, value, tab, section, field, opts)`
- `efTextarea(...)`
- Variantes de lista (para campos dentro de um array, ex. dependentes): `efListText`, `efListDate`, `efListSelect`, `efListToggle`

Classes de apoio: `.field-group` (grid 4 colunas, com `.field-group-2`/`-3` para menos colunas), `.field-label` / `.field-value` (`.empty` quando vazio), `.ef-field` / `.ef-label` / `.ef-input` / `.ef-select` / `.ef-textarea` (modo edição).

## Modais

- `showConfirmModal({ title, message, confirmLabel, cancelLabel, danger, onConfirm })` — modal de confirmação genérico, já pronto, **use sempre que precisar confirmar uma ação** em vez de criar modal novo.
- `showAlertModal({ title, message })` — modal de aviso simples.
- Estrutura manual (`.modal-backdrop` > `.modal-panel` > `.modal-header` + `.modal-body` + `.modal-footer`) só se precisar de um modal com conteúdo muito específico que os dois acima não cobrem.
- `openDrawer(type)` / `closeDrawer()` (usa `#modal-drawer`) — **apesar do nome, isso é um modal centrado**, não um painel lateral. É o padrão já pronto do core pra listas de acompanhamento puramente informativas (ex.: tarefas estacionadas, tarefas concluídas). Use só quando não houver interação/edição dentro do painel.

### ⚠️ Regra: modal centrado vs. drawer lateral

- **Só leitura / confirmação** → modal centrado (`showAlertModal`, `showConfirmModal`, ou `openDrawer`/`#modal-drawer` pra listas de acompanhamento).
- **Informação + interação** (formulário, seleção, aprovação, upload, qualquer ação dentro do painel) → **sempre** drawer lateral deslizante (ver seção abaixo). Nunca um modal centrado nesse caso.

## Drawer lateral (`.drawer`)

Painel deslizando da direita, usado quando é preciso mostrar detalhe **e** permitir ação/edição (ex.: aprovar um vínculo, escolher uma conta, revisar e confirmar algo específico de um item da lista). **Não existe como função global no core** — é replicado por fluxo, com nomes de função sufixados pra não colidir com `openDrawer`/`closeDrawer` (definidos em `cockpit-07-modals-init.js`, que já existem globalmente e são o modal centrado acima). Sempre que precisar desse painel, use este padrão:

**CSS a incluir no `<style>` da página** (não está em nenhum arquivo do core, precisa colar):

```css
.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.25); z-index: 40; opacity: 0; pointer-events: none; transition: opacity .2s; }
.drawer-overlay.open { opacity: 1; pointer-events: auto; }
.drawer { position: fixed; top: 0; right: 0; height: 100%; width: 480px; background: var(--surface); border-left: 1px solid var(--border); z-index: 50; display: flex; flex-direction: column; transform: translateX(100%); transition: transform .25s cubic-bezier(.25,.46,.45,.94); }
.drawer.open { transform: translateX(0); }
.drawer-header { padding: 16px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; display: flex; align-items: flex-start; gap: 12px; }
.drawer-title { font-size: 15px; font-weight: 700; color: var(--text-primary); line-height: 1.3; }
.drawer-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 16px; }
.drawer-footer { padding: 14px 20px; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 8px; flex-shrink: 0; background: var(--surface); }
.drawer-block { background: var(--surface-subtle); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; }
```

**Markup injetado dinamicamente** (uma vez, ao montar a tela — substitua `{Fluxo}` pelo sufixo do seu fluxo, ex. `Concil`, `Ferias`):

```js
function garantirOverlays{Fluxo}() {
  if (document.getElementById('{fluxo}-drawer-overlay')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="drawer-overlay" id="{fluxo}-drawer-overlay" onclick="fecharDrawer{Fluxo}()"></div>
    <div class="drawer" id="{fluxo}-drawer">
      <div class="drawer-header">
        <div style="flex:1;min-width:0" id="{fluxo}-drawer-header-content"></div>
        <button class="btn btn-ghost btn-xs" onclick="fecharDrawer{Fluxo}()"><i data-lucide="x" style="width:14px;height:14px"></i></button>
      </div>
      <div class="drawer-body" id="{fluxo}-drawer-body"></div>
      <div class="drawer-footer" id="{fluxo}-drawer-footer"></div>
    </div>`;
  document.body.appendChild(wrap);
}
function abrirDrawer{Fluxo}(itemId) {
  // preencher #{fluxo}-drawer-header-content, #{fluxo}-drawer-body, #{fluxo}-drawer-footer
  document.getElementById('{fluxo}-drawer-overlay').classList.add('open');
  document.getElementById('{fluxo}-drawer').classList.add('open');
  refreshIcons();
}
function fecharDrawer{Fluxo}() {
  document.getElementById('{fluxo}-drawer-overlay').classList.remove('open');
  document.getElementById('{fluxo}-drawer').classList.remove('open');
}
```

Dentro do `.drawer-body`, organize o conteúdo em blocos `.drawer-block` (mesmo visual de `.section-card`, mais compacto). Ações (aprovar, salvar, etc.) vão no `.drawer-footer` como `.btn.btn-primary`/`.btn-secondary`.

## Datatable (`dtCreate`) — componente novo, em `cockpit-08-datatable.js`

Tabela de dados genérica com busca, ordenação, paginação e seleção de linha. **Use sempre que precisar exibir uma lista tabular** (a antiga versão do core não tinha esse componente — era recriado do zero em cada fluxo; agora não precisa mais).

```js
dtCreate('clientes', {
  columns: [
    { key: 'nome', label: 'Cliente', sortable: true },
    { key: 'cnpj', label: 'CNPJ', mono: true },
    { key: 'status', label: 'Status', render: (row) => `<span class="badge badge-success">${row.status}</span>` },
  ],
  rows: [ /* array de objetos */ ],
  rowKey: 'id',
  pageSize: 10,
  selectable: true,     // adiciona checkbox por linha + "selecionar todos"
  searchable: true,     // adiciona busca que filtra em todas as colunas
  onRowClick: (row) => abrirDetalhe(row.id),
  emptyMessage: 'Nenhum registro encontrado.',
});
```

Monte o container antes de chamar: `<div id="dt-clientes"></div>` (sempre `dt-` + o `id` passado). Pra atualizar os dados depois (ex.: após um filtro externo), use `dtSetRows('clientes', novasLinhas)` em vez de chamar `dtCreate` de novo. Classes: `.dt-wrap`, `.dt-table`, `.dt-th-sortable`, `.dt-row-clickable`, `.dt-checkbox`, `.dt-footer` — todas já seguem os tokens de `:root`, não precisa estilizar nada a mais na maioria dos casos.

## Fila de tarefas / lista

- `.task-item` (+ `.highlight` quando destacado) — linha clicável de tarefa
- Badges de prazo/SLA: `slaBadge(status, sla)`, `deadlineBadge(status, deadline)`, `prazoCellHtml(t)`
- `.stats-row` — linha de estatística (label + valor grande), usada em cards de resumo/home
- `.lo-pager` — paginação simples (Anterior/Próxima) — para listas de tarefas específicas; para tabelas de dados genéricas, prefira o datatable acima
- Filtros dropdown: `.flt-bar` > `.flt` > `.flt-trigger` + `.flt-menu` (com `.flt-search`, `.flt-item`) — dropdown neutro estilo shadcn/Radix
- Seletor de período: `ppCreate(id, cfg)` + `.pp-wrap`/`.pp-btn`/`.pp-pop` — presets + calendário de range, já pronto (usado em "Solicitado em")

## Passos de execução (exec-steps) e timeline

- `.exec-step` (+ `.done`/`.active`) — cada passo numerado de um fluxo de execução, com corpo expansível
- `renderTimelineHorizontal(targetEl, currentStepIdx, task, opts)` — timeline horizontal de etapas no topo da tela de execução
- `EXEC_STEPS` no `FLOW_CONFIG` pode ser um array customizado ou uma string de preset (ex: `'geral'`) — ver `flow-config-contract.md`

## Arquivos e anexos

- `renderFileItem(file, options)` — chip de arquivo com ícone por tipo (pdf/img/doc/xls), nome, tamanho, e ações (remover etc.)
- `.upload-area` — dropzone de upload (arrastar/soltar), com `handleDragOver/handleDragLeave/handleFileDrop`
- `.attachment` — chip simples de anexo (sem ações)

## Conversa com cliente

- `.message.message-client` / `.message-operator` — bolhas de mensagem
- `.history-msg` (+ `.operator`) — item de histórico com avatar, autor, timestamp

## Toast

O exemplo real (`contabil-conciliacao.html`) implementa um toast próprio (`showToastConcil`) porque o core não tem um global — **replique esse padrão** quando precisar de notificação temporária: container `position:fixed;bottom:24px;right:24px`, classes `.toast.toast-success/-warning`, auto-remove após ~5s.

## Convenção de nomenclatura para evitar colisão

Funções e variáveis específicas de um fluxo devem ter um **sufixo único do fluxo** (ex.: tudo relacionado à conciliação contábil termina em `Concil`: `renderConciliacao`, `TRANSACOES_CONCIL`, `showToastConcil`). Isso evita colidir com os nomes globais já usados pelo core (`showScreen`, `openDrawer`, `currentTab`, `refreshIcons`, `dtCreate`, etc.). **Sempre** cheque o catálogo de funções globais abaixo antes de nomear algo novo.

## Funções globais úteis (assets/core/) — não recriar

`qs`/`qsa` (query selector helpers), `esc` (escape HTML), `refreshIcons`, `showScreen(name)`, `goHome`, `getTaskById`, `computeDeadline`, `slaBadge`/`deadlineBadge`, `renderFileItem`, `renderTimelineHorizontal`, `showConfirmModal`/`showAlertModal`, `copyLinkUrl`, `enterEditMode`/`cancelEdits`/`saveEdits` (modo de edição do formulário), `olMount(containerEl, opts)` (monta uma fila/lista de tarefas em um container).
