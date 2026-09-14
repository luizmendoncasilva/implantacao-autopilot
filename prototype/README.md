# AutoPilot — Protótipos HTML navegáveis

A partir da trilha **Cadastro de Empresas**, o AutoPilot passou de implementação em React para protótipos HTML/CSS/JS estáticos. Não há build, framework ou backend: são arquivos abertos direto no navegador (ou servidos por um servidor estático simples), navegando entre si por link real (`<a href>`), sem SPA.

Estes protótipos servem para Product Managers validarem arquitetura da informação, fluxos, nomenclaturas, layout e componentes **antes** do desenvolvimento técnico. Nenhum arquivo aqui deve ser lido como especificação de implementação — é o `docs/*.md` correspondente a cada trilha que continua sendo a fonte oficial de requisitos.

`prototype/shared/` é a **única fonte oficial de componentes** do projeto — todo protótipo, de qualquer trilha, consome exclusivamente esses arquivos. Nenhuma trilha deve ter sua própria cópia de sidebar, header, botão, tabela, card, badge etc.

## Estrutura

```
prototype/
  shared/             design system único, reaproveitado por toda trilha
    css/
      tokens.css        variáveis de cor/sombra/espaçamento/raio (única fonte de cor)
      base.css          reset + utilitários mínimos de layout (subconjunto Tailwind)
      components.css     botão, badge, card, tabela, tabs, alert, sheet, dialog, combobox, toast...
      layout.css         sidebar + header + breadcrumb + área de conteúdo (esqueleto de página)
    js/
      icons.js           ícones inline (sem dependência externa)
      shell.js           monta sidebar/header/breadcrumb e injeta o conteúdo de cada página
      ui.js              toggle group, combobox, sheet/dialog, toast, helpers de tabela
      coming-soon.js     placeholder para trilha ainda não desenhada
      fab-tools.js       FAB de ferramentas de prototipação (restaurar dados, ver "Convenções")
  empresas/            trilha Cadastro de Empresas (referência de padrão visual)
  cadastros-auxiliares/ cadastros mestres reutilizados por Empresas (Sócios, Registro de Contadores) — abas internas, sem tela de listagem própria
  parametros-fiscais/  próxima trilha — discovery e arquitetura já documentados em docs/
  regras-gerais/
  parametros/
  usuarios/
```

## Como cada página é montada

Toda página HTML segue o mesmo esqueleto:

```html
<div id="shell-root"></div>
<template id="page-content">
  <!-- conteúdo específico da página -->
</template>
<script src="../shared/js/icons.js"></script>
<script src="../shared/js/shell.js"></script>
<script src="../shared/js/ui.js"></script>
<script>
  Shell.mount(document.getElementById("shell-root"), { base: "../", active: "empresas", crumb: "empresas" });
</script>
```

`Shell.mount(root, opts)` constrói a sidebar e o cabeçalho (com o breadcrumb `autopilot.bhub.ai / ...`) e move o conteúdo do `<template>` para dentro da área de conteúdo.

- `active` controla qual item do menu aparece destacado.
- `base` é o caminho relativo até `prototype/` (ex.: `"../"` a partir de `empresas/index.html`).
- `crumb` (string) é o texto do breadcrumb quando não há nível a linkar (ex.: página de topo de uma trilha placeholder: `"regras gerais"`).
- `crumbs` (array `[{label, href?}]`) é a forma navegável do breadcrumb, usada quando a página está a mais de um nível de profundidade (ex.: dentro do cadastro de uma empresa). O último item é sempre a página atual, sem link; os anteriores só viram `<a>` quando `href` aponta para uma página que de fato existe — nunca gere link morto. Ver `empresas/js/boot-detail.js` para o exemplo com 3 níveis (`empresas / Nome da empresa / Aba atual`).

## Navegação

Não existe roteador. Cada tela é um arquivo `.html` próprio e os links entre elas são `<a href="outro-arquivo.html">` normais. Onde a tela depende de qual empresa está aberta (todo o cadastro de empresa), o código da empresa vai na querystring: `dados-gerais.html?empresa=PA-0011`. Trocar de aba dentro do cadastro de uma empresa é trocar de arquivo preservando esse parâmetro — ver `prototype/empresas/js/detail-common.js`.

## Dados

