# Contrato do `window.FLOW_CONFIG`

Todo protótipo precisa definir `window.FLOW_CONFIG` **antes** de carregar os arquivos de `assets/core/`. O boot (em `cockpit-07-modals-init.js`) se auto-inicializa em `DOMContentLoaded` (ou imediatamente, se o DOM já carregou), lê esse objeto e decide o que montar.

## Os arquivos de `assets/core/` (o antigo `cockpit-core.js` monolítico, dividido)

| Arquivo | Conteúdo |
|---|---|
| `cockpit-01-shell.js` | Tokens de `:root`, todas as classes CSS base, catálogo de módulos (`COCKPIT_MODULES`), `_buildShell()` (monta sidebar/topbar/telas) |
| `cockpit-02-state-helpers.js` | Estado global (`state`), helpers genéricos (`qs`, `esc`, SLA/prazo, etc.), seletor de período (range) |
| `cockpit-03-queue-home.js` | Navegação (`showScreen`, `goHome`), render da home, módulo da fila do operador (`olMount` e afins) |
| `cockpit-04-task-detail.js` | Modal "resumo da tarefa", render do formulário, modo de edição inline, date picker de campo |
| `cockpit-05-timeline-actions.js` | Timeline horizontal, render de "task analysis", ações do operador (aceitar tarefa, devolver à fila, etc.) |
| `cockpit-06-execution.js` | Presets de `EXEC_STEPS`, render da tela de execução |
| `cockpit-07-modals-init.js` | Modal de confirmar finalização, render de sucesso, drawer central (`openDrawer`/`#modal-drawer`), notificações, simulações, flash, **e o boot (`_initCockpit`)** |
| `cockpit-08-datatable.js` | Datatable (novo componente — não existia no core original) |

**Ordem de carregamento: sempre a mesma, `cockpit-07-modals-init.js` sempre por último** (é ele que lê `window.FLOW_CONFIG` e decide o que renderizar). Em modo `standalone`, você pode omitir os arquivos que não usar (ver seção própria abaixo) — mas se incluir `cockpit-07`, ele continua tendo que vir depois dos outros que você incluir.

## Ordem de carregamento completa (dentro do HTML)

1. Tailwind CDN, Lucide CDN, Google Fonts (no `<head>`)
2. `<style>` com CSS específico da tela
3. `<body>`: um `<script>` inline que define `window.FLOW_CONFIG = {...}` **e** todas as funções/variáveis específicas do fluxo
4. Os arquivos de `core/` na ordem da tabela acima

## Módulos (`FLOW_CONFIG.module`)

A skill atende **todos** os módulos do Cockpit, não só DP. Sempre pergunte ao usuário qual módulo é o protótipo antes de montar (ver SKILL.md, passo 0). Valores aceitos e o que cada um muda por padrão (marca da sidebar + itens de navegação, definidos em `COCKPIT_MODULES` dentro de `cockpit-01-shell.js`):

| `module` | Marca da sidebar | Item ativo padrão |
|---|---|---|
| `'dp'` (default se omitido) | Cockpit | Tarefas de DP |
| `'fiscal'` | Cockpit | Tarefas Fiscais |
| `'contabil'` | Cockpit | Tarefas Contábeis |
| `'bpo'` | Cockpit | Tarefas de BPO |
| `'autopilot_configs'` | Autopilot | Configurações |

Pra customizar algo específico de um protótipo sem editar o catálogo global, use `FLOW_CONFIG.moduleOverrides` (mesmo shape do preset — `brand`, `activeLabel`, `activeIcon`, `activeHref`, `extraItems`) — ele é mesclado por cima do preset do módulo escolhido.

## Onde a tela abre: `entryScreen` (a fila NÃO é mais o padrão automático)

Historicamente todo protótipo abria na fila de tarefas. Isso deixou de ser o comportamento fixo — **o protótipo deve abrir direto na tela que foi pedida**. Controle isso com:

```js
FLOW_CONFIG.entryScreen = 'queue';      // fila de tarefas (comportamento antigo) — só use se o pedido for sobre a fila
FLOW_CONFIG.entryScreen = 'task';       // abre direto na tela de validação de uma tarefa
FLOW_CONFIG.entryScreen = 'execution';  // abre direto na tela de execução
FLOW_CONFIG.entryScreen = 'success';    // abre direto na tela de conclusão
FLOW_CONFIG.entryTaskId = 'DP-4471';    // (opcional) qual tarefa abrir — default: a 1ª de getInitialState().queue
```

Se omitido, o default é `'queue'` — declare `entryScreen` explicitamente sempre que o pedido for sobre uma tela específica, para não cair no padrão antigo por engano.

## Modo standalone: quando NÃO usar o shell do Cockpit