Cada trilha mantém seus mocks em `<trilha>/js/data.js` (ex.: `prototype/empresas/js/data.js`), sem chamada de API real. Interações que alterariam dado no produto real (adicionar sócio, mudar centralização) persistem em `localStorage` só para a sessão do navegador — dá pra navegar entre páginas sem perder o que foi digitado, mas não é dado real e é apagado ao limpar o navegador.

Exceção: **sócio e contador são entidades mestre compartilhadas entre trilhas** — moram em `prototype/cadastros-auxiliares/js/socios/data.js` (`SociosData`) e `prototype/cadastros-auxiliares/js/contadores/data.js` (`ContadoresData`), únicas fontes do cadastro de pessoa (+ participações, no caso do sócio). `prototype/empresas/js/socios.js` (aba Quadro Societário) e `prototype/empresas/js/contadores.js` (aba Contadores) incluem esses arquivos e usam `getSocios()`/`setSocios()` e `getContadores()`/`setContadores()` em vez de manter cópia própria; as duas telas em `cadastros-auxiliares/*.html` incluem `empresas/js/data.js` para resolver nome/link da empresa vinculada. Qualquer sócio ou contador cadastrado/editado numa trilha aparece imediatamente na outra (mesmo `localStorage`, chaves `autopilot_prototype_socios_v1` e `autopilot_prototype_contadores_v1`).

Formatadores/helpers de exibição usados em mais de uma tela da mesma trilha (ex.: `situacaoBadge`, `formatarEndereco`) ficam em `<trilha>/js/data.js`, exportados junto com os dados — nunca reimplementados arquivo a arquivo. Ver "Convenções" abaixo.

---

## Tokens (`shared/css/tokens.css`)

Única fonte de cor, sombra, raio e espaçamento — portados verbatim do objeto `T` de `src/components/ui/index.jsx`. **Nunca escreva um hex direto num CSS ou num `style=""`; sempre use a variável.** Uma checagem rápida (`grep -rE "#[0-9a-fA-F]{3,6}" prototype/`, ignorando `tokens.css`) deve sempre voltar vazia.

| Grupo | Variáveis |
|---|---|
| Superfícies | `--background`, `--foreground`, `--card`, `--card-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground` |
| Ação | `--primary(-foreground/-hover)`, `--secondary(-foreground/-hover)`, `--ghost-foreground`, `--ghost-hover`, `--outline-hover` |
| Estado semântico | `--destructive`, `--success`, `--warning`, `--info` — cada um com `-foreground`, `-text`, `-border`, `-subtle` (usados em badge/alert) |
| Bordas e foco | `--border`, `--input`, `--ring` |
| Sidebar | `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent(-foreground)`, `--sidebar-border`, `--sidebar-muted` |
| Sombra | `--shadow-xs`, `--shadow-sm`, `--shadow-md` |
| Raio | `--radius-sm/md/lg/full` |
| Espaçamento | `--space-1` a `--space-6` (4 a 24px) |
| Tipografia | `--font-sans` |

## Estados interativos (hover / active-selected / focus / disabled)

Escala de intensidade que todo componente com mais de um estado precisa seguir — existe porque, antes desta seção, mais de um componente (sidebar, lista de Documentação) usava o **mesmo token** no hover e no active/selected, deixando os dois indistinguíveis numa leitura rápida da tela.

- **Default**: token de superfície neutro do componente (`--card`, `--background`, `--muted`, conforme o caso) — não compete visualmente com o que está em interação.
- **Hover**: overlay leve e reaproveitável, sempre mais sutil que o active/selected do mesmo componente — `--outline-hover` (`rgba(0,0,0,0.031)`) é o padrão para superfícies claras; use `--ghost-hover` (`rgba(0,0,0,0.047)`) só onde ele já é o hover histórico do componente (`.btn-ghost`, `.date-picker-day`, `.date-picker-nav-btn`). **Nunca reutilize no hover o mesmo token usado no active/selected do mesmo componente.**
- **Active/Selected**: fundo sólido mais forte que o hover **e**, sempre que o componente tiver espaço, um segundo sinal que não depende só de cor — barra lateral (`box-shadow: inset 2-3px 0 0 var(--primary)` ou `var(--sidebar-primary)`), troca de cor num ícone, ou sombra (`.tabs-trigger.is-active`, `.toggle-item.is-on`). Profundidade de cor sozinha tende a ficar parecida com o hover — evite depender só dela.
- **Focus**: o anel compartilhado já documentado em "Foco acessível compartilhado" (Convenções) — não varia por componente.
- **Disabled**: opacidade reduzida (`.btn:disabled` = 0.55) ou cor `-muted`/`-foreground`; nunca `visibility:hidden`/`display:none` — o elemento continua no fluxo visual, só claramente inerte.

Componentes que já seguem o padrão "hover sutil + active/selected com reforço extra" — use-os de referência ao criar um componente novo com os dois estados: `.sidebar-btn` / `.sidebar-sub-btn` (barra lateral em `--sidebar-primary`), `.docs-list-row` (barra lateral em `--primary`), `.condrule.is-active` (barra lateral em `--primary`), `.toggle-item` (hover em `--outline-hover` antes de virar `.is-on`), `.stepper-step` (hover no círculo/rótulo antes de virar `.is-active`).

## Componentes disponíveis (`shared/css/components.css`)

| Classe raiz | O que é | Onde ver em uso |
|---|---|---|
| `.btn` (+ `-sm`/`-lg`, `-secondary`/`-outline`/`-ghost`/`-destructive`) | Botão. Padrão (sem modificador) = primary; não existe `.btn-primary` | toda trilha |
| `.btn-link` | Ação de texto tipo link (editar/excluir, Limpar filtros) | `empresas/js/socios.js`, `list.js` |
| `.link-info` | Link de destaque em `--info-text` (ex.: "voltar para a lista") — combine com `.btn-link` quando for um `<button>`, ou sozinho num `<a>` | `empresas/js/detail-common.js` |
| `.btn-icon-chev` | Botão de ícone isolado (expandir/recolher linha) | `empresas/js/list.js` |
| `.badge` (+ `-success`/`-warning`/`-info`/`-outline`/`-secondary`) | Etiqueta de status | toda trilha |
| `.card` / `.card-header` / `.card-title` / `.card-description` / `.card-content` / `.card-footer` | Cartão de conteúdo | toda trilha |
| `.list-row` | Linha com borda própria dentro de um card — alternativa a uma tabela quando o conteúdo é só "rótulo + estado" por linha | `cadastros-auxiliares/js/socios/list.js`, `contadores/list.js` |
| `.field-input` / `.field-select` (+ `.field-select-wrap`, `.field-label`) | Campo de formulário | toda trilha |
| `.table-wrap` / `table.dtable` (+ `thead`/`th`/`td`, `.row-clickable`, `.row-empty-state`) | Tabela de dados | toda trilha |
| `.dtable-fixed` | Modificador: `table-layout:fixed` — use com `<colgroup>` quando a largura das colunas precisa ser previsível | `empresas/index.html`, `list.js` |
| `.dtable-compact` | Modificador: variante mais baixa (thead em `--card`, `th` de 30px) para tabela aninhada dentro de outra | `empresas/js/list.js` (subtabela de filiais) |
| `.col-pad-sm` / `.col-pad-md` / `.col-pad-end` | Padding horizontal de coluna — aplique no `<th>` e no `<td>` da mesma coluna quando ela não deve usar o padding padrão de 24px | `empresas/index.html`, `list.js` |
| `.tabs-list` / `.tabs-trigger` | Abas | `empresas/js/detail-common.js` |
| `.toggle-group` / `.toggle-item` | Grupo de opções exclusivas (não é abas) | filtros de lista, "Visualizar como" |
| `.alert` (+ `-info`/`-warning`) | Aviso de página | banner "Protótipo" |
| `.uswitch` | Switch on/off | disponível, ainda sem uso em nenhuma trilha |
| `.dialog-*` | Modal centralizado | `empresas/socios.html`, `empresas/contadores.html` (confirmação de desvínculo) |
| `.sheet-*` | Painel lateral (drawer) | `empresas/socios.html`, `empresas/contadores.html`, `cadastros-auxiliares/socios.html`, `cadastros-auxiliares/contadores.html` |
| `.combobox-*` | Select com busca | `empresas/socios.html`, `empresas/contadores.html` |
| `.date-picker-*` | Seletor de data (botão + calendário em popover) | `empresas/socios.html` — `UI.initDatePicker()` em `ui.js` |
| `.toast` | Notificação temporária no canto da tela | `empresas/js/ui.js` (`UI.showToast`) — ver "Convenções" |
| `.fab-tools-*` | FAB fixo (ferramentas de prototipação) | toda trilha — `shared/js/fab-tools.js`, ver "Convenções" |