Para adaptação de um print/layout/HTML que não é do Cockpit, ou para prototipar um componente isolado sem sidebar/topbar/fila em volta:

```js
window.FLOW_CONFIG = { standalone: true };
```

Nesse modo, `_buildShell()` nunca é chamado — nada de sidebar, topbar, fila ou telas de home/task/execution/success é montado. Os tokens de `:root` e as classes/funções de componente (badges, botões, modais, drawer, datatable, `showConfirmModal`, `renderFileItem` etc.) continuam disponíveis normalmente — você constrói o `<body>` do jeito que o layout pedido exigir, usando essas peças pontualmente. Ver `assets/standalone-template.html`.

## Campos do FLOW_CONFIG (modo não-standalone)

```js
window.FLOW_CONFIG = {
  module: 'dp', // 'dp' | 'fiscal' | 'contabil' | 'bpo' | 'autopilot_configs'
  moduleOverrides: { /* opcional, ver acima */ },
  entryScreen: 'queue', // 'queue' | 'task' | 'execution' | 'success'
  entryTaskId: null, // opcional

  // Rótulo da operação/área — aparece em headers e labels de contexto
  operacaoLabel: 'Operação Contábil',

  // typeCode(s) desse fluxo. Necessário pra olFamily() e roteamento de tarefas.
  typeCode: 'conciliacao_extratos',

  // Metadados de cada tipo de tarefa que esse fluxo pode receber
  TYPE_METADATA: {
    conciliacao_extratos: {
      icon: 'landmark',
      label: 'Conciliação de Extratos',
      desc: 'Descrição curta do que é essa tarefa.',
      color: '#f25461',
    },
  },

  // Passos da tela de execução: array customizado OU nome de preset
  EXEC_STEPS: 'geral', // presets existentes em EXEC_STEP_PRESETS (cockpit-06-execution.js)

  // Abas do formulário de dados, por tipo de tarefa
  FORM_TABS_BY_TYPE: {
    conciliacao_extratos: [{ id: 'resumo', label: 'Resumo' }],
  },

  // Como renderizar o conteúdo de cada aba (chamado por switchFormTab) — obrigatório
  // se FORM_TABS_BY_TYPE estiver definido, mesmo que só devolva um placeholder.
  renderFormTab(tabId, abaData) {
    return '<div>...</div>';
  },

  // Override do timeline horizontal padrão, se o fluxo tiver etapas diferentes do genérico
  timelineSteps: [ /* ... */ ],

  // Estado inicial mockado — a "fila" de tarefas de exemplo pro protótipo
  getInitialState() {
    return {
      queue: [
        {
          id: 'CTB-0091',
          type: 'Conciliação de Extratos',
          typeCode: 'conciliacao_extratos',
          flowHref: 'contabil-conciliacao.html',
          clientName: 'Padaria São Luís',
          clientFantasy: 'Padaria São Luís',
          cnpj: '12.345.678/0001-90',
          logoText: 'ES',
          sla: '4h',
          slaStatus: 'risk', // 'normal' | 'risk' | 'overdue'
          receivedAt: '09:15',
          clientMessage: '',
          senderName: 'Autopilot · Motor Contábil',
          senderScopes: [],
          attachments: [{ name: 'Extrato.pdf', tag: 'Extrato' }],
          formData: { abas: { resumo: {} } },
        },
        // ... mais tarefas mock
      ],
    };
  },
};
```

## Dados mock realistas

Ao gerar `getInitialState()`, sempre use dados de exemplo plausíveis para o contexto do módulo escolhido (nomes de empresa fictícios, CNPJs no formato correto, valores em BRL, terminologia correta de DP/Fiscal/Contábil/BPO quando fizer sentido). Pelo menos 2-3 itens na fila para o protótipo parecer uma lista real, não um caso único — mesmo quando `entryScreen` não é `'queue'`, porque telas de detalhe/execução ainda podem referenciar a fila (ex.: botão "Devolver à fila").

## Ocultando partes do shell que não se aplicam ao fluxo

É normal um fluxo não usar todo o shell padrão (ex.: conciliação contábil não tem abas de formulário nem card de decisão sim/não). Nesse caso, ocultar via CSS no próprio `<style>` da página — **não editar os arquivos de `core/`**:

```css
#form-tabs, #form-edit-btn, #task-sla-inline, #task-deadline { display: none !important; }
.decision-card { display: none !important; }
```

## Evitando colisão de nomes

O core expõe várias funções e variáveis globais (`showScreen`, `state`, `openDrawer`, `currentTab`, `dtCreate`, etc.). Toda função/variável nova que o fluxo específico precisar deve ter um sufixo único do fluxo (ex.: `Concil`, `Ferias`, `Rescisao`) pra não colidir. Consulte `design-tokens-and-components.md` para a lista de funções globais já existentes antes de nomear algo.