## Utilitários (`shared/css/base.css`)

Subconjunto deliberadamente pequeno, equivalente ao Tailwind usado nas trilhas React — não reintroduza um framework de utilitário inteiro. Cobre: `flex`/`grid` e alinhamento, `gap-*`, `p-*`/`px-*`/`py-*`, `rounded-*`, `text-*`/`font-*`, `size-*` (ícone), `max-w-*`, `w-full`/`w-fit`/`w-52`/`w-72`, `truncate`, `block`/`hidden`, `min-w-0`, `cursor-pointer`, `focus-ring`.

Precisa de um valor que não existe (ex.: `py-4`, `max-w-3xl`, `w-64`)? **Adicione seguindo a mesma escala** (múltiplos de 4px / valores do Tailwind), não invente outra unidade solta nem duplique um valor próximo já existente.

`w-52`/`w-72` usam `!important` de propósito: `.field-input`/`.field-select` já definem `width:100%` com a mesma especificidade e carregam depois (components.css depois de base.css) — sem `!important` a largura fixa seria silenciosamente ignorada nesses campos. Se precisar de uma largura fixa nova para um input/select, siga o mesmo padrão (`!important`); em qualquer outro elemento sem esse conflito, uma largura fixa comum (sem `!important`) já basta.

---

## Convenções

- **Estado visual em classe, não em atributo solto**: `.is-active`, `.is-open`, `.is-on`, `.is-checked`, `.is-selected` — todo componente com estado liga/desliga usa esse prefixo `is-*`. Não invente `.active`, `.opened`, `.selected` soltos.
- **Interação em `data-*`**: ações wireadas por JS usam atributos `data-acao="valor"` (ex.: `data-toggle-matriz`, `data-abrir`, `data-editar`), nunca `id` gerado dinamicamente por linha nem `onclick` inline.
- **`dtable` é o nome da tabela de dados** (mnemônico curto, não "table" nem "data-table") — mantenha esse nome em trilhas novas; não introduza um segundo nome para o mesmo componente.
- **Foco acessível compartilhado**: todo elemento interativo custom (não nativo) usa o mesmo anel — `outline: 2px solid var(--info-text); outline-offset: 2px` (ou `-2px` para controles que ocupam a linha toda, como `.row-clickable` e os botões da sidebar). As regras ficam agrupadas no topo de `components.css`/`layout.css`: **adicione o seletor do componente novo a um desses grupos**, não copie a declaração de novo. Para um elemento avulso que não justifica nomear um seletor, aplique a classe utilitária `.focus-ring` direto nele.
- **Truncamento de célula de tabela**: para um rótulo que é o único conteúdo de uma `<td>`, use `UI.truncatedCell(texto, maxWidthPx?, extraClass?)` (`shared/js/ui.js`) em vez de escrever `<span class="truncate" style="...">` à mão — `maxWidthPx` é opcional (omita numa tabela com `.dtable-fixed` + `<colgroup>`, onde a coluna já tem largura definida). Quando o truncamento é de um item dentro de uma linha flex com outros elementos ao lado (nome + badge, por exemplo), use a classe `.truncate` direto num item flex com `.min-w-0` — não use `UI.truncatedCell` nesse caso.
- **Toast**: `EmpresaDetailShell.mount()` (ou o equivalente de cada trilha) garante o markup do toast no `<body>` uma vez por página (`ensureToast()`); não declare `<div class="toast" id="toast">` manualmente em nenhum HTML. Para disparar, chame `UI.showToast(titulo, descricao?, iconName?)` — `iconName` aceita `"circle-check"` (padrão, confirmação de sucesso) ou `"info"` (aviso neutro); o ícone e a cor são resolvidos pelo próprio `showToast`.
- **Helpers de exibição por trilha**: uma função de formatação/lookup usada por mais de uma tela da mesma trilha (ex.: `situacaoBadge`, `formatarEndereco`, `findContadorDaEmpresa`) mora em `<trilha>/js/data.js`, exportada no objeto global da trilha (`EmpresasData`, etc.) — nunca copiada de arquivo em arquivo. Se, ao criar uma tela nova, você perceber que está reescrevendo uma função que já existe em outra tela da mesma trilha, é sinal de que ela deveria estar em `data.js`.
- **Página de detalhe com abas**: se a trilha nova tiver o padrão "lista → detalhe com abas" como Empresas, replique o par `detail-common.js` (header + tabs + resolve-por-querystring) + `boot-detail.js` (bootstrap comum), em vez de montar o cabeçalho de cada aba na mão.
- **FAB de ferramentas de prototipação**: `shared/js/fab-tools.js` monta um FAB fixo (canto inferior direito) automaticamente em toda página que o inclua — `Shell.mount()` chama `FabTools.mount()` sozinho, então basta adicionar `<script src="../shared/js/fab-tools.js"></script>` junto dos demais scripts de `shared/js/` (ver esqueleto de página acima). A única ação hoje é "Restaurar dados do protótipo": remove as chaves de `localStorage`/`sessionStorage` com prefixo `autopilot_prototype_` (nunca `localStorage.clear()`) e recarrega a página — cada `data.js` de trilha já cai de volta no seed inicial quando a chave não existe, então não é preciso recriar nada manualmente. Para adicionar uma nova ferramenta (ex.: "Exportar estado", "Importar estado"), inclua um novo item no array `TOOLS` em `fab-tools.js` — não crie um FAB paralelo nem duplique o menu. Qualquer trilha que passe a usar `localStorage` deve manter esse mesmo prefixo, senão o FAB não vai descobrir a chave para limpar.

## Boas práticas para novas trilhas

1. **Leia a documentação da trilha em `docs/*.md` primeiro**, depois discovery, depois arquitetura — só então construa o protótipo HTML (ver `docs/CLAUDE.md`).
2. **Antes de escrever qualquer CSS ou repetir um trecho de HTML/JS, procure em `shared/`** — botão, badge, card, tabela, tabs, sheet, dialog, combobox, toast, ícone, sidebar, header e breadcrumb já existem. Se o que você precisa é uma variação pequena de um componente existente (densidade, largura, cor), prefira um **modificador** (`.dtable-compact`, `.col-pad-sm`, `.btn-sm`) a duplicar a regra inteira.
3. **Falta um componente genuinamente novo?** Adicione-o em `shared/` (CSS em `components.css` ou `layout.css`, JS em `ui.js`), com um comentário citando o componente React de origem (`ui/xxx`) se existir um equivalente — nunca dentro da pasta da trilha.
4. **Cores só por token.** Se a tela pede uma cor que não existe em `tokens.css`, isso é uma decisão de Design System (para todas as trilhas), não uma decisão da trilha — pare e valide antes de adicionar um hex novo.
5. **Não duplique sidebar, header, breadcrumb ou toast.** Toda página monta via `Shell.mount()` e usa `EmpresaDetailShell`/`ensureToast()` (ou o padrão equivalente que a trilha nova estabelecer) para o toast — nunca copie o markup de outra trilha para dentro da sua.
6. **Placeholder "em breve"**: use `ComingSoon.render(titulo, descricao, status?)` (`shared/js/coming-soon.js`) — não desenhe outro cartão de espera do zero. `status` é opcional (`"Próxima etapa"` por padrão).
7. **Antes de finalizar, rode uma verificação visual** (ver nota de processo abaixo) comparando a tela nova com uma tela já existente da mesma família (lista, tabela, formulário) — hierarquia, densidade, espaçamento e cor devem ser indistinguíveis de trilha para trilha.

### Nota de processo — verificação visual

Este ambiente não tem `chromium-cli`/Playwright pré-instalado, mas o Edge existe em `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` e `puppeteer-core` pode ser instalado sob demanda (no scratchpad, não no projeto) para abrir as páginas sem cabeça e tirar screenshots reais. Use isso como padrão para confirmar visualmente que uma página renderiza/interage como esperado antes de dar uma tarefa como concluída — especialmente depois de qualquer mudança em `shared/`, já que ela afeta todas as trilhas ao mesmo tempo.
