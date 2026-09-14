/*
  Conteúdo dos documentos de apoio exibidos em prototype/docs/index.html.

  Gerado a partir dos arquivos docs/*.md abaixo — NÃO edite este arquivo à mão,
  edite a doc de origem e rode `node scripts/gen-docs-content.cjs` para
  regenerar. Motivo de não ler docs/*.md direto: vite.config.ts só copia
  prototype/ para dist/prototype no build (copyPrototype), e .dockerignore
  exclui *.md do contexto de build do Docker — então os .md nunca chegam à
  imagem. Por isso o conteúdo é embutido aqui como string, num arquivo .js
  (não afetado pelo .dockerignore).

  Fontes (chave -> docs/*.md):
    - cadastro-empresas-spec <- docs/cadastro-empresas-spec.md
    - 01-cadastro-empresas <- docs/01-cadastro-empresas.md
    - 02-parametros-fiscais <- docs/02-parametros-fiscais.md
    - parametros-fiscais-arquitetura <- docs/parametros-fiscais-arquitetura.md
    - 03-cadastro-socios <- docs/03-cadastro-socios.md
    - 04-registro-contadores <- docs/04-registro-contadores.md
    - 05-importacao-massiva-empresas <- docs/05-importacao-massiva-empresas.md
*/
window.DocsContent = {
  // fonte: docs/cadastro-empresas-spec.md
  "cadastro-empresas-spec": {
    title: `Cadastro de Empresas — Especificação (as-built)`,
    source: "docs/cadastro-empresas-spec.md",
    markdown: `# Cadastro de Empresas — Especificação do estado atual (as-built)

> Este documento descreve **o que existe hoje** no protótipo do Cadastro de Empresas do AutoPilot. Ele não é a especificação original de requisitos — é o retrato funcional da implementação, para que Product Managers validem o que foi construído e planejem as próximas evoluções. Não repete o conteúdo do documento de requisitos original; documenta apenas o comportamento real da tela.

## Visão geral

O Cadastro de Empresas é composto por duas telas:

1. **Listagem de Empresas** — tela inicial, mostra todas as empresas cadastradas.
2. **Cadastro de uma empresa** — aberto ao clicar em uma empresa da listagem, organizado em **7 abas internas**: Dados Gerais, Atividades, Responsável Legal, Quadro Societário, Contadores, Empresa Centralizadora e Histórico de Alterações. Os módulos do AutoPilot habilitados para a empresa aparecem no cabeçalho do cadastro — comum a todas as abas, não é mais uma aba própria (ver "Cabeçalho do cadastro de uma empresa" abaixo).

As abas **Quadro Societário** e **Contadores** só cuidam do *vínculo* entre a empresa aberta e um sócio/contador já existente — o cadastro mestre de cada um (pessoa física, dados próprios) mora fora do Cadastro de Empresas, no módulo de navegação de nível superior **Cadastros Auxiliares** (abas internas "Sócios" e "Registro de Contadores"). Ver \`docs/03-cadastro-socios.md\` e \`docs/04-registro-contadores.md\`.

------------------------------------------------------------------------

## 1. Listagem de Empresas

### Objetivo
Permitir localizar rapidamente uma empresa cadastrada e navegar até seu cadastro completo.

### Comportamento
- Um botão "Importar empresas", no cabeçalho da tela, abre o fluxo de Importação Massiva de Empresas (\`empresas/importar.html\`) — cadastro em lote de empresas a partir de uma planilha, cobrindo apenas o equivalente às abas Dados Gerais e Responsável Legal. Ver \`docs/05-importacao-massiva-empresas.md\` para a especificação completa, incluindo o detalhamento do impacto em cada aba do cadastro.
- Empresas matrizes aparecem com suas filiais agrupadas visualmente e ocultas por padrão; um botão permite expandir/recolher a lista de filiais daquela matriz sem sair da tela.
- Empresas sem relação de matriz/filial ("avulsas") aparecem como linhas simples, misturadas com as matrizes na mesma lista.
- A linha inteira de cada empresa é clicável e leva direto ao cadastro completo dela.
- Existe um filtro de busca (por nome, código ou CNPJ), um filtro de status (Todas / Ativas / Inativas) e um filtro de tipo (Todas / Matrizes / Filiais). Ao escolher "Filiais", a lista mostra todas as filiais soltas, sem o agrupamento por matriz.
- Existe ordenação por Empresa, Código, CNPJ ou Contador responsável.
- A lista é paginada ("Mostrar mais") tanto no nível principal quanto dentro de cada matriz expandida (paginação própria para filiais).
- Ao trocar qualquer filtro, busca ou ordenação, a lista sempre volta a mostrar a primeira página.
- Existe um estado vazio ("Nenhuma empresa encontrada para os filtros selecionados") com atalho para limpar os filtros aplicados.

### Telas
Uma única tela, com barra de filtros no topo e tabela de resultados abaixo.

### Campos implementados
Código, Empresa (nome, com indicação visual de "Matriz"/"Filial" e contagem de filiais quando aplicável), CNPJ, Contador responsável, Status (Ativa/Inativa).

### Regras de negócio implementadas
- Uma filial só aparece agrupada sob sua matriz quando o filtro de tipo está em "Todas" ou "Matrizes"; no filtro "Filiais" ela aparece solta.
- O contador responsável mostrado na listagem é o mesmo vinculado na aba Contadores do cadastro daquela empresa.

### Integrações
Nenhuma integração externa nesta tela — os dados vêm da mesma base usada pelo cadastro individual de cada empresa.

### Pendências
Nenhuma pendência funcional conhecida nesta tela.

### Itens de Fase 2
Não há itens de Fase 2 previstos especificamente para a listagem.

### Decisões de UX adotadas
- A linha inteira é clicável (em vez de um botão "Ver cadastro"), com um ícone de seta como indicação visual residual da ação — decisão tomada para reduzir peso visual e ambiguidade de ter dois elementos clicáveis fazendo a mesma coisa.
- O botão de expandir/recolher filiais é separado e tem sua própria área de clique, para não competir com o clique de abrir o cadastro da matriz.
- A expansão/recolhimento das filiais é animada (altura e rotação do ícone), para deixar clara a relação de hierarquia entre matriz e filiais.
- Linhas de filiais escondidas (recolhidas) ficam fora da navegação por teclado — só é possível chegar até elas com Tab depois de expandir o grupo, para não haver "saltos invisíveis" de foco.
- Nas filiais (tanto na subtabela expandida sob a matriz quanto na lista de filiais soltas, filtro "Filiais"), o nome exibido ao lado da etiqueta "Filial" é Razão social — Nome fantasia, não o campo genérico da empresa usado para a matriz — esse campo é igual para a matriz e todas as suas filiais e por isso não as diferencia; Razão social + Nome fantasia é o que de fato distingue uma filial da outra (ex.: "Metalúrgica Sigma Ltda — Sigma Metais Anápolis" vs. "— Sigma Metais Trindade").

------------------------------------------------------------------------

## 2. Dados Gerais

### Objetivo
Apresentar os dados cadastrais centrais da empresa (identificação, localização e relacionamento comercial), tal como vêm do Cockpit.

### Comportamento
A aba é organizada em blocos temáticos: Identificação, Inscrições, Contato e localização, Contador responsável, Contrato e Complementares. Não há mais nenhum aviso permanente de "origem dos dados" na tela — o botão "Editar", no cabeçalho do cadastro, abre um drawer lateral no próprio Autopilot para alterar a maior parte desses campos (CNPJ, Certificado digital, a seção Contador responsável e a seção Contrato ficam bloqueados no drawer). A relação com o Cockpit é comunicada apenas de forma contextual, no momento da edição (ver "Decisões de UX adotadas" abaixo).

### Telas
Uma única tela (aba "Dados Gerais" dentro do cadastro da empresa).

### Campos implementados
- **Identificação**: Razão social, Nome fantasia, Natureza jurídica, CNPJ, Regime tributário federal.
- **Inscrições**: Inscrição estadual, Inscrição municipal.
- **Contato e localização**: Telefone, E-mail, Endereço completo (logradouro, número, complemento, bairro, município, UF e CEP, apresentados como uma única linha de texto).
- **Relacionamento**: Contador responsável (nome + CRC, com atalho "Ver em Contadores"), Cliente desde, Status do cliente, Início de atividade, Data de inativação (só aparece quando o status é inativo), Duração do contrato.
- **Complementares**: Certificado digital, Observações gerais (com estado vazio "Nenhuma observação cadastrada." quando não há texto).

### Regras de negócio implementadas
- "Data de inativação" só é exibida quando o status do cliente é "Inativo" — para clientes ativos, o campo não aparece.
- O contador responsável exibido aqui é sempre o mesmo mostrado na aba Contadores; um atalho leva direto para lá.

### Integrações
Dados de origem do Cockpit (indicado explicitamente na tela). A edição acontece exclusivamente no Autopilot, dentro deste Cadastro de Empresas — o Cockpit não tem mais um botão de edição associado a esta tela; ele é apenas o destino conceitual das alterações, quando o usuário escolhe refletir a alteração nele. Ao salvar o drawer, um dialog de confirmação pergunta explicitamente se a alteração deve ser refletida no Cockpit ("Salvar e refletir no Cockpit") ou descartada ("Descartar alterações") — não existe salvamento silencioso.

Também é a aba usada para demonstrar a sincronização da Importação Massiva de Empresas com o Cockpit: uma empresa importada em lote aparece aqui com os mesmos campos de qualquer outra empresa, sem nenhuma diferença de tratamento — nenhuma alteração de código nesta aba foi necessária. Ver \`docs/05-importacao-massiva-empresas.md\`, seção "Integração com Cadastro de Empresas e com o Cockpit".

### Pendências
Não existe, em nenhuma tela do sistema, uma forma de alterar qual contador é o responsável por uma empresa — a aba mostra o vínculo, mas não permite geri-lo.

### Itens de Fase 2
Nenhum previsto para esta aba.

### Decisões de UX adotadas
- O botão "Editar" aparece nesta aba e nas abas Atividades e Responsável Legal — as três com conteúdo espelhado do Cockpit e efetivamente editável por aqui. Empresa Centralizadora também espelha o Cockpit, mas não tem botão de edição: a classificação Matriz/Filial é só exibida, sem campo próprio desta empresa para alterar. O badge "Somente leitura" foi removido do cabeçalho por ficar contraditório com a existência do botão de edição.
- **Refinamento de UX (2026-08-21):** o rótulo fixo "Origem dos dados: Cockpit" — antes presente no cabeçalho do card em Dados Gerais, Atividades, Responsável Legal e Empresa Centralizadora — foi removido. Decisão de produto: o Autopilot é a superfície de edição e o Cockpit é só uma superfície de consulta; essa relação é arquitetural e não precisa ocupar espaço permanente na tela. Em vez de uma indicação fixa, a relação com o Cockpit passou a ser comunicada apenas no contexto da edição: (1) no rodapé do drawer "Editar", um texto discreto ("As alterações serão refletidas no Cockpit.") ao lado dos botões de ação; (2) no dialog de confirmação ao salvar, que já pergunta explicitamente se a alteração deve ser refletida no Cockpit; (3) no toast de sucesso ("Alterações salvas e sincronizadas com o Cockpit."). A mesma lógica foi aplicada à frase de abertura da Listagem de Empresas (\`empresas/index.html\`), que descrevia a tela como "somente para visualização" com os dados "lidos do Cockpit" — texto desatualizado desde que a edição passou a acontecer no Autopilot, e removido pelo mesmo motivo.
- Optou-se por não duplicar a razão social da empresa dentro do card (ela já aparece uma vez no cabeçalho do cadastro) — o título do card é genérico ("Dados gerais").
- O card tem largura limitada (não ocupa a tela inteira) porque o conteúdo é uma lista de campos de texto, não uma tabela — segue o mesmo padrão da aba Atividades.

------------------------------------------------------------------------

## 3. Atividades

### Objetivo
Mostrar a classificação de atividade econômica (CNAE) da empresa.

### Comportamento
Mesmo aviso de origem e o mesmo botão "Editar" da aba Dados Gerais — abre um drawer lateral para alterar CNAE principal e CNAEs secundários; nenhum campo desta aba fica bloqueado.

### Telas
- Aba "Atividades", com o card de exibição.
- Drawer lateral "Editar atividades" (CNAE principal, CNAEs secundários).

### Campos implementados
CNAE principal, CNAEs secundários (lista; quando vazia, mostra "Nenhum CNAE secundário cadastrado.").

### Regras de negócio implementadas
- Exibição condicional do estado vazio de CNAEs secundários.
- No drawer, CNAEs secundários é digitado como uma lista separada por vírgula; itens em branco são descartados ao salvar.

### Integrações
Dados de origem do Cockpit, com o mesmo botão "Editar" e o mesmo dialog de confirmação de reflexo no Cockpit descritos na aba Dados Gerais.

### Pendências
- Os CNAEs são mostrados apenas pelo código (ex.: "2599-3/99"), sem a descrição textual da atividade — não há indicação de que essa descrição deva ou não existir.
- O campo "CNAE principal" não tem um estado vazio dedicado (ao contrário de "CNAEs secundários", que mostra "Nenhum CNAE secundário cadastrado."). Isso ficou visível a partir da Importação Massiva de Empresas: como essa funcionalidade não importa CNAE, uma empresa importada mostra o campo "CNAE principal" sem valor nem texto de estado vazio. Ver \`docs/05-importacao-massiva-empresas.md\`, seção "Notas de implementação do protótipo".

### Itens de Fase 2
Nenhum previsto para esta aba.

### Decisões de UX adotadas
Mesmo padrão visual e de edição via drawer da aba Dados Gerais.

------------------------------------------------------------------------

## 4. Responsável Legal

### Objetivo
Apresentar a pessoa física legalmente responsável pela empresa perante os órgãos competentes.

### Comportamento
Mesmo aviso de origem e o mesmo botão "Editar" das abas Dados Gerais e Atividades — abre um drawer lateral para alterar Nome, CPF e Cargo/Qualificação; nenhum campo desta aba fica bloqueado.

### Telas
- Aba "Responsável Legal", com o card de exibição.
- Drawer lateral "Editar responsável legal" (Nome, CPF, Cargo/Qualificação).

### Campos implementados
Nome, CPF, Cargo/Qualificação.

### Regras de negócio implementadas
Nenhuma regra de negócio além da exibição do estado vazio ("Nenhum responsável legal cadastrado.") quando a empresa não tem responsável legal informado.

### Integrações
Dados de origem do Cockpit, com o mesmo botão "Editar" e o mesmo dialog de confirmação de reflexo no Cockpit descritos na aba Dados Gerais.

### Pendências
Nenhuma pendência funcional conhecida nesta aba.

### Itens de Fase 2
Nenhum previsto para esta aba.

### Decisões de UX adotadas
Mesmo padrão visual e de edição via drawer das abas Dados Gerais e Atividades — passa a ser a terceira aba com conteúdo espelhado do Cockpit e editável por aqui.

------------------------------------------------------------------------

## 5. Quadro Societário

### Objetivo
Mostrar e gerenciar quais sócios participam do capital social da empresa, e em qual proporção.

### Comportamento
A aba lista as participações societárias vinculadas à empresa aberta. É possível vincular um sócio já existente (do registro compartilhado em Cadastros Auxiliares → Sócios), editar os dados dessa participação, ou desvincular. Não é uma aba de "somente leitura" — segue o mesmo conceito de vínculo hoje usado também em Contadores.

### Telas
- Aba "Quadro Societário" dentro do cadastro da empresa, com a tabela de participações.
- Painel lateral ("Adicionar sócio" / "Editar participação") para criar ou editar um vínculo.
- Dialog de confirmação para desvincular um sócio.

### Campos implementados
Sócio (nome), CPF, Contato (telefone e e-mail), Tipo de sócio (Administrador ou Cotista), Participação (%), Capital integralizado, Capital a integralizar, Total do capital, Quotas integralizadas, Quotas a integralizar, Total de quotas, Data de entrada, Data de saída.

Os seis campos de capital e quotas (Capital integralizado, Capital a integralizar, Total do capital, Quotas integralizadas, Quotas a integralizar, Total de quotas) aparecem tanto na tabela de resultados da aba quanto no painel lateral de edição de uma participação existente — o mesmo conjunto de dados do vínculo societário em ambos os lugares, sem versão diferente ou incompleta entre tabela e drawer.

### Regras de negócio implementadas
- Um mesmo sócio pode ter participação em mais de uma empresa — o cadastro de sócios é único e compartilhado (Cadastros Auxiliares → Sócios); cada empresa só referencia esse registro com uma participação própria.
- "Adicionar sócio" vincula um sócio **já existente** no registro compartilhado à empresa aberta, com percentual, capital, quotas, tipo e datas próprios dessa empresa. Um mesmo sócio não pode ser vinculado duas vezes à mesma empresa — o combobox já exclui quem já está vinculado.
- "Editar" altera os dados da participação (percentual, capital, quotas, tipo, datas) sem afetar as participações desse sócio em outras empresas. O campo "Sócio" fica bloqueado durante a edição — não é possível trocar de pessoa numa participação existente; para isso, é preciso desvincular e adicionar o sócio correto.
- "Desvincular" (ação antes chamada "Excluir") remove apenas o vínculo do sócio com a empresa aberta, após confirmação num dialog — o sócio continua existindo no registro compartilhado e mantém suas participações em outras empresas.
- "Data de saída" fica em branco (mostrada como "—" na tabela) enquanto o sócio continuar ativo na empresa. Participações encerradas (com data de saída preenchida) continuam aparecendo na tabela, com o intervalo de datas.
- O rodapé da tabela mostra a soma das participações **ativas** (sem data de saída) vinculadas à empresa; quando essa soma é diferente de 100%, um alerta visual pede revisão dos percentuais, sem bloquear o salvamento.
- Participação (%) aceita apenas valores entre 0 e 100 (com casas decimais); Capital integralizado, Capital a integralizar, Quotas integralizadas e Quotas a integralizar aceitam apenas valores não negativos — validação nativa do campo numérico.
- "Total do capital" é a soma de Capital integralizado + Capital a integralizar; "Total de quotas" é a soma de Quotas integralizadas + Quotas a integralizar. Ambos são calculados a partir dos campos editáveis — não são digitados diretamente, nem no drawer nem em nenhum outro lugar — e são recalculados em tempo real enquanto o usuário edita.

### Integrações
Nenhuma integração externa — dado nativo do AutoPilot, compartilhado com o módulo Cadastros Auxiliares → Sócios (mesmo \`localStorage\`, ver \`docs/03-cadastro-socios.md\`).

### Pendências
Nenhuma pendência funcional conhecida nesta aba — o cadastro de um sócio novo já existe em Cadastros Auxiliares → Sócios (ver \`docs/03-cadastro-socios.md\`).

### Itens de Fase 2
Nenhum previsto para esta aba.

### Decisões de UX adotadas
- O botão de ação se chama "+ Adicionar sócio", mas o comportamento real é vincular uma participação — não criar um sócio novo. Essa nomenclatura foi mantida por ser a mais natural do ponto de vista do usuário que está no cadastro de uma empresa, mesmo sabendo que tecnicamente é uma ação de vínculo.
- Os campos "Tipo de sócio", "Data de entrada" e "Data de saída" foram tratados como atributos da participação (o vínculo entre sócio e empresa), não do sócio em si — um mesmo sócio pode ser "Administrador" em uma empresa e "Cotista" em outra, com datas de entrada diferentes em cada uma.
- O contato (telefone/e-mail) foi tratado como atributo do sócio (não muda entre empresas), e por isso é o mesmo em todas as participações daquele sócio.
- As ações "editar" e "desvincular" foram implementadas como botões de texto simples (sem ícone), com sublinhado ao passar o mouse e contorno de foco visível ao navegar por teclado — consistente com o mesmo tratamento dado a outros links de ação no restante da tela.
- A ação de remover vínculo foi renomeada de "excluir" para "desvincular", com um dialog de confirmação explicando que o sócio continua cadastrado no registro unificado — para não sugerir que o cadastro do sócio é apagado. A distinção entre "desvincular" (aqui) e "excluir" (o cadastro do sócio, ação que pertence a Cadastros Auxiliares → Sócios) está registrada em \`docs/03-cadastro-socios.md\`.
- "Data de entrada" e "Data de saída" usam um seletor de calendário em popover (botão + grade de dias navegável por mês) em vez de texto livre — reduz erro de digitação de data e mantém o formato \`dd/mm/aaaa\` já usado no resto da aba. Portado do Design System real (\`docs/design-system/components/ui/date-picker.tsx\` e \`calendar.tsx\`), com duas simplificações deliberadas: navegação só por setas de mês (sem dropdown de mês/ano) e rótulo do botão em \`dd/mm/aaaa\` (não na forma longa do componente original).
- Capital e Quotas ganharam colunas próprias na tabela ("Capital" e "Quotas"), cada uma mostrando o total em destaque e, numa linha secundária, o detalhamento "Integralizado · A integralizar" — mesmo padrão de célula em duas linhas já usado na coluna "Sócio" (nome + CPF) e "Contato" (telefone + e-mail), em vez de acrescentar mais colunas isoladas para cada campo. A coluna "Participação" passou a mostrar só o percentual, já que quotas ganhou coluna própria.
- Valores de capital são exibidos com o prefixo "R$" e separadores de milhar/decimal no padrão pt-BR, mesma convenção usada para valores monetários em outras telas do protótipo (ex.: piso salarial em Sindicatos).
- No drawer, "Total do capital" e "Total de quotas" são exibidos como texto (não como campo de formulário), ao lado do rótulo, e recalculados a cada tecla digitada nos campos "integralizado"/"a integralizar" — reforça visualmente que são valores derivados, não digitáveis.

------------------------------------------------------------------------

## 6. Contadores

### Objetivo
Mostrar e gerenciar quais contadores estão habilitados a atuar sobre a empresa aberta (por exemplo, para assinar demonstrativos).

### Comportamento
A aba lista os contadores vinculados à empresa aberta. É possível vincular um contador já existente (de um registro compartilhado entre todas as empresas — o Registro de Contadores, em Cadastros Auxiliares) ou remover o vínculo. Não é mais uma aba de "somente leitura" — segue exatamente o mesmo conceito já usado na aba Quadro Societário.

### Telas
- Aba "Contadores" dentro do cadastro da empresa, com a tabela de vínculos.
- Painel lateral ("Vincular contador") para selecionar um contador já cadastrado.

### Campos implementados
Nome, CPF, CRC.

### Regras de negócio implementadas
- Um mesmo contador pode atender mais de uma empresa — o cadastro de contadores é único e compartilhado (Registro de Contadores); cada empresa só referencia esse registro através do vínculo \`empresasAtendidas\`.
- "Vincular contador" associa um contador **já existente** no registro compartilhado à empresa aberta. Um mesmo contador não pode ser vinculado duas vezes à mesma empresa — o combobox já exclui quem já está vinculado.
- "Desvincular" remove apenas o vínculo do contador com a empresa aberta — o contador continua existindo no Registro de Contadores e mantém seus vínculos com outras empresas.
- O contador exibido como "Contador responsável" na aba Dados Gerais e na listagem principal é resolvido a partir do mesmo registro compartilhado.

### Integrações
Nenhuma integração externa — dado nativo do AutoPilot, compartilhado com o módulo Cadastros Auxiliares → Registro de Contadores (mesmo \`localStorage\`, ver \`docs/04-registro-contadores.md\`).

### Pendências
- Não foram implementados os campos "Dados de acesso" e "Credenciais necessárias" previstos na especificação original — o significado exato desses campos ainda não está definido claramente o suficiente para implementar com segurança (em especial se envolvem ou não login/senha).
- Não existe, em nenhuma tela, uma forma de definir qual dos contadores vinculados é o "Contador responsável" exibido em Dados Gerais — hoje esse campo é resolvido automaticamente (primeiro contador encontrado que atende a empresa), sem uma ação explícita de "definir como responsável".

### Itens de Fase 2
Nenhum previsto para esta aba.

### Decisões de UX adotadas
- O botão de ação se chama "+ Vincular contador" (em vez de "+ Adicionar contador"), para deixar explícito desde o rótulo que a ação é um vínculo, não um cadastro — mesma decisão de nomenclatura tomada para "+ Adicionar sócio", mas aqui o rótulo já nasce sem ambiguidade.
- Mantida a tabela simples (Nome, CPF, CRC), acrescentando apenas a coluna de ação "desvincular" — sem os campos de participação (percentual, quotas, tipo, datas) que existem em Quadro Societário, porque não fazem sentido para o vínculo de um contador.

------------------------------------------------------------------------

## 7. Empresa Centralizadora

### Objetivo
Indicar se a empresa participa de uma relação de matriz e filiais e, quando participa, qual é o papel de cada empresa do grupo (Matriz ou Filial) — informação de controle mantida no Cockpit, não editável no AutoPilot.

### Comportamento
Aba somente leitura, com o mesmo aviso de origem das abas Dados Gerais, Atividades e Responsável Legal, mas sem botão de edição — ao contrário delas, não existe aqui um campo próprio desta empresa para alterar; a classificação Matriz/Filial é só exibida. Mostra uma tabela com todas as empresas do mesmo grupo (matriz + filiais) quando existe essa relação, ou apenas a própria empresa quando não existe, com a linha da empresa aberta destacada visualmente.

### Telas
Uma única tela (aba "Empresa Centralizadora").

### Campos implementados
Código, Razão social, Tipo de inscrição, Inscrição, Status, Classificação (etiqueta "Matriz", "Filial" ou "Não se aplica").

### Regras de negócio implementadas
- Quando a empresa aberta não tem nenhuma relação de matriz/filial, a tela mostra apenas ela mesma, classificada como "Não se aplica".
- Quando existe relação, a tabela mostra o grupo inteiro (a matriz e todas as suas filiais), com a linha da empresa aberta destacada visualmente.

### Integrações
Dados de origem do Cockpit. Ao contrário das abas Dados Gerais, Atividades e Responsável Legal, esta aba não tem botão "Editar" nem drawer de edição — a edição de empresa acontece no Autopilot, mas não há aqui nenhum campo próprio desta empresa para alterar.

### Pendências
Nenhuma pendência funcional conhecida nesta aba.

### Itens de Fase 2
Nenhum previsto para esta aba.

### Decisões de UX adotadas
- A aba deixou de ter um seletor editável de classificação — decisão de produto de 2026-08-10: o Cockpit já é a fonte de verdade sobre quem é matriz e quem é filial, então um campo duplicando essa classificação dentro do AutoPilot só criaria risco de divergência entre os dois sistemas, sem necessidade real (ver "Empresa Centralizadora" em \`docs/01-cadastro-empresas.md\`). A aba segue somente leitura, com a classificação exibida como etiqueta (mesma linguagem visual do badge "Matriz"/"Filial" já usado no cabeçalho do cadastro e na Listagem de Empresas), sem o botão "Editar" que as demais abas espelhadas do Cockpit passaram a ter.
- A pendência de validação de duplicidade de "Centralizadora" registrada em versões anteriores deste documento deixou de se aplicar: sem edição no AutoPilot, o usuário não tem como criar esse conflito por aqui.

------------------------------------------------------------------------

## 8. Histórico de Alterações

### Objetivo
Permitir visualizar quem alterou os dados da empresa, o que foi alterado e quando ocorreu.

### Comportamento
Aba somente leitura. As alterações são agrupadas por evento de edição: uma mesma ação de salvar reúne, sob um único cabeçalho (data/hora + usuário), todos os campos alterados naquele momento. Cada evento é exibido do mais recente para o mais antigo, com uma tabela própria listando cada campo alterado, o valor anterior e o novo valor.

### Telas
Uma única tela (aba "Histórico de alterações").

### Campos implementados
Por evento: data e hora, usuário responsável. Por campo alterado dentro do evento: nome do campo, valor anterior, novo valor.

### Regras de negócio implementadas
- Os eventos aparecem ordenados do mais recente para o mais antigo.
- Quando a empresa não tem nenhuma alteração registrada, aparece o estado vazio "Nenhuma alteração registrada até o momento."
- Toda ação editável do cadastro de uma empresa gera automaticamente um novo evento nesta aba, com data/hora do momento do salvamento, o usuário mockado do protótipo, o valor anterior e o novo valor — puramente consultivo, para fechar visualmente o laço "editei → aparece no histórico" dentro do protótipo, sem que isso represente uma trilha de auditoria real. Cobertura completa das ações editáveis hoje existentes no cadastro:
  - **Dados Gerais**: editar "Grupo de empresas" (edição inline, nativa do Autopilot) e salvar o drawer "Editar empresa" (Razão social, Nome fantasia, Natureza jurídica, Regime tributário federal, Inscrição estadual, Inscrição municipal, Telefone, E-mail, endereço e Observações gerais — cada campo alterado vira uma linha própria no evento; CNPJ, Certificado digital, Contador responsável e Contrato ficam bloqueados no drawer e nunca geram evento por aqui).
  - **Atividades**: salvar o drawer "Editar atividades" (CNAE principal, CNAEs secundários).
  - **Responsável Legal**: salvar o drawer "Editar responsável legal" (Nome, CPF, Cargo/Qualificação).
  - **Quadro Societário**: adicionar (vincular) sócio, editar participação (cada campo do vínculo que mudou — percentual, capital, quotas, tipo de sócio, datas de entrada/saída — vira uma linha própria no evento) e desvincular sócio.
  - **Contadores**: vincular contador e desvincular contador.
  - Empresa Centralizadora não gera eventos por não ter nenhum campo editável (aba somente leitura, sem botão "Editar").

### Integrações
Nenhuma integração externa — os eventos de exemplo são mockados (\`EmpresasData.getHistoricoAlteracoes\`, em \`empresas/js/data.js\`) e os eventos gerados por edições reais (Grupo de empresas, drawers de Dados Gerais/Atividades/Responsável Legal, Quadro Societário, Contadores) são gravados em \`localStorage\` via \`EmpresasData.registrarEventoHistorico\` (mesmo padrão namespaced já usado para empresas importadas e para o próprio Grupo de Empresas), sem nenhuma chamada a backend ou serviço externo. A decisão de refletir ou não uma edição no Cockpit (dialog de confirmação do drawer) também não tem integração real — é só a simulação da escolha do usuário; quando ele opta por refletir, o evento no Histórico é gravado normalmente; quando opta por descartar, nenhum evento é criado.

### Pendências
- Não há, em nenhuma tela do sistema, uma trilha de auditoria real — todo registro de alteração (data/hora, usuário, campo, valor anterior, novo valor) precisa ser gerado e persistido por uma integração futura (Cockpit ou serviço de auditoria próprio do AutoPilot) antes que esta aba deixe de depender de dado mockado/local. Isso vale inclusive para os eventos gerados pelas ações editáveis do cadastro (Grupo de empresas, drawers de Dados Gerais/Atividades/Responsável Legal, Quadro Societário, Contadores): hoje são só uma simulação client-side (localStorage), não uma gravação de auditoria de verdade. O mesmo vale para a "reflexão no Cockpit": a escolha do usuário não dispara nenhuma chamada real a um sistema Cockpit, que não existe como tela própria neste protótipo.
- Se um novo campo editável for adicionado a qualquer aba no futuro, o registro no Histórico de alterações não é automático — é preciso chamar \`EmpresasData.registrarEventoHistorico\` explicitamente no ponto onde esse novo campo é salvo (mesmo padrão já aplicado em \`dados-gerais.js\`, \`socios.js\` e \`contadores.js\`).
- A estrutura de dados (\`empresa.codigo\` → lista de eventos, cada evento com \`data\`, \`hora\`, \`usuario\` e \`alteracoes[]\`) já está pronta para receber esse dado real sem mudança de forma — apenas troca da fonte mockada/local por uma integração real.

### Itens de Fase 2
Nenhum previsto para esta aba.

### Decisões de UX adotadas
- As alterações foram agrupadas por evento de edição (não como uma lista plana de campo-por-campo) para deixar clara a relação "estas alterações aconteceram juntas, num mesmo salvamento" — mesmo princípio de agrupamento por ação já usado em outras trilhas de auditoria do protótipo.
- Reaproveitado o padrão visual de tabela (\`.table-wrap\`/\`.dtable-compact\`) já usado em Contadores e Quadro Societário para a lista de campos alterados dentro de cada evento, em vez de criar um componente de tabela novo.
- Ao contrário das abas Dados Gerais, Atividades e Responsável Legal, esta aba não exibe o botão "Editar" — o conteúdo não é um espelho de um campo do Cockpit, e sim um registro de auditoria que nunca é editável por nenhuma tela.

------------------------------------------------------------------------

## Cabeçalho do cadastro de uma empresa (comum a todas as abas)

### Objetivo
Identificar a empresa aberta e mostrar, independentemente da aba selecionada, quais módulos do AutoPilot ela tem habilitados — sem depender de uma aba própria só para essa consulta.

### Comportamento
O título do cadastro mostra Razão social, Nome fantasia e CNPJ (formato "Razão social — Nome fantasia — CNPJ"), com o badge de contexto ao lado (Matriz/Filial, quando a empresa participa dessa relação). Nas abas Dados Gerais, Atividades e Responsável Legal, o botão "Editar" aparece ao lado do título e abre o drawer lateral de edição daquela aba — a edição acontece sempre aqui no Autopilot, nunca no Cockpit. Logo abaixo do título, uma linha "Módulos:" lista em etiquetas os módulos habilitados para aquela empresa.

### Telas
Não é uma tela própria — é a área de cabeçalho compartilhada por todas as abas do cadastro, implementada uma única vez (\`empresas/js/detail-common.js\`).

### Campos implementados
Razão social, Nome fantasia, CNPJ (título), badge de tipo (Matriz/Filial), botão "Editar" (nas abas Dados Gerais, Atividades e Responsável Legal), módulos habilitados (Fiscal, DP e/ou Contábil, em etiquetas).

### Regras de negócio implementadas
- Só os módulos habilitados aparecem na lista — ao contrário da antiga aba Módulos, que listava o catálogo completo com status "Habilitado"/"Não habilitado" para cada item, o cabeçalho não repete os módulos não habilitados.
- Quando a empresa não tem nenhum módulo habilitado, aparece o texto "Nenhum módulo habilitado." no lugar das etiquetas.

### Integrações
Nenhuma integração externa — dado nativo do AutoPilot (\`empresa.modulosHabilitados\`).

### Pendências
Nenhuma pendência funcional conhecida.

### Itens de Fase 2
Nenhum previsto.

### Decisões de UX adotadas
- A aba "Módulos" foi descontinuada — decisão de produto de 2026-08-10: por ser uma informação curta (no máximo 3 módulos) e consultada com frequência ao navegar entre abas, faz mais sentido no cabeçalho — visível em qualquer aba — do que atrás de uma navegação própria.
- Diferente da antiga aba (catálogo completo com status Habilitado/Não habilitado por linha, em \`.list-row\`), o cabeçalho mostra só os módulos habilitados, como etiquetas — mais compacto para caber ao lado do título.
- O título do cadastro passou a concatenar Razão social, Nome fantasia e CNPJ (antes só a Razão social), para identificar a empresa em qualquer aba sem precisar abrir Dados Gerais.

------------------------------------------------------------------------

## Divergências em relação aos requisitos originais

Durante a implementação foram tomadas as seguintes decisões, que resultam em uma representação diferente (não necessariamente incompleta) do que estava descrito originalmente:

- **Endereço Completo** foi implementado como uma única linha de texto formatada (logradouro, número, complemento, bairro, município, UF e CEP), em vez de campos separados e rotulados individualmente.
- **Contador Responsável** (Dados Gerais) foi implementado apenas como exibição do vínculo atual + atalho de navegação para a aba Contadores — não como uma tela de gestão desse vínculo ("novo vínculo com cadastro de Contadores").
- **Nome fantasia, Telefone e E-mail** foram incluídos na aba Dados Gerais, além dos campos originalmente listados para essa aba.
- **Empresa é Centralizadora (Sim/Não)**: a decisão pendente na especificação original foi resolvida a favor do Cockpit, assim como Responsável Legal — a aba "Empresa Centralizadora" foi implementada como somente leitura (etiqueta Matriz/Filial/Não se aplica), sem campo binário editável nem seletor de vínculo dentro do AutoPilot.
- **"+ Adicionar sócio"** vincula um sócio já existente no registro compartilhado — não abre um formulário de cadastro de um sócio novo.
- **CPF** foi incluído na aba Contadores, além dos campos originalmente listados.
- **Dados de acesso** e **Credenciais necessárias** (aba Contadores) não foram implementados — o significado desses campos foi considerado ambíguo demais para implementar sem uma definição de produto mais clara.
- Toda a aba **Dados Gerais/Atividades** foi tratada, inicialmente, como 100% somente leitura, inclusive para os campos que a especificação original não marcava explicitamente como vindos do Cockpit (Contador Responsável, Início de Atividade, Status do Cliente, Cliente desde, Data de Inativação, Duração do Contrato). Essa decisão foi revista depois: a premissa passou a ser "a edição acontece exclusivamente no Autopilot" — Contador Responsável e Contrato (Cliente desde, Status do cliente, Início de atividade, Data de inativação, Duração do contrato) continuam bloqueados, mas os demais campos de Dados Gerais e Atividades passaram a ser editáveis por um drawer lateral no cabeçalho do cadastro.
- **Responsável Legal**: a decisão pendente na especificação original (permanecer no AutoPilot ou no Cockpit) foi resolvida a favor do Cockpit — a aba manteve o mesmo aviso de origem das abas Dados Gerais e Atividades, mas, com a revisão acima, passou a ser editável pelo mesmo botão "Editar" e drawer lateral, em vez do antigo atalho ilustrativo "Editar no Cockpit".
- **"+ Vincular contador"** (aba Contadores) vincula um contador já existente no Registro de Contadores (Cadastros Auxiliares) — a aba deixou de ser somente leitura e passou a seguir o mesmo padrão de vínculo já usado em Quadro Societário.
- **Cadastro mestre de Sócios e de Contadores** deixaram de ser apenas uma lacuna do MVP e passaram a existir como telas próprias, fora do Cadastro de Empresas — no módulo de navegação de nível superior **Cadastros Auxiliares** (abas "Sócios" e "Registro de Contadores"). Ver \`docs/03-cadastro-socios.md\` e \`docs/04-registro-contadores.md\`.
- **Lista de módulos habilitados**: deixou de ser uma aba própria ("Módulos") e passou a ser exibida no cabeçalho do cadastro, comum a todas as abas — junto com o título, que passou a mostrar Razão social, Nome fantasia e CNPJ (antes só a Razão social).

------------------------------------------------------------------------

## Pendências gerais (fora do escopo desta implementação)

- **Usuários e Permissões** (Cadastro de Usuários: Nome, E-mail, Perfil, com perfis Administrador/Usuário) — classificado como Essencial na especificação original, mas ainda sem nenhuma tela implementada em todo o Cadastro de Empresas.
- **Dados de acesso / Credenciais necessárias** de Contadores — aguardando definição de produto.

------------------------------------------------------------------------

## Próximas evoluções (Fase 2)

Itens previstos na especificação original para fases futuras, conscientemente não implementados agora:

- Perfil de Empresa (módulos, no cabeçalho do cadastro)
- Importação de Perfil (módulos, no cabeçalho do cadastro)
- Modelos pré-configurados (módulos, no cabeçalho do cadastro)
- Controle de acesso por empresa (Usuários e Permissões, quando essa funcionalidade for implementada)
`,
  },

  // fonte: docs/01-cadastro-empresas.md
  "01-cadastro-empresas": {
    title: `Cadastro de Empresas — Especificação funcional original`,
    source: "docs/01-cadastro-empresas.md",
    markdown: `# Cadastro de Empresas --- AutoPilot

> Documento de especificação funcional otimizado para desenvolvimento.

## Objetivo

Este documento é a **fonte de verdade** para o desenvolvimento das telas
de Cadastro de Empresas do AutoPilot.

Sempre que implementar ou revisar uma tela:

1.  Consulte este documento.
2.  Compare a implementação com os requisitos.
3.  Identifique campos ausentes ou divergentes.
4.  Não implemente funcionalidades fora do escopo.

------------------------------------------------------------------------

# 1. Dados Gerais

## Campos Essenciais

-   [ ] Razão Social *(Cockpit)*
-   [ ] CNPJ *(Cockpit)*
-   [ ] Natureza Jurídica *(Cockpit)*
-   [ ] Regime Tributário Federal *(Cockpit)*
-   [ ] Endereço Completo *(logradouro, número, complemento, bairro,
    município e UF)*
-   [ ] Inscrição Estadual *(Cockpit)*
-   [ ] Inscrição Municipal *(Cockpit)*
-   [ ] Contador Responsável *(novo vínculo com cadastro de Contadores)*
-   [ ] Início de Atividade
-   [ ] Status do Cliente (Ativo/Inativo)

## Campos Desejáveis

-   [ ] Cliente desde
-   [ ] Data de Inativação
-   [ ] Duração do Contrato

## Campos Reaproveitados do Cockpit

-   [ ] Certificado Digital
-   [ ] Observações Gerais

## Critério de Auditoria

A tela deve representar todos os campos acima, respeitando prioridade
Essencial e Desejável.

------------------------------------------------------------------------

# 2. Atividades

## Campos

-   [ ] CNAE Principal
-   [ ] CNAEs Secundários

Origem: Cockpit.

------------------------------------------------------------------------

# 3. Responsável Legal

## Campos

-   [ ] Nome
-   [ ] CPF
-   [ ] Cargo / Qualificação

Observação: Decisão resolvida — os dados permanecem no Cockpit (aba somente leitura, com atalho "Editar no Cockpit").

------------------------------------------------------------------------

# 4. Quadro Societário

## Campos

-   [ ] Sócio
-   [ ] Percentual de Participação
-   [ ] Tipo de Sócio
-   [ ] Data de Entrada
-   [ ] Data de Saída

Relacionamento com Registro de Sócios.

------------------------------------------------------------------------

# 5. Empresa Centralizadora

## Campos

-   [ ] Matriz / Filial *(Cockpit)*

Observação: Decisão resolvida — o papel de cada empresa (Matriz ou
Filial) já existe no Cockpit; a aba apenas exibe essa classificação
(somente leitura, com atalho "Editar no Cockpit"), sem campo editável
de "Empresa é Centralizadora (Sim/Não)" nem seleção manual de vínculo.

------------------------------------------------------------------------

# 6. Módulos Utilizados

## Essencial

-   [ ] Lista de módulos habilitados

Observação: Decisão resolvida — deixou de ser uma aba própria; a lista
de módulos habilitados passou a ser exibida no cabeçalho do cadastro
da empresa (junto do título, com Razão social, Nome fantasia e CNPJ),
visível em qualquer aba.

## Fase 2

-   [ ] Perfil de Empresa
-   [ ] Importação de Perfil

------------------------------------------------------------------------

# 7. Cadastro de Contadores

## Campos

-   [ ] Nome
-   [ ] CRC
-   [ ] Dados de acesso
-   [ ] Credenciais necessárias

Cadastro único, mantido em **Cadastros Auxiliares → Registro de Contadores** (fora do Cadastro de Empresas). Utilizado como referência para o Contador Responsável da empresa e para a aba Contadores (que apenas vincula/desvincula).

------------------------------------------------------------------------

# 8. Cadastro de Sócios

## Campos

-   [ ] Nome
-   [ ] CPF
-   [ ] Dados de Contato

Cadastro único, mantido em **Cadastros Auxiliares → Sócios** (fora do Cadastro de Empresas). Utilizado pelo Quadro Societário.

------------------------------------------------------------------------

# 9. Usuários e Permissões

## Essencial

-   [ ] Cadastro de Usuários
-   [ ] Nome
-   [ ] E-mail
-   [ ] Perfil

### Perfis

-   Administrador
-   Usuário

## Desejável

-   [ ] Controle de acesso por empresa

------------------------------------------------------------------------

# Decisões Pendentes

-   Módulos controlarão liberação de parâmetros?
-   Haverá Perfil de Empresa reutilizável?
-   Usuários serão compartilhados com o Cockpit?

------------------------------------------------------------------------

# Checklist para Claude Code

Para cada aba da interface:

## Verificar

-   Cobertura dos campos
-   Campos ausentes
-   Campos divergentes
-   Campos redundantes
-   Aderência às prioridades
-   Consistência com o Cockpit
-   Qualidade da UX

## Relatório esperado

-   Campos implementados
-   Campos ausentes
-   Divergências
-   Melhorias sugeridas
-   Percentual de cobertura

**Não implementar alterações durante a auditoria.**
`,
  },

  // fonte: docs/02-parametros-fiscais.md
  "02-parametros-fiscais": {
    title: `Parâmetros Fiscais — Especificação de campos (pré-requisitos)`,
    source: "docs/02-parametros-fiscais.md",
    markdown: `  **DOCUMENTO DE PRÉ-REQUISITOS**

**Parâmetros Fiscais --- Autopilot.**

Especificação de campos da tela de Parâmetros Fiscais por empresa --- V1

  -----------------------------------------------------------------------
  **Item**            **Conteúdo**
  ------------------- ---------------------------------------------------
  **Versão**          V1 --- 30/07/2026

  **Autora**          Elizandra --- Especialista Fiscal, Produtos

  **Produto**         Autopilot --- motor de apuração fiscal

  **Escopo            Simples Nacional. Lucro Presumido, Lucro Real,
  prioritário**       isentas e imunes em fase posterior

  **Total de campos** 98 campos em 10 blocos

  **Status**          Pronto para solicitação ao time de desenvolvimento
  -----------------------------------------------------------------------

# **1. Objetivo e escopo.**

Este documento define quais campos a tela de Parâmetros Fiscais precisa
manter por empresa, com o tipo de controle de interface e a origem do
dado, para que o time de desenvolvimento construa as telas do Autopilot
sem depender de interpretação fiscal.

## **Está no escopo**

-   Tela de vigência: linha do tempo de enquadramento, que preserva
    histórico em mudança de regime ou de forma de tributação.

-   Parâmetros por esfera: gerais, federais, estaduais e municipais.

-   Bloco Contábil × Fiscal e registro dos documentos fiscais que a
    empresa emite.

-   Obrigações acessórias e dados de implantação de cliente.

-   A tela é padrão para toda empresa, sem liberação por módulo
    contratado. Campos que não se aplicam ao enquadramento permanecem
    vazios.

## **Está fora do escopo**

-   Emissão de documentos fiscais. O Autopilot não emite nota:
    certificado, ambiente de transmissão, DANFE e CSC saíram desta
    especificação.

-   Cadastro geral da empresa e enquadramento cadastral --- mantidos no
    Cockpit e apenas consumidos aqui.

-   Classificação por documento fiscal: CFOP, CST, CSOSN, NCM, código de
    serviço e retenções sobre serviços tomados --- responsabilidade do
    BHules.

-   Parcelamentos de tributos --- tratados pelo time de compliance.

-   Reforma Tributária: bloco preservado como Em construção, sem
    desenvolvimento nesta rodada.

  -----------------------------------------------------------------------
  **Fronteira do Autopilot.** O Autopilot é o motor de apuração:
  alíquotas, regimes e obrigações por empresa. O enquadramento cadastral
  vem do Cockpit, a classificação por operação vem do BHules e os
  indicadores de apuração vêm do motor de cálculo. A tela de parâmetros
  consolida e expõe --- não é a fonte primária da maior parte dos dados.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **2. Como ler as tabelas.**

*Cada campo traz o controle de interface a construir, a origem do dado,
a prioridade de desenvolvimento e se já existe equivalente no Domínio
Sistemas.*

## **Tipo de campo**

  -----------------------------------------------------------------------
  **Tipo**          **O que o desenvolvimento deve construir**
  ----------------- -----------------------------------------------------
  **Lista           Combo de seleção única, com opções fechadas definidas
  suspensa**        na seção 14

  **Lista           Seleção de zero ou mais opções da mesma lista fechada
  múltipla**        

  **Checkbox**      Marcador booleano, sem lista associada

  **Data**          Seletor de data, com validação de intervalo quando
                    indicado

  **Valor**         Campo numérico monetário ou percentual

  **Texto**         Entrada livre, usada apenas para credenciais

  **Calculado**     Somente leitura: a origem calcula ou fornece e a tela
                    exibe. Nunca editável

  **Cadastro        Grade com inclusão de várias linhas, por UF, imposto
  repetível**       ou competência

  **Regra fixa**    Comportamento do sistema, sem controle na tela.
                    Exibido apenas para documentação

  **Ação**          Botão que dispara rotina de sistema
  -----------------------------------------------------------------------

## **Origem do dado**

  -----------------------------------------------------------------------
  **Origem**        **De onde o dado vem**
  ----------------- -----------------------------------------------------
  **Manual**        Preenchido pelo usuário na própria tela

  **Cockpit**       Enquadramento cadastral. Consumido pelo Autopilot,
                    não editável aqui

  **API gov. ·      Consultado na API pública de CNPJ e persistido no
  Cockpit**         Cockpit

  **Motor de        Indicador de apuração exposto para consulta e
  cálculo**         relatório

  **BHules**        Classificação por operação ou por produto

  **SERPRO**        Consulta automatizada ao SERPRO: implantação do saldo
                    inicial e histórico de onboarding

  **Legislação**    Valor fixo definido em lei, mantido pelo produto

  **Sistema**       Definido por regra interna do Autopilot
  -----------------------------------------------------------------------

## **Prioridade e coluna Domínio**

  -----------------------------------------------------------------------
  **Marcação**      **Significado**
  ----------------- -----------------------------------------------------
  **Essencial**     Sem o campo o Simples Nacional não apura
                    corretamente. Entra no MVP

  **Desejável**     Aplica-se a parte da carteira do Simples Nacional.
                    Entra após o MVP

  **Fase 2**        Depende de evolução do produto

  **Em construção** Modelagem não fechada. Estrutura preservada, sem
                    desenvolvimento nesta rodada

  **Fora de         Aplicável apenas a Lucro Presumido, Lucro Real ou
  escopo**          módulos de outra equipe

  **Domínio: Sim /  Se existe campo equivalente nas telas do Domínio
  Parcial / Não**   Sistemas

  **Selo NOVO**     Campo incluído em revisão interna anterior ao envio
  -----------------------------------------------------------------------

# **3. Vigência de Parâmetros Fiscais.**

*Tela de entrada do módulo. A empresa mantém uma linha do tempo de
vigências, não um único regime sobrescrito.*

  ---------------------------------------------------------------------------------------------
  **Campo**           **Tipo**    **Origem**   **Prior.**      **Dom**   **Regra**
  ------------------- ----------- ------------ --------------- --------- ----------------------
  **Data de início de Data        Manual       **Essencial**   Sim       Primeira vigência
  vigência**                                                             nasce com o cadastro
                                                                         --- data de opção pelo
                                                                         regime ou de início de
                                                                         atividade.

  **Data de fim de    Data        Sistema      **Essencial**   Não       Em branco indica
  vigência**                                                             vigência atual.
                                                                         Preenchida
                                                                         automaticamente ao
                                                                         abrir a vigência
                                                                         seguinte.

  **Regime tributário Calculado   Cockpit      **Essencial**   Parcial   **D01 ---** Trazido do
  do período**                                                           Cockpit. Não editável
                                                                         no Autopilot.

  **Anexo do Simples  Calculado   Motor de     **Essencial**   Parcial   **D03 ---** Apurado
  Nacional do                     cálculo                                pelo motor de cálculo
  período**                                                              conforme a atividade.
                                                                         Exibido, não digitado.

  **Tipo de           Calculado   Cockpit      **Essencial**   Parcial   **D04 ---** Receita
  estabelecimento**                                                      consolidada por raiz
                                                                         de CNPJ; ICMS/ISS
                                                                         segregados por
                                                                         estabelecimento.

  **Empresa em início Calculado   API gov. ·   **Essencial**   Não       Consultada na API
  de atividade**                  Cockpit                                pública de CNPJ e
                                                                         mantida no Cockpit.
                                                                         Menos de 13 meses
                                                                         obriga RBT12
                                                                         proporcionalizada.

  **Motivo da         Calculado   Cockpit      Desejável       Não       **D05 ---** Reflete
  alteração**                                                            apenas histórico. A
                                                                         alteração nasce no
                                                                         Cockpit e o Autopilot
                                                                         registra.

  **Bloqueio da       **Regra     Sistema      **Essencial**   Não       Regra fixa: alteração
  apuração por        fixa**                                             cadastral no Cockpit
  alteração cadastral                                                    gera alerta, abre nova
  NOVO**                                                                 vigência e bloqueia a
                                                                         apuração até análise
                                                                         humana.

  **Pendência de ação **Regra     Sistema      **Essencial**   Não       Regra fixa: excesso de
  humana por excesso  fixa**                                             sublimite abre nova
  de sublimite NOVO**                                                    vigência e alerta. O
                                                                         DAS segue rodando sem
                                                                         ICMS e ISS; a
                                                                         pendência humana é
                                                                         para gerar as guias
                                                                         avulsas dos dois
                                                                         tributos.

  **Nova vigência por **Regra     Sistema      **Essencial**   Não       Regra fixa: cruzamento
  reenquadramento     fixa**                                             de Fator R gera alerta
  calculado NOVO**                                                       e abre nova vigência,
                                                                         sem bloqueio nem
                                                                         pendência.

  **Iniciar nova      Ação        Sistema      **Essencial**   Não       Fecha a vigência atual
  vigência**                                                             e abre a seguinte
                                                                         herdando os parâmetros
                                                                         para revisão.

  **Validação de      Calculado   Sistema      Desejável       Não       Bloqueia sobreposição
  continuidade de                                                        e lacuna entre
  datas**                                                                vigências
                                                                         consecutivas.
  ---------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Nota.** São três níveis de tratamento, do mais restritivo ao mais
  leve. Alteração cadastral no Cockpit bloqueia a apuração até análise
  humana --- é o único evento que para o motor. Excesso de sublimite não
  para nada: o DAS segue sendo apurado sem ICMS e ISS, e abre pendência
  para o humano gerar as guias avulsas dos dois tributos. Cruzamento de
  Fator R apenas abre nova vigência e alerta. Troca de faixa de receita
  bruta apenas alerta, sem nova vigência. Todos os blocos das seções 4 a
  8 nascem versionados já no MVP.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **4. Parâmetros Gerais.**

*Classificação de base da empresa na vigência. Determina quais blocos
seguintes ficam disponíveis e sob quais regras.*

  ----------------------------------------------------------------------------------------------
  **Campo**            **Tipo**    **Origem**   **Prior.**      **Dom**   **Regra**
  -------------------- ----------- ------------ --------------- --------- ----------------------
  **Data de opção pelo Calculado   API gov. ·   **Essencial**   Parcial   Consultada em
  Simples Nacional**               Cockpit                                publica.cnpj.ws e
                                                                          mantida no Cockpit.

  **Anexo(s) e % de    Calculado   Motor de     **Essencial**   Sim       **D03 ---** Preenchido
  receita por                      cálculo                                pelo motor de cálculo,
  atividade**                                                             a título informativo.

  **MEI                Calculado   Cockpit      **Essencial**   Sim       DAS fixo e DASN-SIMEI
  (Microempreendedor                                                      no lugar da DEFIS.
  Individual)**                                                           

  **Código de acesso   Texto       Manual       **Essencial**   Sim       Credencial de
  ao PGDAS-D**                                                            integração com o
                                                                          portal do Simples
                                                                          Nacional.

  **Perfil de          Lista       Sistema      Desejável       Não       **D35 ---** Aplica um
  parametrização por   suspensa                                           conjunto
  atividade NOVO**                                                        pré-configurado de
                                                                          parâmetros conforme a
                                                                          atividade, no cadastro
                                                                          de nova empresa.

  **Regime de          Lista       Motor de     **Essencial**   Sim       **D06 ---** Decisão
  reconhecimento de    suspensa    cálculo                                anual. Vigência atual
  receita**                                                               vem do motor; alerta
                                                                          anual nos anos
                                                                          seguintes, com opção
                                                                          de repetir o regime
                                                                          anterior. Onboarding
                                                                          via SERPRO.

  **RBT12 --- receita  Calculado   Motor de     **Essencial**   Não       Define faixa e
  bruta dos 12 meses               cálculo                                alíquota efetiva.
  anteriores**                                                            Proporcionalizada nos
                                                                          12 primeiros meses de
                                                                          atividade.

  **RBA / RBAA ---     Calculado   Motor de     **Essencial**   Parcial   Base de verificação de
  receita bruta                    cálculo                                limite e sublimite.
  acumulada**                                                             Não confundir com
                                                                          RBT12.

  **Fator R ---        Calculado   Motor de     **Essencial**   Não       FS12 ÷ RBT12r ≥ 28%
  indicador**                      cálculo                                decide Anexo III vs.
                                                                          V. O cruzamento abre
                                                                          nova vigência e
                                                                          alerta, sem bloquear a
                                                                          apuração.

  **Limite de receita  Calculado   Legislação   **Essencial**   Não       R\\$ 4.800.000,00 por
  --- mercado                                                             ano-calendário. Já
  interno**                                                               preenchido conforme
                                                                          legislação.

  **Limite adicional   Calculado   Legislação   **Essencial**   Não       R\\$ 4.800.000,00
  --- exportação**                                                        avaliados
                                                                          separadamente. Não
                                                                          somam com o mercado
                                                                          interno.

  **Sublimite estadual Calculado   Legislação   **Essencial**   Parcial   Fixado em R\\$
  de ICMS/ISS**                                                           3.600.000,00 para
                                                                          todas as UFs.
                                                                          Excedido, o DAS passa
                                                                          a ser apurado sem ICMS
                                                                          e ISS, conforme a
                                                                          seção 3.

  **Aviso de           Valor       Manual       Desejável       Sim       Percentual
  proximidade do                                                          configurável do teto
  limite de                                                               de receita bruta.
  enquadramento**                                                         

  **Aviso de           Valor       Manual       Desejável       Não       Percentual
  proximidade do                                                          configurável do
  sublimite**                                                             sublimite estadual.

  **Aviso de troca de  Checkbox    Manual       Desejável       Sim       Apenas alerta. Muda a
  faixa de receita                                                        alíquota efetiva sem
  bruta**                                                                 gerar nova vigência
                                                                          nem bloquear a
                                                                          apuração.

  **Segmento de        Lista       Manual       Fase 2          Parcial   **D08 ---** A ser
  atividade especial** múltipla                                           especificado após o
                                                                          mapeamento da carteira
                                                                          do Simples Nacional.

  **Forma de apuração  Lista       Manual       Fora de escopo  Parcial   **D10 ---** Somente
  de IRPJ/CSLL**       suspensa                                           Lucro Presumido e
                                                                          Lucro Real.

  **Compensação de     Checkbox    Manual       Fora de escopo  Não       Trava de 30% do lucro
  prejuízo fiscal**                                                       real do período.
                                                                          Somente Lucro Real.
  ----------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Nota.** Os indicadores de apuração --- Anexo, RBT12, RBA e Fator R
  --- são trazidos do motor de cálculo apenas para consulta e extração de
  relatório por cliente. Em onboarding, o histórico é importado via
  SERPRO.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **5. Parâmetros Federais.**

*No Simples Nacional a maior parte dos tributos federais está no DAS.
Este bloco guarda apenas o que tem efeito de apuração ou de relatório.*

  -----------------------------------------------------------------------------------------------
  **Campo**             **Tipo**    **Origem**   **Prior.**      **Dom**   **Regra**
  --------------------- ----------- ------------ --------------- --------- ----------------------
  **INSS patronal fora  Calculado   Motor de     **Essencial**   Não       Consequência do Anexo
  do DAS (Anexo IV)**               cálculo                                IV. Alimenta folha e
                                                                           DCTFWeb, não o DAS.

  **Retenção de INSS    Calculado   Motor de     Desejável       Parcial   Vem do motor de
  sobre serviços                    cálculo                                cálculo. Mantido
  prestados**                                                              apenas para
                                                                           visibilidade e
                                                                           extração de relatório.

  **Tributação          Calculado   BHules       Desejável       Parcial   Classificação por NCM
  monofásica ou ST de                                                      feita no BHules.
  PIS/COFINS**                                                             Apenas exibido no
                                                                           Autopilot, sem
                                                                           parametrização.

  **Opção pela CPRB**   Checkbox    Manual       Desejável       Não       Exceção restrita a
                                                                           atividades do Anexo IV
                                                                           previstas em lei.

  **Percentual de       Lista       Manual       Fora de escopo  Não       **D34 ---** Somente
  presunção de          suspensa                                           Lucro Presumido.
  IRPJ/CSLL**                                                              

  **Adicional de IRPJ** Checkbox    Manual       Fora de escopo  Sim       10% sobre a parcela do
                                                                           lucro acima do limite.

  **Regime de apuração  Lista       Manual       Fora de escopo  Sim       **D11 ---** Cumulativo
  de PIS/COFINS**       suspensa                                           no LP, não cumulativo
                                                                           no LR como regra
                                                                           geral.

  **Direito a crédito   Cadastro    Manual       Fora de escopo  Parcial   Somente regime não
  sobre insumos**       repetível                                          cumulativo.

  **Método de apuração  Lista       Manual       Fora de escopo  Sim       **D12 ---** Somente
  de créditos**         suspensa                                           Lucro Real.

  **Granularidade da    Lista       Manual       Fora de escopo  Sim       **D13 ---** Somente
  EFD-Contribuições**   suspensa                                           Lucro Presumido e
                                                                           Lucro Real.

  **Exclusão do IRRF da Checkbox    Manual       Fora de escopo  Sim       Remessas por
  base da CIDE**                                                           importação de
                                                                           serviços.

  **Dedução de pedágio  Checkbox    Manual       Fora de escopo  Sim       Empresas de transporte
  da base dos                                                              fora do Simples
  federais**                                                               Nacional.
  -----------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Nota.** As retenções sobre serviços tomados (IRRF e CSRF) saíram
  deste bloco: são tratadas no BHules conforme o serviço tomado, não como
  parâmetro de empresa.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **6. Parâmetros Estaduais.**

*Cadastro estadual e as exceções que tiram a empresa da regra geral do
DAS.*

  -----------------------------------------------------------------------------------------
  **Campo**       **Tipo**    **Origem**   **Prior.**      **Dom**   **Regra**
  --------------- ----------- ------------ --------------- --------- ----------------------
  **Condição de   Calculado   Cockpit      **Essencial**   Não       **D14 ---** Derivada
  contribuinte de                                                    do Cockpit: com
  ICMS**                                                             inscrição estadual é
                                                                     contribuinte, sem
                                                                     inscrição é não
                                                                     contribuinte.

  **Substituto    Checkbox    Manual       Desejável       Parcial   Distinguir o papel de
  tributário**                                                       substituto de apenas
                                                                     estar sujeito a ST.

  **Inscrição     Cadastro    Cockpit      Desejável       Não       Uma IE por UF de
  Estadual de     repetível                                          destino, distinta da
  Substituto por                                                     principal. Melhoria
  UF**                                                               solicitada ao Cockpit
                                                                     --- hoje só existe a
                                                                     inscrição principal.

  **Recolher      Checkbox    Manual       Desejável       Sim       Comum em pequenos
  ICMS/ISS com                                                       prestadores e
  valor fixo**                                                       profissionais
                                                                     liberais.

  **Base de       Lista       Manual       Desejável       Sim       **D15 ---** Fundo de
  cálculo do      suspensa                                           Combate à Pobreza, por
  FCP/FECP**                                                         UF de destino.

  **Reduções e    Lista       Manual       Desejável       Sim       **D16 ---** Agrupa as
  deduções da     múltipla                                           deduções específicas
  base do SN**                                                       do regime hoje
                                                                     dispersas em
                                                                     checkboxes.

  **Benefícios e  Cadastro    Manual       Desejável       Sim       Redução de base,
  convênios de    repetível                                          isenção, diferimento e
  ICMS**                                                             crédito presumido, por
                                                                     UF e produto.

  **Perfil do     Lista       Manual       Desejável       Sim       **D17 ---** Define o
  SPED Fiscal**   suspensa                                           nível de detalhe
                                                                     exigido na
                                                                     escrituração.

  **Aproveitar    Checkbox    Manual       Fase 2          Sim       No SN só existe acima
  créditos de                                                        do sublimite (RPA) ou
  ICMS pelas                                                         em crédito de estoque
  entradas**                                                         na saída.

  **Regime        Checkbox    Manual       Fase 2          Parcial   No SN só passa a
  especial de                                                        existir com excesso de
  apuração do                                                        sublimite. É o que a
  ICMS (RPA)**                                                       pendência da seção 3
                                                                     manda configurar.

  **Estorno       Checkbox    Manual       Fora de escopo  Sim       Somente Lucro
  proporcional de                                                    Presumido e Lucro
  crédito de                                                         Real.
  ICMS**                                                             

  **SPED Fiscal   Checkbox    Manual       Fora de escopo  Sim       Indústrias fora do
  --- Bloco K**                                                      Simples Nacional acima
                                                                     de determinado porte.
  -----------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Nota.** DIFAL e antecipação de ICMS nas entradas saíram deste bloco:
  a informação vem do BHules, por operação, e não é parâmetro de empresa.
  CFOP, CSOSN e CST seguem a mesma lógica.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **7. Parâmetros Municipais.**

*Apenas o que é atributo estável da empresa. O que varia por operação
foi devolvido ao BHules.*

  -----------------------------------------------------------------------------------------
  **Campo**        **Tipo**   **Origem**   **Prior.**      **Dom**   **Regra**
  ---------------- ---------- ------------ --------------- --------- ----------------------
  **Forma de       Lista      Manual       **Essencial**   Parcial   **D18 ---** Separa
  cálculo do ISS** suspensa                                          percentual sobre
                                                                     faturamento de ISS
                                                                     fixo, que sai do DAS.

  **ISS fixo por   Lista      Manual       **Essencial**   Sim       **D19 ---** Sociedades
  classe           suspensa                                          uniprofissionais
  profissional**                                                     recolhem por
                                                                     profissional
                                                                     habilitado.

  **Empresa        Checkbox   Manual       Fase 2          Não       Designação municipal
  designada                                                          como responsável por
  substituta de                                                      retenção.
  ISS**                                                              
  -----------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Nota.** Código de serviço da LC 116, alíquota de ISS e fato gerador
  da retenção saíram deste bloco: são destacados nota a nota, não
  parametrizados por empresa. A retenção de ISS e a regra prestador ×
  tomador seguem a mesma lógica.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **8. Reforma Tributária --- IBS, CBS e Imposto Seletivo.**

*Bloco em construção. Estrutura preservada para não perder o
levantamento, sem previsão de desenvolvimento nesta rodada.*

  --------------------------------------------------------------------------------------
  **Campo**       **Tipo**    **Origem**   **Prior.**   **Dom**   **Regra**
  --------------- ----------- ------------ ------------ --------- ----------------------
  **Opção pelo    Lista       Manual       Em           Não       **D21 ---** Opção
  regime de       suspensa                 construção             semestral e
  apuração do                                                     irrevogável no
  IBS/CBS**                                                       semestre (LC 214/2025,
                                                                  art. 47).

  **Aviso de      Checkbox    Manual       Em           Não       Dispara no mês
  janela de opção                          construção             anterior à abertura da
  do IBS/CBS**                                                    janela de opção.

  **CBS/IBS       Calculado   Legislação   Em           Não       Só no Regime
  embutidos no                             construção             Unificado. Percentual
  DAS**                                                           fixado em lei, não
                                                                  editável.

  **Alíquota de   Calculado   Legislação   Em           Não       Fixada anualmente pelo
  referência                               construção             Senado. Referência
  CBS/IBS**                                                       para decisão, não
                                                                  alíquota da nota.

  **Redução de    Lista       BHules       Em           Não       **D31 ---**
  alíquota /      múltipla                 construção             Enquadramento do item
  cesta básica                                                    é classificação do
  (gRed)**                                                        BHules.

  **Imposto       Lista       BHules       Em           Não       **D32 ---** Federal,
  Seletivo (IS)** múltipla                 construção             apurado fora do DAS,
                                                                  independente da opção
                                                                  Unificado ou Híbrido.

  **Split         Checkbox    Manual       Em           Não       Só viável no Regime
  payment**                                construção             Híbrido, onde a
                                                                  apuração é por
                                                                  operação.

  **Operador de   Checkbox    Manual       Em           Não       Responsabilidade
  plataforma                               construção             solidária pelo IBS/CBS
  digital**                                                       de terceiros (LC
                                                                  214/2025, art. 22).
  --------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Nota.** Bloco inteiro marcado como Em construção. A modelagem
  definitiva depende da regulamentação em curso e será retomada em versão
  futura.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **9. Documentos Fiscais da Empresa.**

*O Autopilot não emite documentos fiscais. Este bloco registra apenas
quais documentos a empresa emite e suas séries.*

  -----------------------------------------------------------------------------------------
  **Campo**       **Tipo**    **Origem**   **Prior.**      **Dom**   **Regra**
  --------------- ----------- ------------ --------------- --------- ----------------------
  **Documentos    Lista       BHules       **Essencial**   Parcial   **D22 ---** Preenchido
  fiscais         múltipla                                           conforme as notas
  emitidos**                                                         existentes no BHules.

  **Série e       Cadastro    BHules       **Essencial**   Parcial   Por tipo de documento
  numeração**     repetível                                          e estabelecimento,
                                                                     conforme o BHules.
  -----------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Nota.** Certificado digital, ambiente de transmissão, mensagem do
  DANFE, CSC, importação automática de DF-e e critério de notificação
  foram removidos: pressupõem emissão, que não é responsabilidade do
  Autopilot.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **10. Contábil × Fiscal.**

*Bloco transversal: parâmetro do fiscal que impacta o contábil.
Permanece em Parâmetros Fiscais. A maior parte do comportamento é regra
fixa do sistema.*

  ---------------------------------------------------------------------------------------------
  **Campo**            **Tipo**   **Origem**   **Prior.**      **Dom**   **Regra**
  -------------------- ---------- ------------ --------------- --------- ----------------------
  **Gerar lançamentos  **Regra    Sistema      **Essencial**   Sim       Regra fixa: Entradas,
  contábeis            fixa**                                            Saídas e Serviços
  automaticamente**                                                      geram lançamento
                                                                         automático nos três
                                                                         departamentos.

  **Classificação de   Lista      Manual       **Essencial**   Sim       **D27 ---**
  conta ---            suspensa                                          Parametrizável por
  Fornecedores**                                                         empresa.

  **Classificação de   Lista      Manual       **Essencial**   Sim       **D27 ---**
  conta --- Clientes** suspensa                                          Parametrizável por
                                                                         empresa.

  **Tipo de lançamento **Regra    Sistema      **Essencial**   Sim       Regra fixa: analítico,
  contábil**           fixa**                                            na data do movimento.

  **Conta              **Regra    Sistema      **Essencial**   Sim       Regra fixa: evita
  cliente/fornecedor   fixa**                                            conta transitória
  em pagamento à                                                         quando não há
  vista**                                                                parcelamento.

  **Cupom fiscal pelo  Checkbox   Manual       Desejável       Não       Sobrepõe a regra de
  valor total NOVO**                                                     tipo de lançamento
                                                                         quando marcado.
                                                                         Indicado para grandes
                                                                         volumes.

  **Separar frete,     Checkbox   Manual       Desejável       Sim       Detalha a composição
  pedágio, seguro,                                                       do valor contábil.
  despesas e                                                             Parametrizável por
  desconto**                                                             empresa.

  **Separar IPI e ICMS Checkbox   Manual       Desejável       Sim       Relevante em compras
  ST das entradas**                                                      de indústria ou de
                                                                         substituto tributário.
                                                                         Parametrizável por
                                                                         empresa.

  **Controle de        Lista      Manual       Desejável       Sim       **D29 ---** Condiciona
  estoque**            suspensa                                          inventário, Bloco H e
                                                                         Bloco K.

  **Ajuste a Valor     Checkbox   Manual       Fase 2          Sim       Baixa prioridade para
  Presente (AVP)**                                                       o perfil típico de
                                                                         cliente SN.

  **Mostrar rateio de  Checkbox   Manual       Fase 2          Não       Previsto para versão
  centro de custos                                                       futura.
  NOVO**                                                                 

  **Gerar lançamentos  Checkbox   Manual       Fase 2          Não       Previsto para versão
  em outra empresa                                                       futura.
  NOVO**                                                                 

  **Gerar lançamento   Checkbox   Manual       Fora de escopo  Não       Somente regimes não
  dos créditos de PIS                                                    cumulativos.
  e COFINS NOVO**                                                        

  **Honorários ---     Checkbox   Manual       Fora de escopo  Sim       Módulo de honorários
  variáveis com valor                                                    próprio.
  de impostos**                                                          

  **Reduções Z e Cupom Checkbox   Manual       Fora de escopo  Sim       Somente varejo físico
  Fiscal Eletrônico**                                                    com PDV.
  ---------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Nota.** Regra fixa significa comportamento do sistema, sem controle
  na tela. As separações de frete, pedágio, seguro, despesas, desconto,
  IPI e ICMS ST seguem parametrizáveis por empresa --- decisão
  confirmada, não migram para regra fixa.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **11. Obrigações Acessórias.**

*Quais obrigações a empresa entrega, com que periodicidade e por qual
credencial.*

  -------------------------------------------------------------------------------------------------
  **Campo**               **Tipo**    **Origem**   **Prior.**      **Dom**   **Regra**
  ----------------------- ----------- ------------ --------------- --------- ----------------------
  **PGDAS-D e DAS**       Calculado   Motor de     **Essencial**   Sim       Mensal por
                                      cálculo                                determinação legal,
                                                                             obrigatório mesmo sem
                                                                             movimento. Acima do
                                                                             sublimite, apurado sem
                                                                             ICMS e ISS.

  **Guias avulsas de ICMS **Regra     Sistema      **Essencial**   Não       Habilitadas
  e ISS NOVO**            fixa**                                             automaticamente com
                                                                             excesso de sublimite.
                                                                             Geradas por ação
                                                                             humana a partir da
                                                                             pendência da seção 3.

  **DEFIS**               **Regra     Sistema      **Essencial**   Sim       Habilitada
                          fixa**                                             automaticamente para
                                                                             optante do Simples
                                                                             Nacional. Somente
                                                                             leitura.

  **DASN-SIMEI**          **Regra     Sistema      **Essencial**   Não       Habilitada
                          fixa**                                             automaticamente para
                                                                             MEI, substituindo a
                                                                             DEFIS. Somente
                                                                             leitura.

  **eSocial ---           Checkbox    Manual       **Essencial**   Não       Vínculo com folha; o
  parametrização básica**                                                    Fator R depende da
                                                                             FS12.

  **DeSTDA**              **Regra     Sistema      Desejável       Não       Habilitada
                          fixa**                                             automaticamente para
                                                                             optante do SN com
                                                                             inscrição estadual.
                                                                             Somente leitura.

  **DTE-SN --- Domicílio  Checkbox    Manual       Desejável       Não       Canal oficial de
  Tributário Eletrônico**                                                    ciência de intimações
                                                                             do optante do SN.

  **Procuração eletrônica Lista       Manual       Desejável       Sim       **D23 ---** Emissão de
  / Integra Contador**    suspensa                                           guias e declarações
                                                                             com certificado do
                                                                             escritório.

  **EFD-Reinf e DCTFWeb** Checkbox    Manual       Desejável       Sim       Quando há retenções
                                                                             federais a declarar.

  **EFD-ICMS/IPI (SPED    Checkbox    Manual       Desejável       Sim       **D17 ---** No SN,
  Fiscal)**                                                                  exigida por algumas
                                                                             UFs em situações
                                                                             específicas.

  **MIT --- Módulo de     Checkbox    Manual       Desejável       Sim       Exceções: IOF,
  Inclusão de Tributos**                                                     importação, IR sobre
                                                                             aplicações, ganho de
                                                                             capital.

  **SINTEGRA**            Checkbox    Manual       Fase 2          Sim       Residual, com dados de
                                                                             NFC-e. Confirmar
                                                                             vigência por UF.

  **EFD-Contribuições**   Checkbox    Manual       Fora de escopo  Sim       Obrigatória fora do
                                                                             Simples Nacional.

  **ECF / e-LALUR**       Checkbox    Manual       Fora de escopo  Não       Apuração anual de
                                                                             IRPJ/CSLL fora do SN.

  **SPED Contábil**       Checkbox    Manual       Fora de escopo  Sim       Inventário e contas a
                                                                             pagar e receber,
                                                                             quando aplicável.
  -------------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Nota.** DEFIS, DASN-SIMEI e DeSTDA são habilitadas automaticamente
  pelo sistema, em modo somente leitura: DEFIS para todo optante do
  Simples Nacional, DASN-SIMEI para o MEI em substituição à DEFIS, e
  DeSTDA para o optante que possui inscrição estadual.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **12. Implantação e Saldo Inicial. AGUARDANDO DEFINIÇÃO DO ONBOARDING**

*Dados de corte na migração de um cliente ativo. A carga será
automatizada por consulta ao SERPRO, com o fluxo ainda em definição.*

  ----------------------------------------------------------------------------------------------
  **Campo**            **Tipo**    **Origem**   **Prior.**      **Dom**   **Regra**
  -------------------- ----------- ------------ --------------- --------- ----------------------
  **Data de corte do   Data        SERPRO       **Essencial**   Parcial   Competência de
  saldo inicial**                                                         referência da
                                                                          migração. Derivada da
                                                                          última competência
                                                                          declarada.

  **Saldo inicial por  Cadastro    SERPRO       **Essencial**   Sim       Relação completa de
  imposto              repetível                                          impostos ao final
  (credor/devedor)**                                                      desta seção, mantida
                                                                          para expansão aos
                                                                          demais regimes.

  **Receita bruta      Cadastro    SERPRO       **Essencial**   Não       Extraída da última
  mensal dos 12 meses  repetível                                          declaração do Simples
  anteriores**                                                            Nacional. Sem ela não
                                                                          há RBT12.

  **Folha de salários  Cadastro    SERPRO       **Essencial**   Não       Extraída da última
  dos 12 meses         repetível                                          declaração do Simples
  anteriores**                                                            Nacional. Sem ela não
                                                                          há Fator R.

  **Receita bruta      Valor       SERPRO       **Essencial**   Não       Base de verificação de
  acumulada do                                                            limite e sublimite no
  ano-calendário                                                          ano da migração.
  (RBA)**                                                                 
  ----------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Nota.** A implantação do saldo inicial será automatizada por consulta
  via SERPRO --- aguardando definição do onboarding. Até que o fluxo
  esteja definido, tratar a digitação manual como contingência. A relação
  completa de impostos foi preservada da versão anterior, prevendo a
  expansão para os demais regimes. Parcelamentos são tratados pelo time
  de compliance e não fazem parte do motor.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

## **Relação de impostos do saldo inicial**

1 --- ICMS · 3 --- ISS · 8 --- Diferencial de alíquota · 9 ---
Substituição tributária · 16 --- IRRF · 17 --- PIS não cumulativo · 18
--- ISS retido · 25 --- Contribuições retidas na fonte · 26 --- INSS
retido · 27 --- ICMS antecipado · 31 --- ICMS antecipação total (ST) ·
44 --- Simples Nacional · 63 --- IRRF pessoa física · 117 --- CIDE · 133
--- PIS importação · 134 --- COFINS importação

# **13. Dependências e integrações.**

*A tela de Parâmetros Fiscais consome dados de 6 fontes externas. Cada
uma tem um responsável e uma ação associada.*

  ----------------------------------------------------------------------------
  **Origem**       **O que o Autopilot        **Responsável e ação**
                   consome**                  
  ---------------- -------------------------- --------------------------------
  **Cockpit**      Regime tributário, tipo de Três solicitações de melhoria em
                   estabelecimento, MEI,      aberto, detalhadas na tabela
                   condição de contribuinte   seguinte.
                   de ICMS, data de opção     
                   pelo SN, indicador de      
                   início de atividade e      
                   inscrições estaduais por   
                   UF.                        

  **BHules**       Documentos emitidos e      Classificação por operação ou
                   séries, tributação         por produto. Nenhum desses itens
                   monofásica por NCM,        é parâmetro de empresa.
                   retenções sobre serviços   
                   tomados, DIFAL e           
                   antecipação de ICMS,       
                   código de serviço,         
                   alíquota de ISS, fato      
                   gerador da retenção e      
                   segregação de receita do   
                   PGDAS-D.                   

  **Motor de       Anexo e % de receita por   Exposto na tela apenas para
  cálculo**        atividade, RBT12,          consulta e extração de relatório
                   RBA/RBAA, Fator R, INSS    por cliente.
                   patronal do Anexo IV,      
                   retenção de INSS sobre     
                   prestados, PGDAS-D e DAS.  

  **SERPRO**       Todo o bloco de            A carga do saldo inicial será
                   implantação: data de       automatizada por consulta ao
                   corte, saldo inicial por   SERPRO. Aguardando definição do
                   imposto, receita bruta     onboarding: quais competências
                   mensal dos 12 meses, folha consultar, com que credencial e
                   de salários dos 12 meses e em que etapa da entrada do
                   RBA. Também o regime de    cliente.
                   reconhecimento de receita  
                   e os indicadores de        
                   apuração no onboarding.    

  **Legislação**   Limite de receita do       Valores fixos mantidos pelo
                   mercado interno e de       produto, não editáveis por
                   exportação e sublimite     empresa.
                   estadual de R\\$ 3,6 mi.    

  **Compliance**   Parcelamentos de tributos. Fora do escopo do motor. Tratado
                                              pelo time de compliance.
  ----------------------------------------------------------------------------

## **Solicitações de melhoria ao time do Cockpit**

*Três itens dependem de evolução do Cockpit antes de o Autopilot
conseguir preencher os campos correspondentes.*

  -------------------------------------------------------------------------
  **Solicitação**   **O que muda no Cockpit**       **Campos impactados**
  ----------------- ------------------------------- -----------------------
  **Consulta à API  Preencher automaticamente a     §3 Empresa em início de
  pública de CNPJ** data de opção pelo Simples      atividade · §4 Data de
                    Nacional e o indicador de       opção pelo Simples
                    início de atividade a partir de Nacional
                    publica.cnpj.ws/cnpj/, em vez   
                    de digitação manual.            

  **Inscrições      Hoje o Cockpit mantém apenas a  §6 Inscrição Estadual
  estaduais nas     inscrição estadual principal.   de Substituto por UF ·
  demais UFs**      Incluir cadastro repetível de   §6 Condição de
                    inscrição por UF, com marcação  contribuinte de ICMS
                    de qual é inscrição de          
                    substituto tributário.          

  **Evento de       Publicar evento quando regime   §3 Regime tributário ·
  alteração         tributário, tipo de             §3 Motivo da alteração
  cadastral**       estabelecimento, MEI ou         · §6 Condição de
                    inscrição estadual mudarem,     contribuinte de ICMS
                    para o Autopilot alertar e      
                    refletir a mudança na           
                    parametrização.                 
  -------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Inscrição estadual em demais UFs.** O Cockpit mantém hoje apenas a
  inscrição estadual principal da empresa. Empresa substituta tributária
  precisa de inscrição própria em cada UF de destino, o que exige
  cadastro repetível por UF no Cockpit --- não no Autopilot. Enquanto a
  melhoria não existir, o campo da seção 6 fica sem fonte e a apuração de
  ST interestadual não pode ser automatizada.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **14. Dicionário de listas suspensas.**

*Conteúdo exato de cada lista fechada referenciada nas tabelas
anteriores. O desenvolvimento não deve criar opções fora desta relação
sem validação fiscal.*

  -----------------------------------------------------------------------------
  **Domínio**              **Opções**
  ------------------------ ----------------------------------------------------
  **D01 --- Regime         • Simples Nacional • Simples Nacional --- MEI •
  tributário do período**  Simples Nacional --- excesso de sublimite • Lucro
                           Presumido • Lucro Real • Imune • Isenta

  **D03 --- Anexo do       • Anexo I --- Comércio • Anexo II --- Indústria •
  Simples Nacional**       Anexo III --- Serviços • Anexo IV --- Serviços (INSS
                           patronal fora do DAS) • Anexo V --- Serviços

  **D04 --- Tipo de        • Matriz • Filial
  estabelecimento**        

  **D05 --- Motivo da      • Opção inicial pelo regime • Início de atividade •
  alteração de vigência**  Mudança de regime tributário • Mudança de Anexo do
                           SN • Reclassificação por Fator R • Impedimento de
                           ICMS/ISS por sublimite • Exclusão por excesso de
                           limite • Opção/alteração de regime IBS-CBS •
                           Correção cadastral no Cockpit • Outro

  **D06 --- Regime de      • Competência • Caixa
  reconhecimento de        
  receita**                

  **D08 --- Segmento de    • Revenda de veículos usados • Entidade financeira
  atividade especial**     ou equiparada • Propaganda e publicidade • Posto de
                           combustível (varejista) • Salão-parceiro • Empresa
                           Simples de Crédito (ESC) • Atividade sujeita ao
                           Fator R • Transporte de cargas • Transporte de
                           passageiros (modalidade permitida) • Escritório de
                           serviços contábeis • Locação de bens móveis •
                           Farmácia de manipulação • Nenhum

  **D10 --- Forma de       • Trimestral (definitivo) • Anual por estimativa
  apuração de IRPJ/CSLL**  mensal • Não aplicável (Simples Nacional)

  **D11 --- Regime de      • Cumulativo • Não cumulativo • Misto • Não
  apuração de PIS/COFINS** aplicável (Simples Nacional)

  **D12 --- Método de      • Apropriação direta • Rateio proporcional com base
  apuração de créditos de  na receita bruta
  PIS/COFINS**             

  **D13 --- Granularidade  • Apuração completa • Apuração por nota fiscal
  da EFD-Contribuições**   

  **D14 --- Condição de    • Contribuinte --- possui inscrição estadual • Não
  contribuinte de ICMS     contribuinte --- sem inscrição estadual
  (derivada do Cockpit)**  

  **D15 --- Base de        • Alíquota do ICMS da nota • Alíquota do ICMS do
  cálculo do FCP/FECP**    movimento de estoque • Não calcular

  **D16 --- Reduções e     • Deduzir ICMS-ST da receita bruta • Deduzir pedágio
  deduções da base do      (operações de transporte) • Dedução para emissoras
  Simples Nacional**       de rádio e TV (horário gratuito) • Não utilizar
                           redução da BC da tabela de alíquota municipal •
                           Considerar todas as casas decimais na redução de BC
                           do ICMS • Aplicar redução de BC do ICMS com receita
                           acumulada zerada • Empresa inscrita no CADIN --- sem
                           benefício de redução de BC de ICMS • Redução de ICMS
                           por lei estadual específica • Nenhuma

  **D17 --- Perfil do SPED • Perfil A • Perfil B • Perfil C • Não obrigada
  Fiscal**                 

  **D18 --- Forma de       • Percentual sobre faturamento (dentro do DAS) • ISS
  cálculo do ISS**         fixo por profissional habilitado • ISS fixo
                           municipal (fora do DAS) • ISS por regime especial
                           municipal

  **D19 --- Classe         • Advocacia • Contabilidade • Medicina • Odontologia
  profissional (ISS        • Engenharia • Arquitetura • Psicologia •
  fixo)**                  Fisioterapia • Veterinária • Outra • Não aplicável

  **D21 --- Regime de      • Regime Unificado --- IBS/CBS dentro do DAS •
  apuração do IBS/CBS      Regime Híbrido/Regular --- IBS/CBS fora do DAS • Não
  (SN)**                   optado (regra padrão: Unificado)

  **D22 --- Documentos     • NF-e (modelo 55) • NFC-e (modelo 65) • NFS-e •
  fiscais emitidos pela    CT-e • CT-e OS • MDF-e • NF3e • BP-e • NFCom
  empresa**                

  **D23 --- Titularidade   • Certificado da própria empresa • Certificado do
  da procuração            contador (com procuração) • Procuração eletrônica
  eletrônica**             e-CAC

  **D27 --- Classificação  • Conta única para todos • Uma conta por cadastro •
  de conta contábil        Uma conta por cadastro, código igual ao da conta
  (cliente/fornecedor)**   

  **D29 --- Controle de    • Não controla • Controla por quantidade • Controla
  estoque**                por quantidade e valor

  **D31 --- Grupos de      • Cesta básica nacional --- alíquota zero •
  redução de alíquota      Alimentos para consumo humano • Medicamentos e
  IBS/CBS (gRed)**         dispositivos médicos • Serviços de saúde • Serviços
                           de educação • Produtos agropecuários e insumos •
                           Profissional liberal regulamentado • Nenhum

  **D32 --- Categorias do  • Bebidas alcoólicas • Bebidas açucaradas • Produtos
  Imposto Seletivo**       fumígenos • Veículos • Embarcações e aeronaves •
                           Bens minerais extraídos • Jogos e apostas • Não
                           sujeita ao Imposto Seletivo

  **D35 --- Perfil de      • Comércio --- Anexo I • Indústria --- Anexo II •
  parametrização           Serviços --- Anexo III • Serviços --- Anexo IV •
  pré-configurado**        Serviços --- Anexo V • Escritório de serviços
                           contábeis • Transporte de cargas • MEI • Sem perfil
                           --- parametrização manual

  **D34 --- Percentual de  • 1,6% --- revenda de combustíveis • 8% --- comércio
  presunção de IRPJ/CSLL** e indústria (IRPJ) • 12% --- comércio e indústria
                           (CSLL) • 16% --- transporte de passageiros • 32% ---
                           serviços em geral
  -----------------------------------------------------------------------------

# **15. Decisões tomadas.**

*Definições fechadas pela PO em 29/07/2026, já aplicadas nas seções
anteriores. A coluna de impacto indica onde cada decisão foi refletida.*

  ---------------------------------------------------------------------------
  **Tema**          **Decisão**               **Impacto na especificação**
  ----------------- ------------------------- -------------------------------
  **Plano de ação   Alertar, criar nova       Regra fixa na seção 3. É o
  Cockpit →         vigência e bloquear a     único evento que bloqueia a
  Autopilot**       apuração para análise     apuração: o Autopilot nunca
                    humana.                   aplica mudança cadastral
                                              silenciosamente.

  **Automatismo de  Fator R e faixa não       Regra fixa própria na seção 3.
  vigência**        bloqueiam a apuração:     Troca de faixa apenas alerta,
                    geram alerta e, no caso   sem nova vigência.
                    do Fator R, nova          
                    vigência.                 

  **Excesso de      O DAS continua rodando,   Terceiro nível de tratamento na
  sublimite**       sem ICMS e ISS. A         seção 3. Nada é bloqueado. Cria
                    interação humana é        a entrega de guias avulsas na
                    solicitada para gerar as  seção 11 e aciona o RPA na
                    guias avulsas dos dois    seção 6.
                    tributos.                 

  **Versionamento   Todos os blocos das       Nenhum bloco fica fora do
  por vigência**    seções 4 a 8 nascem       histórico. O reprocessamento
                    versionados já no MVP.    por competência vale para toda
                                              a parametrização.

  **Liberação por   Não há liberação por      Sem gating por contrato.
  módulo**          módulo. A tela é padrão   Registrado no escopo da seção
                    para toda empresa; campos 1.
                    que não se enquadram      
                    ficam vazios.             

  **Perfil de       Sim. Criar perfis         Novo campo na seção 4, com a
  empresa**         pré-configurados conforme lista D35 de perfis por Anexo e
                    a atividade da empresa.   atividade.

  **Dono do bloco   Tela transversal:         A seção 10 permanece em
  contábil**        parâmetro do fiscal que   Parâmetros Fiscais, sem migrar
                    impacta o contábil.       para o módulo Contábil.

  **Separações      Seguem parametrizáveis    Frete, pedágio, seguro,
  contábeis**       por empresa.              despesas, desconto, IPI e ICMS
                                              ST continuam como checkbox. Não
                                              viram regra fixa.

  **DASN-SIMEI**    Sim, habilitar            Passa a regra fixa somente
                    automaticamente para MEI. leitura, no mesmo modelo de
                                              DEFIS e DeSTDA.

  **pCredSN**       Pode excluir.             Campo removido do bloco
                                              Estaduais e registrado na seção
                                              de campos removidos.

  **Tributação      Apenas exibir no          Mantido como somente leitura
  monofásica**      Autopilot.                com origem BHules. Nenhuma
                                              parametrização por empresa.

  **Segmento de     O escopo da próxima       Campo permanece Fase 2. O
  atividade         versão é o mapeamento da  próximo passo é o levantamento
  especial**        carteira para análise do  da carteira, não o
                    campo.                    desenvolvimento.
  ---------------------------------------------------------------------------

# **16. Decisões pendentes.**

*O que segue em aberto após a rodada de definições.*

  -----------------------------------------------------------------------
  **Tema**          **Pergunta a responder**
  ----------------- -----------------------------------------------------
  **V2 de alteração Desenhar o fluxo completo de mudança de regime
  de regime**       tributário entre Cockpit e Autopilot. Mantido como
                    pendente por decisão da PO.

  **Onboarding do   Definir o fluxo de consulta ao SERPRO: quais
  saldo inicial**   competências carregar, qual credencial usar, em que
                    etapa do onboarding roda e o que acontece se a
                    consulta falhar ou vier incompleta.

  **Geração das     A guia de ICMS varia por UF --- GNRE, DARE, DAE,
  guias avulsas**   entre outras --- e a de ISS por município. Definir se
                    o Autopilot emite o documento, apenas calcula o valor
                    para emissão manual pelo operador, ou integra por UF
                    e por município. O esforço muda por ordem de
                    magnitude entre as três opções.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Ponto de atenção.** Os três níveis de tratamento estão fechados. O
  ponto que resta não é mais de regra, e sim de escopo: a guia avulsa de
  ICMS varia por UF e a de ISS por município, então \\"gerar as guias\\"
  pode significar calcular o valor para o operador emitir por fora, ou
  integrar com dezenas de emissores estaduais e municipais. É a diferença
  entre um campo e uma frente de trabalho própria. Recomendável começar
  pelo cálculo do valor, com emissão manual, e integrar depois conforme a
  demanda real da carteira.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **17. Campos removidos até esta versão.**

*Registro do que saiu da especificação e por quê, para que a exclusão
não seja reintroduzida por engano em revisões futuras.*

  --------------------------------------------------------------------------
  **Campo removido**      **Bloco**     **Motivo**
  ----------------------- ------------- ------------------------------------
  **CRT --- Código de     Vigência      O motor não emite notas fiscais.
  Regime Tributário**                   

  **Marcadores de         Gerais        Segregação feita por emissões
  segregação de receita                 realizadas --- totalizador do
  (PGDAS-D)**                           BHules.

  **Retenção de IRRF      Federais      Serviço tomado. Tratado no BHules.
  sobre serviços**                      

  **Retenção de CSRF na   Federais      Serviço tomado. Tratado no BHules.
  fonte**                               

  **DIFAL e antecipação   Estaduais     Informação vem do BHules, por
  de ICMS nas entradas**                operação.

  **Código de serviço (LC Municipais    Destacado nota a nota.
  116/2003)**                           

  **Alíquota de ISS**     Municipais    Destacada nota a nota.

  **Fato gerador da       Municipais    Destacado nota a nota.
  retenção de ISS**                     

  **Titularidade do       Documentos    Pressupõe emissão de nota.
  certificado digital**                 

  **Ambiente de           Documentos    Pressupõe emissão de nota.
  transmissão**                         

  **Mensagem padrão no    Documentos    Pressupõe emissão de nota.
  DANFE**                               

  **Importação automática Documentos    Pressupõe emissão e entrada de nota.
  de DF-e**                             

  **Critério de           Documentos    Pressupõe entrada de nota.
  notificação de                        
  importação**                          

  **CSC --- Código de     Documentos    Pressupõe emissão de NFC-e.
  Segurança do                          
  Contribuinte**                        

  **pCredSN --- alíquota  Estaduais     Tag de NF-e. O Autopilot não emite
  efetiva de crédito**                  nota.

  **Parcelamentos ativos  Implantação   Tratado pelo time de compliance.
  de tributos**                         
  --------------------------------------------------------------------------

# **18. Nota de versão.**

Esta é a V1 do documento de pré-requisitos: a primeira versão enviada ao
time de desenvolvimento. Houve múltiplas rodadas de revisão interna
antes deste envio --- mapeamento contra as telas do Domínio Sistemas,
ajuste da fronteira entre Autopilot, Cockpit e BHules, e uma rodada de
definições da PO sobre vigência, sublimite e Fator R --- mas nenhuma
delas chegou a ser compartilhada com a equipe técnica. Por isso não há
numeração de versões anteriores: tudo o que essas rodadas produziram já
está consolidado nas seções acima.

# **19. Documentos de apoio.**

-   \\"Cadastro de Empresas --- Autopilot\\" --- cadastro geral, fora do
    escopo desta tela.

-   \\"Parâmetros Fiscais --- Domínio Sistemas (referência)\\" --- telas
    reais e correspondência campo a campo.

-   Mockup interativo desta especificação:
    parametros_fiscais_autopilot.html.

-   API pública de CNPJ usada pelo Cockpit: publica.cnpj.ws/cnpj/.

-   Base legal principal: LC 123/2006, Res. CGSN 140/2018 e LC 214/2025.

[[Parametros_Fiscais_Dominio_ReferenciaV1]{.underline}](https://docs.google.com/document/d/1HJEtiqYRMM1lzPuqJNcO6Fln4M4A7yhpmQq8Qr3NJiU/edit?tab=t.0)

[[Parâmetros Fiscais (TELAS) - Domínio
Sistema]{.underline}](https://docs.google.com/document/d/1xHI2zkWHKHP9WTnuPzBrCPtXJzF-egZCxtITjHi3Lc4/edit?tab=t.0)
`,
  },

  // fonte: docs/parametros-fiscais-arquitetura.md
  "parametros-fiscais-arquitetura": {
    title: `Parâmetros Fiscais — Arquitetura funcional`,
    source: "docs/parametros-fiscais-arquitetura.md",
    markdown: `# Parâmetros Fiscais — Arquitetura Funcional

> Documento de arquitetura funcional, aprovado, baseado em \`docs/02-parametros-fiscais.md\` (fonte oficial dos requisitos, V1 — 30/07/2026). Não descreve implementação técnica nem altera nenhuma regra de negócio definida no documento de origem. Serve como referência única de arquitetura para a implementação de Parâmetros Fiscais e, a partir das seções 13 a 15, como padrão arquitetural para as demais trilhas de parametrização do AutoPilot (DP, Contábil e futuras).

---

## 1. Objetivo do módulo

O Autopilot é o motor de apuração fiscal: ele decide alíquotas, regimes e obrigações por empresa a partir de parâmetros que **variam no tempo**. O problema que este módulo resolve é duplo:

1. **Dar ao motor de apuração os parâmetros certos, na competência certa.** Regime tributário, Anexo, sublimite, Fator R e as demais variáveis que definem "quanto e como apurar" mudam ao longo da vida da empresa. Sem um mecanismo de vigência, qualquer mudança sobrescreveria o histórico e tornaria impossível reprocessar uma competência passada com os parâmetros que valiam naquele momento.
2. **Consolidar, num único lugar, dados que nascem em sistemas diferentes.** A tela não é a fonte primária da maior parte dos dados que exibe — ela é o ponto de consolidação e exposição. Cadastro e enquadramento vêm do Cockpit, classificação por operação vem do BHules, indicadores de apuração vêm do motor de cálculo, e a carga inicial de cliente migrado vem do SERPRO. O que o Autopilot possui de fato é: (a) os parâmetros digitados manualmente que não existem em nenhum outro sistema, (b) as regras fixas que governam o comportamento de vigência, e (c) a orquestração que decide quando uma mudança em qualquer uma dessas fontes exige alerta, nova vigência ou bloqueio da apuração.

**Fronteiras de responsabilidade:**

| Sistema | Responsabilidade | Relação com Parâmetros Fiscais |
|---|---|---|
| **Autopilot** | Motor de apuração: parametrização por vigência, regras de bloqueio/alerta, obrigações acessórias, bloco contábil×fiscal | Fonte primária dos campos manuais e das regras fixas de vigência |
| **Cockpit** | Cadastro geral e enquadramento cadastral da empresa | Fonte de leitura (regime tributário, tipo de estabelecimento, MEI, condição de contribuinte de ICMS, data de opção pelo SN, início de atividade, inscrições estaduais) |
| **BHules** | Classificação por operação/documento fiscal (CFOP, CST, CSOSN, NCM, código de serviço, retenções sobre serviços tomados, DIFAL) | Fonte de leitura para os poucos campos que ainda aparecem no Autopilot apenas para exibição (documentos emitidos, tributação monofásica) |
| **Motor de cálculo** | Apuração efetiva (RBT12, RBA, Fator R, Anexo, PGDAS-D, DAS, INSS patronal Anexo IV) | Fonte de leitura, exposta apenas para consulta e extração de relatório — o Autopilot não recalcula esses indicadores |
| **SERPRO** | Consulta automatizada para implantação de cliente migrado | Fonte de leitura do bloco de Implantação, com fluxo ainda em definição |

Este módulo **não** é: motor de apuração (isso é o motor de cálculo), sistema de cadastro (isso é o Cockpit), classificador de operações fiscais (isso é o BHules), nem emissor de documentos fiscais (fora de escopo por definição).

---

## 2. Fluxo principal do usuário

1. **Entrada direta na vigência atual.** O usuário abre uma empresa e acessa Parâmetros Fiscais. Não existe uma tela de seleção obrigatória: a trilha carrega, por padrão, a aba **Gerais** já filtrada pela vigência vigente. Um indicador persistente no cabeçalho ("Vigência atual — desde DD/MM/AAAA") comunica em que período o usuário está, sem exigir nenhuma escolha para chegar lá.
2. **Navegação entre blocos.** O usuário troca livremente entre as abas — Gerais, Federais, Estaduais e Municipais, Contábil × Fiscal, Obrigações e Documentos Fiscais, Reforma Tributária (desabilitada) — e a vigência selecionada permanece a mesma em todas elas; trocar de aba nunca reseta o contexto temporal.
3. **Edição na vigência atual.** Dentro da vigência vigente, o usuário só pode alterar os campos de origem Manual. Todo o restante (Cockpit, BHules, Motor de cálculo, Legislação, Sistema) é exibido como somente leitura, com indicação clara da origem.
4. **Consulta ao histórico, sob demanda.** A partir do indicador de vigência, uma ação "Ver histórico" abre a linha do tempo completa de vigências, sem sair do contexto de navegação corrente. Ao selecionar uma vigência passada, todas as abas passam a somente leitura — inclusive os campos manuais — e o indicador de cabeçalho deixa claro que o usuário está fora da vigência atual. Retornar para "Vigência atual" restaura a edição normalmente.
5. **Abertura automática de nova vigência.** Três eventos, com três níveis de severidade, podem abrir uma nova vigência sem ação do usuário:
   - alteração cadastral no Cockpit (regime, tipo de estabelecimento, MEI ou inscrição estadual) → abre nova vigência, gera alerta **e bloqueia a apuração** até análise humana;
   - excesso de sublimite estadual de ICMS/ISS → abre nova vigência e alerta; o DAS continua sendo apurado, agora sem ICMS e ISS, e nasce uma pendência de ação humana para emissão das guias avulsas dos dois tributos;
   - cruzamento do Fator R → abre nova vigência e alerta, sem bloqueio e sem pendência.

   Um quarto evento — troca de faixa de receita bruta — apenas gera alerta, sem abrir vigência nova e sem bloquear nada. Qualquer um desses eventos aparece imediatamente na área de alertas persistente do cabeçalho, visível em qualquer aba — não é preciso abrir o histórico para percebê-lo.
6. **Abertura manual de nova vigência.** A partir do painel de histórico, a ação "Iniciar nova vigência" fecha a vigência atual e abre a seguinte, herdando os parâmetros anteriores para revisão do usuário.
7. **Resolução de bloqueio/pendência.** Quando a apuração está bloqueada por alteração cadastral, ou quando há pendência de guias avulsas por excesso de sublimite, o usuário precisa agir antes que o ciclo normal de apuração continue — a pendência é exibida como uma tarefa acionável, não apenas um aviso passivo.
8. **Onboarding (fora de Parâmetros Fiscais).** Ao migrar um cliente já ativo, o carregamento de dados de corte — Implantação e Saldo Inicial — acontece no fluxo de onboarding da empresa, antes mesmo de a empresa ter uma trilha de Parâmetros Fiscais para navegar. Concluído o carregamento (via SERPRO, fluxo ainda em definição), a primeira vigência é criada automaticamente com o histórico de 12 meses necessário para RBT12 e Fator R, e o usuário passa a seguir o fluxo normal a partir do passo 1. Depois de concluída, a Implantação deixa de aparecer como navegação ativa — fica acessível apenas como link de auditoria somente leitura dentro de Gerais.

---

## 3. Estrutura da navegação

\`\`\`
Empresa
└── Parâmetros Fiscais
      [Indicador persistente de vigência — "Vigência atual: desde DD/MM/AAAA" | Ver histórico]
      ├── Gerais
      ├── Federais
      ├── Estaduais e Municipais
      ├── Contábil × Fiscal
      ├── Obrigações e Documentos Fiscais
      └── Reforma Tributária        (desabilitada — Em construção)

Fluxo de onboarding da empresa (fora de Parâmetros Fiscais)
└── Implantação e Saldo Inicial    (evento único de migração, alimenta a primeira vigência)
\`\`\`

Quatro níveis no caminho padrão — \`Empresa → Parâmetros Fiscais → Aba → Campo\` — sem nenhuma tela intermediária de seleção obrigatória. Este é o padrão de navegação de qualquer trilha de parametrização do AutoPilot, detalhado na seção 13 (Arquitetura Global).

**Justificativa das decisões:**

- **Vigência é um indicador persistente no cabeçalho, não um nível de navegação nem uma tela de portão.** O documento fonte descreve a vigência como uma linha do tempo de enquadramento — um eixo temporal, não um eixo de assunto. Modelar esse eixo como uma tela que o usuário precisa atravessar antes de chegar a qualquer bloco penaliza o caso de uso mais frequente (consultar ou editar a vigência atual) para servir um caso ocasional (consulta histórica ou auditoria). O indicador persistente resolve os dois: o caminho padrão não passa por nenhuma escolha, e o histórico completo continua a um clique de distância, sem perder nenhuma funcionalidade de linha do tempo ou de abertura de nova vigência.
- **Blocos por esfera fiscal seguem abrangência decrescente: Gerais → Federais → Estaduais e Municipais → Contábil × Fiscal → Obrigações e Documentos Fiscais → Reforma Tributária.** Essa ordem reflete o raciocínio da especialista fiscal (regras que afetam toda a empresa → regras federais → estaduais/municipais) e evita replicar a ordem de exposição do documento de requisitos apenas por conveniência editorial.
- **Federais permanece como bloco próprio**, mesmo tendo hoje poucos campos realmente aplicáveis ao Simples Nacional. A maior parte dos campos "Fora de escopo" desse bloco existe justamente porque pertence a Lucro Presumido/Lucro Real — quando esse escopo entrar, é este bloco que crescerá. Fundi-lo agora custaria um desmembramento retrabalhado depois; mantê-lo separado é o investimento mais barato a longo prazo.
- **Municipais é fundido em Estaduais, formando "Estaduais e Municipais".** É estruturalmente pequeno (3 campos) independentemente do regime tributário — ISS é um tema contido que não deve crescer na mesma proporção que Federais. Dar-lhe uma aba própria fragmentaria a navegação sem ganho de clareza.
- **Documentos Fiscais é fundido em Obrigações Acessórias, formando "Obrigações e Documentos Fiscais".** Os dois blocos respondem à mesma pergunta funcional — o que a empresa precisa entregar ou registrar perante o Fisco e o mercado, mesmo sem decidir o conteúdo — e ambos são majoritariamente somente leitura ou de habilitação automática. Juntos, cabem numa única aba com seções internas sem gerar confusão sobre onde cada coisa se edita.
- **Contábil × Fiscal permanece como bloco próprio dentro de Parâmetros Fiscais.** A seção 15 do documento de requisitos registra a decisão explícita da PO: "tela transversal: parâmetro do fiscal que impacta o contábil. Permanece em Parâmetros Fiscais, sem migrar para o módulo Contábil." Mantê-lo como aba de mesmo nível preserva essa decisão sem reabri-la.
- **Reforma Tributária existe como aba, mas desabilitada.** O documento pede explicitamente que a estrutura seja preservada para não perder o levantamento. Remover a aba perderia essa preservação; construí-la por completo contradiz a instrução de não desenvolver esta rodada. A posição correta é: aba visível, ao final da lista, com conteúdo bloqueado.
- **Implantação e Saldo Inicial não é uma aba de Parâmetros Fiscais.** É um evento único de migração — não recorrente, não versionado por vigência — que pertence ao fluxo de onboarding da empresa. Torná-lo uma aba permanente manteria, para sempre, uma navegação sem uso na maior parte da vida da empresa. Depois de concluída, o acesso de auditoria aos dados carregados fica disponível como link somente leitura dentro de Gerais, não como aba própria.

---

## 4. Organização das telas

### 4.1 Seletor de Vigência e Histórico

- **Objetivo:** dar visibilidade ao histórico de enquadramento da empresa sem exigir que o usuário passe por ele para chegar a qualquer bloco. Não é uma tela isolada — é um indicador persistente no cabeçalho de Parâmetros Fiscais, com uma ação que abre o histórico completo (painel ou tela, conforme o volume de vigências).
- **Blocos pertencentes:** os campos da seção 3 do documento de requisitos (datas de início/fim, regime tributário do período, Anexo do período, tipo de estabelecimento, início de atividade, motivo da alteração) e as três regras fixas de abertura automática de vigência.
- **Dependências:** depende do Cockpit para regime tributário e tipo de estabelecimento; depende do motor de cálculo para o Anexo do período; depende de Sistema para as regras de bloqueio/alerta.
- **Origem dos dados:** mista — a primeira vigência nasce do onboarding (Cockpit + Implantação), a data de fim é preenchida pelo Sistema ao abrir a próxima vigência, e os disparos de nova vigência são regra fixa.
- **Comportamento esperado:** por padrão, a trilha carrega a vigência atual, editável nos campos manuais. O histórico completo só aparece quando o usuário aciona "Ver histórico" a partir do indicador; nesse momento, todas as abas passam a somente leitura. Alertas e bloqueios aparecem na área persistente do cabeçalho (ver seção 13.3), não apenas dentro do painel de histórico.

### 4.2 Gerais

- **Objetivo:** classificar a base da empresa dentro da vigência e determinar quais blocos seguintes ficam efetivamente aplicáveis.
- **Blocos pertencentes:** seção 4 do documento de requisitos — data de opção pelo SN, MEI, código PGDAS-D, regime de reconhecimento de receita, indicadores de apuração (RBT12, RBA/RBAA, Fator R), limites e sublimite, avisos de proximidade.
- **Dependências:** é o bloco "âncora" — Anexo, RBT12 e Fator R aqui exibidos alimentam a leitura dos blocos Federais, Estaduais e Municipais e Obrigações e Documentos Fiscais. Também hospeda o link de auditoria somente leitura para os dados de Implantação (seção 4.8).
- **Origem dos dados:** API gov./Cockpit, motor de cálculo, Legislação (limites fixos) e Manual (código de acesso, avisos configuráveis).
- **Comportamento esperado:** indicadores de apuração são somente consulta/relatório — nunca editáveis; limites de legislação vêm pré-preenchidos e não editáveis por empresa.

### 4.3 Federais

- **Objetivo:** registrar o pouco que tem efeito de apuração ou relatório fora do DAS, já que no Simples Nacional a maior parte dos tributos federais está dentro do DAS.
- **Blocos pertencentes:** seção 5 do documento de requisitos — INSS patronal do Anexo IV, retenção de INSS sobre prestados, tributação monofásica/ST (exibição), opção pela CPRB.
- **Dependências:** consequência direta do Anexo apurado em Gerais (Anexo IV aciona INSS patronal fora do DAS).
- **Origem dos dados:** motor de cálculo (somente leitura) e Manual (CPRB).
- **Comportamento esperado:** bloco predominantemente de consulta; único campo realmente editável no MVP é a opção pela CPRB. Mantido como aba própria mesmo sendo fino hoje — cresce quando Lucro Presumido/Lucro Real entrarem em escopo (ver seção 3).

### 4.4 Estaduais e Municipais

- **Objetivo:** registrar o cadastro estadual, as exceções que tiram a empresa da regra geral do DAS, e o que é atributo estável da empresa em relação ao ISS.
- **Blocos pertencentes:** seção 6 do documento de requisitos (condição de contribuinte de ICMS, substituto tributário, inscrições por UF, base do FCP/FECP, reduções e deduções, benefícios e convênios, perfil do SPED Fiscal) e seção 7 (forma de cálculo do ISS, ISS fixo por classe profissional, empresa designada substituta de ISS), organizadas como duas seções expansíveis dentro da mesma aba.
- **Dependências:** condição de contribuinte depende do Cockpit (existência de inscrição estadual); regime especial de apuração (RPA) só existe quando há pendência de excesso de sublimite aberta.
- **Origem dos dados:** Cockpit (condição de contribuinte, inscrições) e Manual (demais campos, em ambas as seções).
- **Comportamento esperado:** campo "Inscrição Estadual de Substituto por UF" fica sem fonte de dado enquanto a melhoria solicitada ao Cockpit não existir — ver seção 10 (Riscos). A seção Municipais, por ser pequena (3 campos), aparece recolhida por padrão, sem prejuízo de acesso.

### 4.5 Contábil × Fiscal

- **Objetivo:** registrar o parâmetro fiscal que impacta como o contábil lança as operações — bloco transversal, mas que permanece em Parâmetros Fiscais por decisão de produto.
- **Blocos pertencentes:** seção 10 do documento de requisitos — geração automática de lançamentos (regra fixa), classificação de conta de fornecedores/clientes, tipo de lançamento (regra fixa), separações contábeis (frete, pedágio, IPI/ICMS ST), controle de estoque.
- **Dependências:** nenhuma dependência direta de outro bloco de Parâmetros Fiscais; depende conceitualmente do módulo Contábil como consumidor da configuração, mas não como fonte.
- **Origem dos dados:** predominantemente Manual e Sistema (regra fixa).
- **Comportamento esperado:** distinguir visualmente o que é regra fixa (documentação, sem controle na tela) do que é efetivamente configurável.

### 4.6 Obrigações e Documentos Fiscais

- **Objetivo:** mostrar quais obrigações a empresa entrega e quais documentos fiscais emite, com que periodicidade, e habilitar o que depende de configuração manual — as duas faces do que a empresa precisa registrar perante o Fisco e o mercado.
- **Blocos pertencentes:** seção 9 do documento de requisitos (documentos fiscais emitidos, série e numeração) e seção 11 (PGDAS-D/DAS, guias avulsas, DEFIS, DASN-SIMEI, eSocial, DeSTDA, DTE-SN, procuração eletrônica, EFD-Reinf/DCTFWeb, EFD-ICMS/IPI, MIT, SINTEGRA), organizadas como duas seções dentro da mesma aba.
- **Dependências:** DEFIS/DASN-SIMEI dependem do enquadramento (MEI ou não) definido em Gerais; DeSTDA depende de haver inscrição estadual (Estaduais e Municipais); guias avulsas dependem da pendência de excesso de sublimite; documentos emitidos e séries dependem inteiramente do BHules.
- **Origem dos dados:** mista — BHules (documentos e séries), regra fixa/Sistema para as obrigações auto-habilitadas, Manual para as demais.
- **Comportamento esperado:** separar visualmente, dentro da seção de Obrigações Acessórias, o que é auto-habilitado e somente leitura (DEFIS, DASN-SIMEI, DeSTDA, PGDAS-D/DAS) do que exige configuração manual do usuário. A seção de Documentos Fiscais é 100% somente leitura em relação à fonte — o Autopilot reflete o que o BHules informa, não define.

### 4.7 Reforma Tributária

- **Objetivo:** preservar o levantamento de campos de IBS/CBS/Imposto Seletivo sem desenvolver nada nesta rodada.
- **Blocos pertencentes:** seção 8 do documento de requisitos — todos os 8 campos, todos "Em construção".
- **Dependências:** nenhuma nesta rodada.
- **Origem dos dados:** N/A — bloco não operacional.
- **Comportamento esperado:** última aba da barra, visível, mas com conteúdo bloqueado/desabilitado e uma indicação clara de "Em construção" — não uma tela funcional.

### 4.8 Implantação e Saldo Inicial (fluxo de onboarding, fora das abas de Parâmetros Fiscais)

- **Objetivo:** dar à primeira vigência do Autopilot o histórico de 12 meses e o saldo de tributos necessário para apurar corretamente a partir do corte da migração de um cliente já ativo.
- **Blocos pertencentes:** seção 12 do documento de requisitos — data de corte, saldo inicial por imposto, receita bruta mensal dos 12 meses, folha de salários dos 12 meses, RBA acumulada.
- **Dependências:** alimenta diretamente RBT12 e Fator R exibidos em Gerais na primeira vigência.
- **Origem dos dados:** SERPRO — fluxo de consulta ainda em definição (ver seção 10, Riscos).
- **Comportamento esperado:** roda como etapa do onboarding da empresa, antes de existir qualquer vigência em Parâmetros Fiscais — até o fluxo SERPRO estar definido, tratar como fluxo manual de contingência, mas os campos e sua estrutura já devem existir. Concluído o onboarding, deixa de aparecer como navegação ativa; o acesso remanescente é um link de auditoria somente leitura dentro de Gerais.

---

## 5. MVP

Escopo: apenas itens marcados **Essencial** no documento de origem, mais a infraestrutura de vigência que os sustenta.

**Seletor de Vigência e Histórico:** data de início, data de fim, regime tributário do período, Anexo do período, tipo de estabelecimento, empresa em início de atividade, bloqueio da apuração por alteração cadastral, pendência de ação humana por excesso de sublimite, nova vigência por reenquadramento calculado, ação "iniciar nova vigência".

**Gerais:** data de opção pelo SN, Anexo(s) e % de receita por atividade, MEI, código de acesso ao PGDAS-D, regime de reconhecimento de receita, RBT12, RBA/RBAA, Fator R, limite de receita (mercado interno), limite adicional (exportação), sublimite estadual de ICMS/ISS.

**Federais:** INSS patronal fora do DAS (Anexo IV).

**Estaduais e Municipais:** condição de contribuinte de ICMS, forma de cálculo do ISS, ISS fixo por classe profissional.

**Contábil × Fiscal:** geração automática de lançamentos (regra fixa), classificação de conta — fornecedores, classificação de conta — clientes, tipo de lançamento contábil (regra fixa), conta cliente/fornecedor em pagamento à vista (regra fixa).

**Obrigações e Documentos Fiscais:** documentos fiscais emitidos, série e numeração, PGDAS-D e DAS, guias avulsas de ICMS e ISS (regra fixa), DEFIS (regra fixa), DASN-SIMEI (regra fixa), eSocial — parametrização básica.

**Implantação e Saldo Inicial (fluxo de onboarding, fora das abas de Parâmetros Fiscais):** todos os 5 campos (data de corte, saldo inicial por imposto, receita bruta mensal dos 12 meses, folha de salários dos 12 meses, RBA acumulada) — estrutura construída ainda que o fluxo de carga automatizada via SERPRO não esteja pronto (contingência manual).

**Reforma Tributária:** nenhum campo funcional — apenas a aba placeholder "Em construção" (estrutural, não é um item de conteúdo do MVP).

**Regra estrutural do MVP:** todos os blocos correspondentes às seções 4 a 8 do documento de requisitos (Gerais, Federais, Estaduais, Municipais e Reforma Tributária) nascem versionados por vigência já nesta primeira versão — isto é um requisito de arquitetura, não um campo a mais.

---

## 6. Fase 2

### 6.1 Próxima prioridade (marcados como Desejável — entram logo após o MVP)

- **Seletor de Vigência e Histórico:** motivo da alteração, validação de continuidade de datas.
- **Gerais:** perfil de parametrização por atividade (D35), aviso de proximidade do limite de enquadramento, aviso de proximidade do sublimite, aviso de troca de faixa de receita bruta.
- **Federais:** retenção de INSS sobre serviços prestados, tributação monofásica/ST de PIS/COFINS (exibição), opção pela CPRB.
- **Estaduais e Municipais:** substituto tributário, inscrição estadual de substituto por UF, recolher ICMS/ISS com valor fixo, base de cálculo do FCP/FECP, reduções e deduções da base do SN, benefícios e convênios de ICMS, perfil do SPED Fiscal.
- **Contábil × Fiscal:** cupom fiscal pelo valor total, separar frete/pedágio/seguro/despesas/desconto, separar IPI e ICMS ST das entradas, controle de estoque.
- **Obrigações e Documentos Fiscais:** DeSTDA, DTE-SN, procuração eletrônica/Integra Contador, EFD-Reinf e DCTFWeb, EFD-ICMS/IPI (SPED Fiscal), MIT.

### 6.2 Fase 2 (depende de evolução de produto)

- **Gerais:** segmento de atividade especial (aguarda mapeamento da carteira do Simples Nacional).
- **Estaduais e Municipais:** aproveitar créditos de ICMS pelas entradas, regime especial de apuração do ICMS (RPA), empresa designada substituta de ISS.
- **Contábil × Fiscal:** Ajuste a Valor Presente (AVP), rateio de centro de custos, gerar lançamentos em outra empresa.
- **Obrigações e Documentos Fiscais:** SINTEGRA.

### 6.3 Em construção (estrutura preservada, sem data de desenvolvimento)

- Bloco completo de Reforma Tributária (IBS, CBS, Imposto Seletivo) — os 8 campos da seção 8.

---

## 7. Fora do escopo

**Sistemas e responsabilidades inteiras fora desta trilha** (por definição do documento, seção 1):

- Emissão de documentos fiscais — certificado digital, ambiente de transmissão, DANFE, CSC.
- Cadastro geral da empresa e enquadramento cadastral — responsabilidade do Cockpit, apenas consumido aqui.
- Classificação por documento fiscal — CFOP, CST, CSOSN, NCM, código de serviço, retenções sobre serviços tomados — responsabilidade do BHules.
- Parcelamentos de tributos — responsabilidade do time de compliance.

**Campos marcados "Fora de escopo" no documento** (aplicáveis apenas a Lucro Presumido/Lucro Real ou a outros módulos):

- Gerais: forma de apuração de IRPJ/CSLL, compensação de prejuízo fiscal.
- Federais: percentual de presunção de IRPJ/CSLL, adicional de IRPJ, regime de apuração de PIS/COFINS, direito a crédito sobre insumos, método de apuração de créditos, granularidade da EFD-Contribuições, exclusão do IRRF da base da CIDE, dedução de pedágio da base dos federais.
- Estaduais: estorno proporcional de crédito de ICMS, SPED Fiscal — Bloco K.
- Contábil × Fiscal: gerar lançamento dos créditos de PIS e COFINS, honorários — variáveis com valor de impostos, Reduções Z e Cupom Fiscal Eletrônico.
- Obrigações Acessórias: EFD-Contribuições, ECF/e-LALUR, SPED Contábil.

**Campos explicitamente removidos em rodadas anteriores** (não devem ser reintroduzidos — seção 17 do documento): CRT, marcadores de segregação de receita do PGDAS-D, retenção de IRRF/CSRF sobre serviços tomados, DIFAL e antecipação de ICMS nas entradas, código de serviço (LC 116), alíquota de ISS, fato gerador da retenção de ISS, titularidade do certificado digital, ambiente de transmissão, mensagem do DANFE, importação automática de DF-e, critério de notificação de importação, CSC, pCredSN, parcelamentos ativos de tributos.

---

## 8. Estados da interface

- **Carregando** — por bloco, enquanto dados de Cockpit/motor de cálculo/BHules/SERPRO são buscados.
- **Vazio** — empresa sem nenhuma vigência ainda (aguardando implantação/onboarding).
- **Somente leitura** — vigência histórica selecionada; ou campo de origem Cockpit/BHules/Motor de cálculo/Legislação/Sistema, mesmo na vigência atual.
- **Editável** — campo de origem Manual, na vigência atual.
- **Calculado** — valor exibido, nunca editável, vindo de outro sistema.
- **Não aplicável ao enquadramento** — campo permanece vazio porque não se aplica ao regime/Anexo da empresa (regra explícita do documento: não há liberação por módulo, os campos apenas ficam vazios).
- **Bloqueado** — apuração bloqueada por alteração cadastral pendente de análise humana.
- **Pendente de ação humana** — excesso de sublimite aguardando emissão de guias avulsas.
- **Alerta** — Fator R cruzado, troca de faixa de receita bruta, proximidade de limite/sublimite, janela de opção do IBS/CBS.
- **Aguardando integração** — Implantação aguardando definição do fluxo SERPRO; inscrição estadual por UF aguardando melhoria do Cockpit.
- **Em construção** — bloco Reforma Tributária.
- **Falha de integração** — consulta ao SERPRO falha ou retorna incompleta (fluxo de contingência ainda não definido — ver Riscos).

---

## 9. Dependências externas

| Bloco / Origem | Editável no Autopilot? | Observação |
|---|---|---|
| **Cockpit** — regime tributário, tipo de estabelecimento, MEI, condição de contribuinte de ICMS, data de opção pelo SN, indicador de início de atividade, inscrições estaduais | Não — somente leitura | 3 melhorias pendentes no Cockpit (ver Riscos) condicionam a completude destes campos |
| **Motor de cálculo** — Anexo, % de receita por atividade, RBT12, RBA/RBAA, Fator R, INSS patronal Anexo IV, retenção de INSS sobre prestados, PGDAS-D, DAS | Não — calculado, exposto para consulta/relatório | O Autopilot nunca recalcula; apenas exibe e versiona por vigência |
| **BHules** — documentos emitidos e séries, tributação monofásica por NCM, retenções sobre serviços tomados, DIFAL e antecipação de ICMS, código de serviço, alíquota de ISS | Não — a maioria não é nem exibida; tributação monofásica e documentos emitidos são exibidos, somente leitura | Nenhum desses itens é parâmetro de empresa |
| **SERPRO** — bloco inteiro de Implantação (data de corte, saldo inicial por imposto, receita bruta e folha dos 12 meses, RBA) | Não — calculado/consultado, com digitação manual como contingência | Fluxo de consulta (competências, credencial, etapa, tratamento de falha) ainda em definição |
| **Legislação** — limite de receita (mercado interno e exportação), sublimite estadual de ICMS/ISS | Não — valor fixo mantido pelo produto | Não editável por empresa |
| **Sistema** (regras fixas internas) — bloqueio por alteração cadastral, pendência por excesso de sublimite, nova vigência por Fator R, geração automática de lançamentos contábeis, habilitação automática de DEFIS/DASN-SIMEI/DeSTDA, guias avulsas | Não — comportamento do sistema, exibido apenas para documentação | Nenhuma dessas regras tem controle editável na tela |
| **Manual** — código de acesso PGDAS-D, avisos configuráveis, opção pela CPRB, substituto tributário, benefícios/convênios de ICMS, classificação de contas, checkboxes contábeis, obrigações não auto-habilitadas | Sim | Único grupo de campos realmente editável pelo usuário na tela |
| **Compliance** — parcelamentos de tributos | Fora do escopo do motor | Não aparece na tela |

---

## 10. Riscos de implementação

1. **Abertura de vigência por excesso de sublimite: nível de severidade precisa de confirmação.** A tabela da seção 3 do documento de requisitos afirma que o excesso de sublimite "abre nova vigência e alerta", mas a nota de rodapé da mesma seção resume o mesmo evento como intermediário entre bloqueio total e simples alerta, sem reforçar explicitamente a abertura de vigência. Antes de desenhar a tela, validar com Produto se este evento de fato abre uma nova linha no histórico (como o campo indica) ou apenas alerta e pendência sem nova vigência (como a nota sugere ao "não parar nada").
2. **Versionamento por vigência dos blocos Documentos Fiscais, Contábil × Fiscal e Obrigações Acessórias não está explícito.** O documento de requisitos afirma que "todos os blocos das seções 4 a 8 nascem versionados já no MVP" — mas não confirma se os blocos hoje agrupados na aba Obrigações e Documentos Fiscais e na aba Contábil × Fiscal também precisam de histórico por vigência ou se são estado atual único da empresa. Isso muda a estrutura de dados por trás dessas abas. Validar com Produto antes de implementar.
3. **Fluxo de onboarding via SERPRO integralmente indefinido.** Seção 16 do documento de requisitos lista como decisão pendente: quais competências consultar, qual credencial usar, em que etapa do onboarding a consulta roda, e o que acontece se a consulta falhar ou vier incompleta. Sem essa definição, o bloco de Implantação só pode ser construído com fallback manual como contingência — não como fluxo automatizado real.
4. **Escopo das guias avulsas de ICMS/ISS é uma decisão de produto, não só de tela.** A guia de ICMS varia por UF (GNRE, DARE, DAE, entre outras) e a de ISS por município. O documento explicitamente recomenda começar pelo cálculo do valor com emissão manual pelo operador, e não pela integração com emissores — mas isso precisa ser confirmado como decisão de escopo antes de estimar a funcionalidade, já que a diferença de esforço entre "calcular valor" e "integrar por UF/município" é de ordem de magnitude.
5. **Três melhorias pendentes no Cockpit bloqueiam campos do MVP e da Fase 2.** Consulta à API pública de CNPJ (afeta data de opção pelo SN e início de atividade), inscrições estaduais em múltiplas UFs (afeta substituto tributário por UF) e evento de alteração cadastral (afeta o próprio mecanismo de bloqueio de vigência) dependem de evolução do Cockpit fora do controle desta trilha. Definir com Produto o que fazer enquanto essas melhorias não chegam — campo vazio, fallback manual, ou funcionalidade parcial.
6. **V2 de alteração de regime tributário está fora do escopo desta rodada por decisão da PO**, mas o fluxo completo entre Cockpit e Autopilot nesse cenário ainda não existe. Se a trilha avançar sem esse desenho, há risco de o comportamento de "alteração cadastral bloqueia apuração" (item essencial do MVP) não cobrir corretamente o caso de troca de regime.
7. **Perfil de parametrização por atividade (D35) precisa de definição de fluxo.** O campo aplica um conjunto pré-configurado de parâmetros por atividade no cadastro de nova empresa, mas o documento não detalha se isso ocorre antes, durante ou depois da abertura da primeira vigência, nem se os valores aplicados continuam editáveis campo a campo depois.
8. **Dicionários fechados (D01–D35) são responsabilidade de conteúdo, não só de interface.** O documento é explícito: "o desenvolvimento não deve criar opções fora desta relação sem validação fiscal". É preciso definir com Produto onde essas listas vivem e como são atualizadas sem depender de deploy, já que decisões fiscais podem mudar essas listas com frequência maior do que releases de código.
9. **Segmento de atividade especial (Fase 2) depende de um levantamento de carteira que ainda não começou.** O documento marca isso como próximo passo de Produto, não de desenvolvimento — não deve ser estimado como trabalho técnico enquanto esse levantamento não existir.

*O reaproveitamento de componentes entre a feature Empresas e a trilha Fiscal — antes listado aqui como risco aberto — já está resolvido como decisão de arquitetura na seção 13.7 (Arquitetura Global): componentes usados por mais de uma trilha vivem em \`src/components/shared\`.*

---

## 11. Recomendações de UX

*Recomendações de organização e apresentação da informação, complementares às decisões de navegação já fixadas nas seções 3 e 4. Nenhuma delas altera regra de negócio.*

- **Distinguir visualmente vigência atual de vigência histórica de forma inequívoca**, com badge de status ("Vigência atual" / "Encerrada em [data]") visível em qualquer aba, não apenas no painel de histórico — para evitar que o usuário tente editar um período fechado sem entender por que não consegue.
- **Manter alertas e pendências na área persistente do cabeçalho (seção 13.3)**, nunca dispersos como um campo comum dentro de um bloco. Bloqueio por alteração cadastral, pendência de guias avulsas e alerta de Fator R são eventos que pedem ação ou atenção — merecem destaque equivalente a uma central de notificações visível em qualquer aba, não o mesmo tratamento visual de um campo informativo qualquer.
- **Tratar a pendência de guias avulsas como uma tarefa acionável**, com chamada para ação clara ("Gerar guias avulsas"), e não apenas como um texto de status. Vale considerar, ao desenhar isso, que uma versão anterior da trilha Empresas removeu um "card de pendências" genérico do Cockpit (commit \`3b5ca44\`) — recomenda-se validar com Produto se a pendência fiscal deve ter uma afordância própria e específica, e não reabrir um padrão genérico que já foi descontinuado noutra trilha.
- **Reforma Tributária como aba visível e claramente identificada como futura** (rótulo, cor ou ícone de "Em construção"), em vez de ocultá-la — mantém a promessa de que a estrutura foi preservada sem sugerir que a funcionalidade já está disponível.
- **Colapsar ou tornar discreto o que "não se aplica ao enquadramento"**, em vez de exibir campos vazios com o mesmo peso visual de campos preenchidos. Isso importa mais à medida que Lucro Presumido/Lucro Real (hoje fora de escopo) eventualmente entrarem, quando o número de campos não aplicáveis por empresa crescerá.
- **Separar visualmente, dentro da aba Obrigações e Documentos Fiscais, o que é auto-habilitado e somente leitura (DEFIS, DASN-SIMEI, DeSTDA, PGDAS-D/DAS) do que exige configuração manual do usuário** — são naturezas de interação completamente diferentes dentro do mesmo bloco.
- **Estender aos campos fiscais o padrão já usado em Empresas para dados somente leitura de origem Cockpit** (aviso de origem + atalho "Editar no Cockpit"), em vez de criar uma linguagem visual nova só para esta trilha — mantém consistência para o usuário que já navega entre as duas telas.

---

## 12. Matriz de Cobertura

*Grupos e ordem seguem a navegação final da seção 3 — Seletor de Vigência e Histórico (não é uma aba, é o indicador persistente do cabeçalho) e, em seguida, as abas na ordem em que aparecem na barra: Gerais, Federais, Estaduais e Municipais, Contábil × Fiscal, Obrigações e Documentos Fiscais, Reforma Tributária. Implantação e Saldo Inicial fecha a matriz como fluxo de onboarding, fora das abas de Parâmetros Fiscais.*

| Funcionalidade | Prioridade | Existe tela? | Observações |
|---|---|---|---|
| **Seletor de Vigência e Histórico** | | | |
| Data de início de vigência | Essencial | Não | MVP |
| Data de fim de vigência | Essencial | Não | MVP |
| Regime tributário do período | Essencial | Não | MVP — somente leitura, origem Cockpit |
| Anexo do Simples Nacional do período | Essencial | Não | MVP — somente leitura, origem motor de cálculo |
| Tipo de estabelecimento | Essencial | Não | MVP — somente leitura, origem Cockpit |
| Empresa em início de atividade | Essencial | Não | MVP — origem API gov./Cockpit |
| Motivo da alteração | Desejável | Não | Fase 2 (6.1) |
| Bloqueio da apuração por alteração cadastral | Essencial | Não | MVP — regra fixa; risco de severidade a confirmar (item 1) |
| Pendência de ação humana por excesso de sublimite | Essencial | Não | MVP — regra fixa; risco de severidade a confirmar (item 1) |
| Nova vigência por reenquadramento calculado | Essencial | Não | MVP — regra fixa |
| Iniciar nova vigência (ação) | Essencial | Não | MVP |
| Validação de continuidade de datas | Desejável | Não | Fase 2 (6.1) |
| **Gerais** | | | |
| Data de opção pelo Simples Nacional | Essencial | Não | MVP — origem API gov./Cockpit |
| Anexo(s) e % de receita por atividade | Essencial | Não | MVP — somente leitura, motor de cálculo |
| MEI | Essencial | Não | MVP — somente leitura, Cockpit |
| Código de acesso ao PGDAS-D | Essencial | Não | MVP — único campo Texto do bloco |
| Perfil de parametrização por atividade (D35) | Desejável | Não | Fase 2 (6.1); risco de fluxo a confirmar (item 7) |
| Regime de reconhecimento de receita | Essencial | Não | MVP — decisão anual, onboarding via SERPRO |
| RBT12 | Essencial | Não | MVP — somente consulta, motor de cálculo |
| RBA / RBAA | Essencial | Não | MVP — somente consulta, motor de cálculo |
| Fator R | Essencial | Não | MVP — somente consulta, motor de cálculo |
| Limite de receita — mercado interno | Essencial | Não | MVP — valor fixo de legislação |
| Limite adicional — exportação | Essencial | Não | MVP — valor fixo de legislação |
| Sublimite estadual de ICMS/ISS | Essencial | Não | MVP — valor fixo de legislação |
| Aviso de proximidade do limite de enquadramento | Desejável | Não | Fase 2 (6.1) |
| Aviso de proximidade do sublimite | Desejável | Não | Fase 2 (6.1) |
| Aviso de troca de faixa de receita bruta | Desejável | Não | Fase 2 (6.1) — apenas alerta, sem nova vigência |
| Segmento de atividade especial | Fase 2 | Não | Fase 2 (6.2); depende de mapeamento de carteira (item 9) |
| Forma de apuração de IRPJ/CSLL | Fora de escopo | Não | Fora do escopo — Lucro Presumido/Real |
| Compensação de prejuízo fiscal | Fora de escopo | Não | Fora do escopo — Lucro Real |
| **Federais** | | | |
| INSS patronal fora do DAS (Anexo IV) | Essencial | Não | MVP — somente consulta, motor de cálculo |
| Retenção de INSS sobre serviços prestados | Desejável | Não | Fase 2 (6.1) |
| Tributação monofásica ou ST de PIS/COFINS | Desejável | Não | Fase 2 (6.1) — exibição, origem BHules |
| Opção pela CPRB | Desejável | Não | Fase 2 (6.1) |
| Percentual de presunção de IRPJ/CSLL | Fora de escopo | Não | Fora do escopo — Lucro Presumido |
| Adicional de IRPJ | Fora de escopo | Não | Fora do escopo |
| Regime de apuração de PIS/COFINS | Fora de escopo | Não | Fora do escopo — LP/LR |
| Direito a crédito sobre insumos | Fora de escopo | Não | Fora do escopo — regime não cumulativo |
| Método de apuração de créditos | Fora de escopo | Não | Fora do escopo — Lucro Real |
| Granularidade da EFD-Contribuições | Fora de escopo | Não | Fora do escopo — LP/LR |
| Exclusão do IRRF da base da CIDE | Fora de escopo | Não | Fora do escopo |
| Dedução de pedágio da base dos federais | Fora de escopo | Não | Fora do escopo — fora do SN |
| **Estaduais e Municipais** | | | |
| Condição de contribuinte de ICMS | Essencial | Não | MVP — derivada do Cockpit |
| Substituto tributário | Desejável | Não | Fase 2 (6.1) |
| Inscrição Estadual de Substituto por UF | Desejável | Não | Fase 2 (6.1); sem fonte enquanto melhoria do Cockpit não existir (item 5) |
| Recolher ICMS/ISS com valor fixo | Desejável | Não | Fase 2 (6.1) |
| Base de cálculo do FCP/FECP | Desejável | Não | Fase 2 (6.1) |
| Reduções e deduções da base do SN | Desejável | Não | Fase 2 (6.1) |
| Benefícios e convênios de ICMS | Desejável | Não | Fase 2 (6.1) |
| Perfil do SPED Fiscal | Desejável | Não | Fase 2 (6.1) |
| Aproveitar créditos de ICMS pelas entradas | Fase 2 | Não | Fase 2 (6.2) |
| Regime especial de apuração do ICMS (RPA) | Fase 2 | Não | Fase 2 (6.2) — acionado pela pendência de sublimite |
| Estorno proporcional de crédito de ICMS | Fora de escopo | Não | Fora do escopo — LP/LR |
| SPED Fiscal — Bloco K | Fora de escopo | Não | Fora do escopo — fora do SN |
| Forma de cálculo do ISS | Essencial | Não | MVP |
| ISS fixo por classe profissional | Essencial | Não | MVP |
| Empresa designada substituta de ISS | Fase 2 | Não | Fase 2 (6.2) |
| **Contábil × Fiscal** | | | |
| Gerar lançamentos contábeis automaticamente | Essencial | Não | MVP — regra fixa |
| Classificação de conta — Fornecedores | Essencial | Não | MVP |
| Classificação de conta — Clientes | Essencial | Não | MVP |
| Tipo de lançamento contábil | Essencial | Não | MVP — regra fixa |
| Conta cliente/fornecedor em pagamento à vista | Essencial | Não | MVP — regra fixa |
| Cupom fiscal pelo valor total | Desejável | Não | Fase 2 (6.1) |
| Separar frete, pedágio, seguro, despesas e desconto | Desejável | Não | Fase 2 (6.1) |
| Separar IPI e ICMS ST das entradas | Desejável | Não | Fase 2 (6.1) |
| Controle de estoque | Desejável | Não | Fase 2 (6.1) |
| Ajuste a Valor Presente (AVP) | Fase 2 | Não | Fase 2 (6.2) |
| Mostrar rateio de centro de custos | Fase 2 | Não | Fase 2 (6.2) |
| Gerar lançamentos em outra empresa | Fase 2 | Não | Fase 2 (6.2) |
| Gerar lançamento dos créditos de PIS e COFINS | Fora de escopo | Não | Fora do escopo — regimes não cumulativos |
| Honorários — variáveis com valor de impostos | Fora de escopo | Não | Fora do escopo — módulo próprio |
| Reduções Z e Cupom Fiscal Eletrônico | Fora de escopo | Não | Fora do escopo — varejo com PDV |
| **Obrigações e Documentos Fiscais** | | | |
| Documentos fiscais emitidos | Essencial | Não | MVP — origem BHules |
| Série e numeração | Essencial | Não | MVP — origem BHules |
| PGDAS-D e DAS | Essencial | Não | MVP — origem motor de cálculo |
| Guias avulsas de ICMS e ISS | Essencial | Não | MVP — regra fixa; escopo a confirmar (item 4) |
| DEFIS | Essencial | Não | MVP — regra fixa, somente leitura |
| DASN-SIMEI | Essencial | Não | MVP — regra fixa, somente leitura |
| eSocial — parametrização básica | Essencial | Não | MVP |
| DeSTDA | Desejável | Não | Fase 2 (6.1) — regra fixa, somente leitura |
| DTE-SN | Desejável | Não | Fase 2 (6.1) |
| Procuração eletrônica / Integra Contador | Desejável | Não | Fase 2 (6.1) |
| EFD-Reinf e DCTFWeb | Desejável | Não | Fase 2 (6.1) |
| EFD-ICMS/IPI (SPED Fiscal) | Desejável | Não | Fase 2 (6.1) |
| MIT | Desejável | Não | Fase 2 (6.1) |
| SINTEGRA | Fase 2 | Não | Fase 2 (6.2) |
| EFD-Contribuições | Fora de escopo | Não | Fora do escopo — fora do SN |
| ECF / e-LALUR | Fora de escopo | Não | Fora do escopo — fora do SN |
| SPED Contábil | Fora de escopo | Não | Fora do escopo |
| **Reforma Tributária (IBS/CBS/IS) — aba desabilitada** | | | |
| Opção pelo regime de apuração do IBS/CBS | Em construção | Não | Fase 2 (6.3) — placeholder apenas |
| Aviso de janela de opção do IBS/CBS | Em construção | Não | Fase 2 (6.3) — placeholder apenas |
| CBS/IBS embutidos no DAS | Em construção | Não | Fase 2 (6.3) — placeholder apenas |
| Alíquota de referência CBS/IBS | Em construção | Não | Fase 2 (6.3) — placeholder apenas |
| Redução de alíquota / cesta básica (gRed) | Em construção | Não | Fase 2 (6.3) — placeholder apenas |
| Imposto Seletivo (IS) | Em construção | Não | Fase 2 (6.3) — placeholder apenas |
| Split payment | Em construção | Não | Fase 2 (6.3) — placeholder apenas |
| Operador de plataforma digital | Em construção | Não | Fase 2 (6.3) — placeholder apenas |
| **Implantação e Saldo Inicial — fluxo de onboarding, fora das abas de Parâmetros Fiscais** | | | |
| Data de corte do saldo inicial | Essencial | Não | MVP — origem SERPRO, fluxo pendente (item 3) |
| Saldo inicial por imposto (credor/devedor) | Essencial | Não | MVP — origem SERPRO, fluxo pendente (item 3) |
| Receita bruta mensal dos 12 meses anteriores | Essencial | Não | MVP — origem SERPRO, fluxo pendente (item 3) |
| Folha de salários dos 12 meses anteriores | Essencial | Não | MVP — origem SERPRO, fluxo pendente (item 3) |
| Receita bruta acumulada do ano-calendário (RBA) | Essencial | Não | MVP — origem SERPRO, fluxo pendente (item 3) |

*Coluna "Existe tela?" reflete o estado atual (\`FiscalPage.jsx\` ainda é um placeholder vazio) — todas as linhas partem de "Não" e devem ser atualizadas conforme o desenvolvimento avança, servindo de checklist para garantir que nenhum item da especificação seja esquecido.*

---

## 13. Arquitetura Global

*Como este padrão se reaplica a Fiscal, DP, Contábil e a qualquer parametrização futura do AutoPilot, sem que cada trilha reinvente sua própria navegação.*

### 13.1 Princípio geral

Toda trilha de parametrização do AutoPilot resolve a mesma pergunta estrutural: "quais parâmetros valem para esta empresa, de onde vêm, e desde quando valem". A diferença entre Fiscal, DP e Contábil está no **conteúdo** dos blocos e nas **regras de negócio** que disparam mudança de vigência — não na forma como o usuário navega até o conteúdo. Por isso o padrão abaixo é definido uma vez, no nível do produto, e cada trilha o aplica ao seu próprio conjunto de blocos.

### 13.2 Padrão de navegação

- Toda trilha de parametrização segue a hierarquia fixa: \`Empresa → [Nome da trilha] → Aba de bloco → Campo\`. Quatro níveis, sem exceção — nenhuma trilha deve introduzir uma tela intermediária de seleção obrigatória (o erro que a primeira proposta de Fiscal cometeu com Vigências como portão).
- A trilha carrega, por padrão, o estado mais recente/vigente de seus parâmetros. Qualquer eixo temporal (vigência, versão, competência) é tratado como um **filtro contextual sobre o mesmo caminho de navegação**, nunca como um nível hierárquico adicional.
- A navegação entre abas dentro de uma trilha preserva o contexto temporal ativo (mesma vigência/versão) — trocar de aba nunca reseta o que o usuário estava consultando.
- Trilhas sem necessidade de versionamento (por exemplo, uma futura trilha puramente de configuração sem efeito retroativo) simplesmente não implementam o seletor de vigência — o restante do padrão de navegação continua valendo.

### 13.3 Padrão de layout

Estrutura de página comum a qualquer trilha de parametrização:

1. **Cabeçalho de contexto** — nome da empresa + nome da trilha + (quando aplicável) indicador de vigência/versão ativa.
2. **Barra de abas** — blocos temáticos da trilha, seguindo o padrão de organização descrito em 14.5.
3. **Área de conteúdo** — o bloco selecionado, organizado internamente em seções expansíveis quando o volume de campos justificar (ver componente "Bloco de Parâmetros" na Biblioteca de Componentes).
4. **Área de alertas/pendências** — persistente, acima do conteúdo do bloco, para qualquer alerta ou pendência de ação humana gerado por regra fixa da trilha (não fica dentro de um campo específico, para não se perder quando o usuário troca de aba).

Esse esqueleto de página é o mesmo para Fiscal, DP e Contábil — o que muda é o conteúdo de cada aba e a existência ou não do indicador de vigência.

### 13.4 Padrão de seleção de vigência

- **Indicador persistente, não tela de portão.** Toda trilha versionada exibe, no cabeçalho, um controle compacto do tipo "Vigência atual — desde DD/MM/AAAA" (ou "Versão vigente" para trilhas onde o termo "vigência" não se aplica). Esse controle nunca bloqueia o acesso ao conteúdo da trilha.
- **Histórico como vista secundária.** O controle expõe uma ação ("Ver histórico") que abre a linha do tempo completa — painel lateral ou tela própria, dependendo do volume de eventos da trilha — sem sair do contexto de navegação corrente.
- **Contexto histórico é sempre somente leitura.** Ao selecionar um período passado, todas as abas da trilha (não só a que estava aberta) passam a somente leitura, e o indicador de cabeçalho comunica claramente que o usuário está fora da vigência atual.
- **Regras de transição são responsabilidade de cada trilha, não do componente.** O componente de seleção de vigência é agnóstico às regras de bloqueio/alerta/pendência — cada trilha define suas próprias regras fixas (Fiscal já define três; DP e Contábil definirão as suas quando chegar a vez) e apenas notifica o componente de que uma nova versão deve ser criada.

### 13.5 Padrão de breadcrumbs

- O breadcrumb reflete **hierarquia de navegação**, não estado temporal: \`Empresa > [Nome da trilha] > [Bloco atual]\`. Exemplo: \`Bhub Contabilidade > Parâmetros Fiscais > Estaduais e Municipais\`.
- O indicador de vigência/versão **não entra no breadcrumb** — ele é um badge de estado ao lado do breadcrumb, não um nível de caminho. Misturar os dois faria o usuário interpretar "vigência" como um lugar para onde se navega, quando na verdade é um filtro sobre o lugar em que já se está.
- Trilhas futuras seguem o mesmo formato de dois ou três níveis; se uma trilha precisar de sub-blocos com breadcrumb mais profundo, isso é sinal de que o bloco deveria ser uma seção expansível dentro da aba, não um nível de navegação novo.

### 13.6 Padrão de organização das abas

Regras aplicáveis à criação de qualquer aba, em qualquer trilha:

- **Teto recomendado de 5 a 7 abas por trilha.** Acima disso, agrupar blocos correlatos usando seções expansíveis dentro de uma aba maior, em vez de adicionar mais abas.
- **Um bloco com menos de ~5 campos não justifica aba própria**, a menos que se preveja crescimento relevante em fases futuras (caso do bloco Federais em Fiscal, que hoje é pequeno só porque Lucro Presumido/Lucro Real ainda estão fora de escopo). Ao decidir fundir ou não um bloco pequeno, perguntar: "esse bloco vai crescer quando o escopo da trilha aumentar?" — se sim, mantê-lo separado; se não, fundir.
- **Ordenar abas por abrangência decrescente ou por frequência de uso**, não por ordem alfabética nem pela ordem em que o documento de requisitos foi escrito.
- **Blocos "em construção" ficam por último**, visíveis mas desabilitados, nunca ocultos — preserva o levantamento sem sugerir que a funcionalidade já existe.
- **Fluxos únicos de onboarding (não recorrentes) não são abas da trilha.** Se um bloco só é relevante uma vez na vida da empresa (caso de Implantação em Fiscal), ele pertence ao fluxo de onboarding da empresa, com no máximo um link de auditoria somente leitura dentro de uma aba existente — nunca uma aba permanente própria.

### 13.7 Componentes compartilhados

A lista completa está na seção 14 (Biblioteca de Componentes). Em termos de arquitetura global, vale destacar que esses componentes devem viver em \`src/components/shared\` (não dentro de \`src/features/fiscal\`), exatamente pela convenção já registrada em \`docs/arquitetura.md\` — uma feature não importa outra feature diretamente, então qualquer componente usado por mais de uma trilha precisa estar promovido ao nível compartilhado antes que a segunda trilha (DP ou Contábil) precise dele. Construir esses componentes já pensando em Fiscal + DP + Contábil evita que a primeira trilha implementada "seja dona" acidentalmente de um componente que deveria ser neutro.

### 13.8 Aplicação por trilha

| Trilha | Tem conceito de vigência/versão? | Observação de aplicação do padrão |
|---|---|---|
| **Fiscal** | Sim — vigência com efeito de bloqueio de apuração | Primeira trilha a implementar o padrão; referência para as demais |
| **DP** | Provavelmente sim — mudanças de tabela de INSS/IRRF, convenção coletiva, configuração de eSocial tendem a ter efeito retroativo e exigir histórico | Reaproveita o seletor de vigência e a área de alertas; as regras fixas de transição serão próprias da folha, não as três regras do Fiscal |
| **Contábil** | Parcial — plano de contas e regras contábeis mudam por decisão de configuração, não necessariamente por obrigação legal com efeito retroativo | Pode precisar apenas de histórico de alteração (auditoria) sem o conceito pleno de "vigência que bloqueia apuração"; avaliar com Produto se o componente de vigência se aplica ou se basta um log de alterações |
| **Futuras trilhas** | Depende do domínio | Seguem a convenção de pastas já definida (\`features/<trilha>\`) e reaproveitam o esqueleto de layout, breadcrumb e barra de abas por padrão; só implementam o seletor de vigência se o domínio realmente tiver efeito retroativo a versionar |

---

## 14. Biblioteca de Componentes

*Componentes que devem ser desenhados desde já para reuso entre Fiscal, DP, Contábil e trilhas futuras — nenhum deles deve ser implementado como específico de uma única trilha.*

### Seletor de Vigência

- **Objetivo:** indicar, de forma compacta e persistente, qual período/versão está sendo exibido, sem ocupar um nível de navegação.
- **Responsabilidade:** exibir a vigência/versão atual; abrir o histórico completo sob demanda; propagar a vigência selecionada para toda a trilha.
- **Estados:** vigência atual (editável); vigência histórica selecionada (somente leitura); carregando; trilha sem nenhuma vigência ainda (vazio, aguardando onboarding).
- **Reutilização:** qualquer trilha com conceito de versionamento temporal (Fiscal certamente; DP provavelmente).
- **Telas onde será utilizado:** cabeçalho de todas as abas de Parâmetros Fiscais; futuramente, cabeçalho das trilhas de DP e Contábil que adotarem versionamento.

### Linha do Tempo / Histórico de Vigências

- **Objetivo:** dar acesso completo ao histórico de períodos sem exigir que o usuário passe por ele a cada visita.
- **Responsabilidade:** listar vigências passadas e atual em ordem cronológica; permitir seleção de uma vigência para consulta; expor a ação "Iniciar nova vigência" quando aplicável à trilha.
- **Estados:** carregando; vazio (uma única vigência, sem histórico); com histórico; vigência selecionada destacada.
- **Reutilização:** mesma condição do Seletor de Vigência — qualquer trilha versionada.
- **Telas onde será utilizado:** painel/tela de histórico acionado pelo Seletor de Vigência em Parâmetros Fiscais; potencialmente reaproveitado por DP.

### Bloco de Parâmetros (seção expansível)

- **Objetivo:** organizar campos relacionados dentro de uma aba sem exigir mais uma aba.
- **Responsabilidade:** exibir/ocultar um grupo de campos; manter estado de expansão por sessão de uso.
- **Estados:** expandido; recolhido; com alerta interno (badge indicando pendência dentro da seção).
- **Reutilização:** qualquer aba com mais de um subtema — usado dentro de Estaduais e Municipais e de Obrigações e Documentos Fiscais em Fiscal; aplicável a qualquer trilha com blocos de conteúdo denso.
- **Telas onde será utilizado:** todas as abas de bloco temático de qualquer trilha.

### Campo com Origem

- **Objetivo:** deixar explícito, em cada campo, se ele é editável e de onde vem o valor, sem exigir que o usuário abra uma legenda para entender.
- **Responsabilidade:** renderizar o campo no modo correto (editável/somente leitura/calculado) conforme a origem; exibir a badge de origem.
- **Estados:** editável (origem Manual); somente leitura (origem Cockpit/BHules/Motor de cálculo/SERPRO/Legislação/Sistema); calculado; vazio por não aplicação ao enquadramento.
- **Reutilização:** todo campo de qualquer trilha que venha de uma fonte externa — é o componente de maior reuso do produto. Deve generalizar (e não duplicar) os padrões já existentes de \`CampoDado\`/\`AvisoSomenteLeitura\` na feature Empresas.
- **Telas onde será utilizado:** todas as telas de todas as trilhas que exibam dados de origem mista.

### Badge de Origem do Dado

- **Objetivo:** rótulo curto e consistente para comunicar a origem de um valor.
- **Responsabilidade:** mapear a origem (Manual, Cockpit, BHules, Motor de cálculo, SERPRO, Legislação, Sistema) para um rótulo e estilo visual padronizados.
- **Estados:** um estado por origem — sem variação além disso.
- **Reutilização:** usado dentro do componente Campo com Origem, mas também isoladamente em cabeçalhos de bloco e em cards informativos.
- **Telas onde será utilizado:** qualquer tela que precise comunicar procedência de dado, em qualquer trilha.

### Alerta/Banner de Regra Fixa

- **Objetivo:** comunicar, de forma persistente e visível, um evento automático disparado por regra de negócio (bloqueio, pendência, alerta).
- **Responsabilidade:** exibir a mensagem, a severidade e, quando aplicável, a ação necessária; permanecer visível independentemente da aba selecionada.
- **Estados:** bloqueio (crítico); pendência de ação humana (alto); alerta informativo (médio); nenhum evento ativo (oculto).
- **Reutilização:** cada trilha define suas próprias regras fixas (as três de Fiscal; outras futuras de DP/Contábil), mas todas usam o mesmo componente visual de severidade.
- **Telas onde será utilizado:** área de alertas do cabeçalho de qualquer trilha (ver 13.3).

### Card de Pendência de Ação Humana

- **Objetivo:** transformar uma pendência em uma tarefa acionável, não apenas um aviso passivo.
- **Responsabilidade:** descrever a pendência, indicar a ação disponível (ex.: "Gerar guias avulsas") e o estado de conclusão.
- **Estados:** pendente; em andamento (quando a ação tiver etapas); concluída.
- **Reutilização:** qualquer trilha cujas regras fixas gerem tarefas para o usuário, não apenas avisos.
- **Telas onde será utilizado:** tela/painel de histórico de vigências em Fiscal; potencialmente Central de Pendências de outras trilhas.

### Cadastro Repetível (grade genérica)

- **Objetivo:** capturar múltiplas linhas de um mesmo tipo de dado (por UF, por imposto, por competência) sem modelar uma grade específica para cada caso.
- **Responsabilidade:** adicionar, editar e remover linhas; validar unicidade quando aplicável (ex.: uma inscrição por UF).
- **Estados:** vazio; com linhas; linha em edição; somente leitura (quando a vigência selecionada é histórica).
- **Reutilização:** inscrição estadual por UF, benefícios e convênios de ICMS, série/numeração de documentos, saldo inicial por imposto, receita/folha mensal — e qualquer necessidade futura de DP/Contábil de capturar listas por dimensão.
- **Telas onde será utilizado:** Estaduais e Municipais, Obrigações e Documentos Fiscais, Implantação, em Fiscal; extensível a outras trilhas.

### Select de Lista Fechada

- **Objetivo:** garantir que campos de lista suspensa/múltipla só aceitem valores de um dicionário fechado e validado pela área fiscal/de negócio.
- **Responsabilidade:** carregar as opções de uma fonte de configuração (não hardcoded na tela) e impedir valores fora da lista.
- **Estados:** carregado; vazio (dicionário não configurado); desabilitado (não aplicável ao enquadramento).
- **Reutilização:** qualquer campo de lista fechada de qualquer trilha (os dicionários D01–D35 de Fiscal são o primeiro caso, mas o componente não deve saber que é "fiscal").
- **Telas onde será utilizado:** todas as abas de qualquer trilha com campos de lista suspensa/múltipla.

### Seção "Em Construção"

- **Objetivo:** preservar a estrutura de um bloco que ainda não tem modelagem fechada, sem simular funcionalidade que não existe.
- **Responsabilidade:** exibir a aba/bloco como visível, mas com os campos desabilitados e uma indicação clara de status futuro.
- **Estados:** único estado — desabilitado com rótulo "Em construção".
- **Reutilização:** Reforma Tributária em Fiscal; qualquer bloco futuro de qualquer trilha com modelagem ainda não fechada.
- **Telas onde será utilizado:** última aba de qualquer trilha com blocos pendentes de definição.

### Indicador Calculado (somente leitura)

- **Objetivo:** exibir um valor que o Autopilot nunca decide, apenas consome, deixando isso óbvio para o usuário.
- **Responsabilidade:** renderizar o valor calculado com sua origem e, quando aplicável, um link para o relatório/detalhe de onde ele vem.
- **Estados:** com valor; sem valor disponível (fonte não retornou); carregando.
- **Reutilização:** RBT12, RBA, Fator R, Anexo em Fiscal; qualquer indicador equivalente em DP (ex.: base de cálculo de encargos) ou Contábil.
- **Telas onde será utilizado:** Gerais e Federais em Fiscal; blocos equivalentes em outras trilhas.

### Breadcrumb de Trilha

- **Objetivo:** comunicar a posição hierárquica atual sem confundir com o eixo temporal.
- **Responsabilidade:** renderizar \`Empresa > Trilha > Bloco atual\`, sem incluir vigência/versão.
- **Estados:** com bloco selecionado; sem bloco selecionado (aba padrão).
- **Reutilização:** toda trilha de parametrização do produto.
- **Telas onde será utilizado:** cabeçalho de qualquer tela de qualquer trilha.

### Barra de Abas

- **Objetivo:** navegação entre blocos temáticos de uma trilha.
- **Responsabilidade:** renderizar as abas na ordem definida pela trilha; suportar aba desabilitada (placeholder); indicar aba ativa.
- **Estados:** aba ativa; aba inativa; aba desabilitada; aba com badge de alerta/pendência.
- **Reutilização:** toda trilha de parametrização do produto.
- **Telas onde será utilizado:** imediatamente abaixo do cabeçalho de contexto, em qualquer trilha.

---

## 15. Fluxo Funcional

*Diagramas que descrevem o fluxo completo da funcionalidade. Servem de referência de comportamento para a implementação — não substituem as regras de negócio detalhadas nas seções anteriores deste documento.*

### 15.1 Navegação geral e acesso ao onboarding

\`\`\`mermaid
flowchart TD
    A[Empresa] --> B[Parâmetros Fiscais]
    B --> C{Existe vigência ativa?}
    C -->|Não| D[Fluxo de Onboarding da empresa]
    D --> E[Etapa: Implantação e Saldo Inicial]
    E --> F[Primeira vigência criada]
    F --> G[Aba Gerais - vigência atual]
    C -->|Sim| G
    G --> H[Federais]
    G --> I[Estaduais e Municipais]
    G --> J[Contábil x Fiscal]
    G --> K[Obrigações e Documentos Fiscais]
    G --> L[Reforma Tributária - desabilitada]
    B -.indicador persistente.- M[Seletor de Vigência]
    M --> N[Ver histórico de vigências]
    H -.link de auditoria.- E
\`\`\`

### 15.2 Seleção de vigência e troca entre abas

\`\`\`mermaid
sequenceDiagram
    participant U as Usuário
    participant PF as Parâmetros Fiscais
    participant SV as Seletor de Vigência
    participant HV as Histórico de Vigências

    U->>PF: Abre Parâmetros Fiscais
    PF->>PF: Carrega vigência atual por padrão
    PF->>U: Exibe aba Gerais (editável)
    U->>PF: Troca para aba Estaduais e Municipais
    PF->>U: Exibe bloco na mesma vigência (editável)
    U->>SV: Clica em "Ver histórico de vigências"
    SV->>HV: Abre linha do tempo
    HV->>U: Lista vigências (atual + históricas)
    U->>HV: Seleciona vigência histórica
    HV->>PF: Atualiza contexto de vigência
    PF->>U: Todas as abas passam a somente leitura
    U->>SV: Retorna para "Vigência atual"
    SV->>PF: Restaura contexto editável
\`\`\`

### 15.3 Ciclo de vida da vigência (regras fixas de transição)

\`\`\`mermaid
stateDiagram-v2
    [*] --> VigenciaAtiva
    VigenciaAtiva --> Bloqueada: Alteração cadastral no Cockpit
    Bloqueada --> NovaVigenciaAberta: Análise humana concluída
    VigenciaAtiva --> PendenteAcaoHumana: Excesso de sublimite
    PendenteAcaoHumana --> NovaVigenciaAberta: Guias avulsas geradas (DAS continua sem ICMS/ISS)
    VigenciaAtiva --> NovaVigenciaAberta: Cruzamento de Fator R (alerta, sem bloqueio)
    VigenciaAtiva --> VigenciaAtiva: Troca de faixa de receita bruta (apenas alerta)
    VigenciaAtiva --> NovaVigenciaAberta: Ação manual "Iniciar nova vigência"
    NovaVigenciaAberta --> VigenciaAtiva: Vigência anterior encerrada
\`\`\`

### 15.4 Acesso ao onboarding e ligação com a primeira vigência

\`\`\`mermaid
flowchart TD
    A[Empresa nova ou migrada] --> B[Fluxo de Onboarding]
    B --> C[Etapa: Implantação e Saldo Inicial]
    C --> D{Consulta ao SERPRO}
    D -->|Sucesso| E[Saldo inicial, receita e folha dos 12 meses, RBA carregados]
    D -->|Falha ou incompleto| F[Contingência manual - fluxo de tratamento ainda em definição]
    E --> G[Primeira vigência criada em Parâmetros Fiscais]
    F --> G
    G --> H[Empresa operacional]
    H --> I[Implantação some da navegação principal]
    I --> J[Acesso remanescente apenas via link de auditoria em Gerais - somente leitura]
\`\`\`

### 15.5 Integrações externas por bloco

\`\`\`mermaid
flowchart LR
    CK[Cockpit] -->|regime tributário, tipo de estabelecimento, MEI, condição de contribuinte de ICMS, inscrições| AP[Parâmetros Fiscais]
    BH[BHules] -->|documentos emitidos, tributação monofásica| AP
    MC[Motor de Cálculo] -->|Anexo, RBT12, RBA, Fator R, PGDAS-D, DAS| AP
    SP[SERPRO] -->|saldo inicial, histórico de 12 meses| AP
    LG[Legislação] -->|limites e sublimite fixos| AP
    SYS[Sistema - regras fixas] -->|bloqueio, pendência, alertas, habilitação automática de obrigações| AP
    AP -.consulta apenas, não altera.-> CK
    AP -.consulta apenas, não altera.-> BH
    AP -.consulta apenas, não altera.-> MC
\`\`\`

*Nenhum destes diagramas substitui a análise de riscos da seção 10 — em particular, o fluxo de Implantação (15.4) e a consulta ao SERPRO (15.5) seguem marcados como pendentes de definição, e o comportamento exato de "excesso de sublimite" em 15.3 segue sujeito à confirmação apontada no risco 1.*
`,
  },

  // fonte: docs/03-cadastro-socios.md
  "03-cadastro-socios": {
    title: `Cadastro de Sócios — Especificação funcional`,
    source: "docs/03-cadastro-socios.md",
    markdown: `# Especificação Funcional — Cadastro de Sócios

> Status: MVP implementado no protótipo navegável — ver "Notas de implementação do protótipo" ao final
> Escopo: MVP
> Documento funcional para orientar a construção do módulo Cadastro de Sócios.

---

# Objetivo

O módulo **Cadastro de Sócios** é responsável por manter o cadastro único de pessoas físicas que participam do quadro societário de uma ou mais empresas.

Seu objetivo é centralizar os dados cadastrais do sócio, evitando duplicidade de informações entre empresas e permitindo que uma mesma pessoa seja vinculada a diferentes empresas ao longo do tempo.

Este módulo não substitui a aba **Quadro Societário** do Cadastro de Empresas. Ele complementa esse fluxo fornecendo uma entidade mestre reutilizável.

---

# Princípios do Domínio

## Cadastro único

Cada sócio deve possuir apenas um cadastro.

A identidade do cadastro é determinada principalmente pelo CPF.

Não deve existir duplicação de registros para uma mesma pessoa.

---

## Separação entre Pessoa e Participação

O cadastro do sócio representa apenas a pessoa.

As informações referentes à participação societária pertencem ao relacionamento entre Sócio e Empresa.

Exemplos:

Dados do Sócio

- Nome
- CPF
- Contatos
- Dados cadastrais

Dados da Participação

- Empresa
- Percentual
- Capital integralizado, Capital a integralizar e Total do capital
- Quotas integralizadas, Quotas a integralizar e Total de quotas
- Tipo de participação
- Data de entrada
- Data de saída

---

## Compartilhamento

Um mesmo sócio pode participar de diversas empresas.

Alterações cadastrais realizadas no cadastro do sócio devem refletir automaticamente em todas as empresas onde ele esteja vinculado.

---

# Escopo do MVP

O MVP contempla apenas o cadastro mestre do sócio.

## Funcionalidades

### Listagem

A tela deve permitir:

- listar sócios cadastrados
- pesquisar por nome
- pesquisar por CPF
- visualizar quantidade de empresas vinculadas

---

### Cadastro

Permitir:

- cadastrar novo sócio
- editar dados cadastrais
- visualizar cadastro

---

### Dados mínimos

Obrigatórios

- Nome completo
- CPF

Opcionais

- E-mail
- Telefone

---

### Exclusão

Caso o sócio possua vínculos com empresas, sua exclusão não deve ser permitida.

Neste cenário o sistema deverá orientar o usuário a remover primeiro as participações.

> Nota de implementação: o protótipo navegável ainda não expõe uma ação de excluir na listagem — apenas cadastrar, editar e visualizar (ver "Listagem" e "Cadastro" acima). A regra de bloqueio por vínculo permanece definida aqui para quando essa ação for adicionada.

---

# Integração com Cadastro de Empresas

A aba **Quadro Societário** deixa de cadastrar pessoas diretamente.

Ela passa a trabalhar apenas com vínculos.

Fluxo esperado:

Adicionar Sócio

↓

Pesquisar cadastro existente

↓

Selecionar sócio

↓

Definir dados da participação

Caso o sócio ainda não exista:

Adicionar Sócio

↓

Novo Cadastro

↓

Salvar

↓

Retornar automaticamente ao fluxo de vinculação.

> Nota de implementação: esse fluxo já está de pé no protótipo — a aba Quadro Societário (Cadastro de Empresas) e o Cadastro de Sócios consomem o mesmo registro (\`SociosData\`). O combobox "Adicionar sócio" do Quadro Societário já pesquisa nesse registro único e já exclui quem já está vinculado à empresa atual. A integração descrita nesta seção não ficou para uma evolução futura — foi antecipada nesta entrega (ver "Notas de implementação do protótipo").

---

# Responsabilidades

## Cadastro de Sócios

Responsável por:

- dados pessoais
- contatos
- cadastro único

Não gerencia participações societárias.

---

## Cadastro de Empresas

Responsável por:

- composição societária
- inclusão de sócios
- remoção do vínculo (participação) de um sócio com a empresa — não a exclusão do cadastro do sócio, que é responsabilidade do Cadastro de Sócios (ver "Exclusão" acima)
- percentual
- quotas
- tipo
- datas

---

# Regras de Negócio

## CPF único

Não permitir dois sócios com o mesmo CPF.

---

## Cadastro compartilhado

Toda empresa referencia o mesmo cadastro do sócio.

Não deve existir duplicação de dados cadastrais.

---

## Participação independente

Um mesmo sócio pode possuir participações diferentes em empresas diferentes.

Exemplo

Empresa A

- 30%

Empresa B

- 80%

Empresa C

- Sócio Administrador

---

# Fora do Escopo do MVP

Não faz parte desta entrega:

- gestão de documentos
- certificados digitais
- procurações
- assinaturas
- poderes de representação
- histórico de alterações
- timeline de participações
- upload de arquivos
- workflow de aprovação

---

# Evoluções Futuras

O modelo proposto prepara o sistema para futuras evoluções sem necessidade de remodelagem.

Possíveis incrementos:

## Perfil do Sócio

- foto
- endereço
- documentos adicionais

---

## Histórico

Visualizar todas as participações ao longo do tempo.

---

## Consulta Consolidada

Visualizar:

- empresas vinculadas
- participações ativas
- participações encerradas

---

## Documentos

Centralização de:

- procurações
- documentos pessoais
- certificados
- anexos

---

## Integrações

Possibilidade de integração com outros módulos do produto que utilizem o mesmo cadastro de pessoa.

---

# Princípios de UX

O usuário deve cadastrar uma pessoa apenas uma vez.

Depois disso, todas as empresas reutilizam esse cadastro.

O fluxo deve privilegiar:

- pesquisa antes da criação;
- prevenção de duplicidade;
- reaproveitamento de cadastro;
- consistência dos dados.

---

# Decisões Arquiteturais

## Cadastro centralizado

Optou-se por um cadastro mestre de sócios para garantir uma única fonte de verdade para os dados cadastrais da pessoa.

## Separação entre Pessoa e Participação

As informações cadastrais pertencem ao Sócio.

As informações societárias pertencem ao vínculo entre Sócio e Empresa.

Essa separação evita duplicidade de dados e permite reutilização do cadastro em diferentes empresas.

## Evolução incremental

O MVP contempla apenas o cadastro mestre e sua integração com o Cadastro de Empresas.

Funcionalidades como documentos, histórico, procurações e certificados devem ser implementadas em evoluções futuras, preservando a simplicidade inicial sem comprometer a arquitetura.

---

# Notas de implementação do protótipo

Decisões tomadas durante a construção do protótipo navegável que não estavam explícitas nesta especificação, ou que a antecipam. Registradas aqui para manter este documento como fonte de verdade — se alguma delas for revista, atualize este documento junto com o protótipo.

## Visualizar e editar unificados num único drawer

Não existem mais telas/estados separados para "visualizar" e "editar". Um clique na seta da linha (mesmo ícone/posição usados na listagem de Empresas) abre um único painel lateral (drawer) sempre editável, pré-preenchido com os dados do sócio. Ver e alterar um cadastro passaram a ser a mesma ação; salvar é opcional.

## Critério de "empresa vinculada"

Uma participação só conta como vínculo ativo enquanto não tiver data de saída preenchida. Uma participação encerrada (com data de saída) não é somada em "quantidade de empresas vinculadas" nem aparece na seção "Empresas vinculadas" do drawer.

## Integração com Quadro Societário antecipada

A seção "Integração com Cadastro de Empresas" acima descreve o fluxo de pesquisar/selecionar um sócio existente a partir do Quadro Societário. Essa integração já está implementada: o Cadastro de Sócios e a aba Quadro Societário (Cadastro de Empresas) leem e escrevem no mesmo registro. Um sócio cadastrado ou editado em uma das duas telas aparece imediatamente na outra.

## Atalho para o cadastro da empresa

Dentro do drawer, cada empresa em "Empresas vinculadas" tem um link "Abrir cadastro" que leva direto à aba Dados gerais daquela empresa no Cadastro de Empresas — de lá, as demais abas (Atividades, Quadro societário, Contadores, Empresa centralizadora, Módulos) ficam a um clique.

## Ação de excluir ainda não existe na tela

A regra de negócio "CPF único" e a regra de bloqueio de exclusão com vínculos ativos (seção "Exclusão") estão descritas nesta especificação, mas a listagem do protótipo ainda não tem um botão de excluir — apenas cadastrar, editar e visualizar. Quando essa ação for adicionada, a regra de bloqueio já está definida e deve ser aplicada.

## "Desvincular" (Quadro Societário) não é "excluir" (Cadastro de Sócios)

A aba Quadro Societário (Cadastro de Empresas) permite remover a participação de um sócio na empresa aberta — a ação é rotulada "desvincular", nunca "excluir", e a mensagem de confirmação deixa explícito que o sócio continua cadastrado no registro unificado e mantém suas participações em outras empresas. Essa tela nunca exclui o cadastro do sócio em si.

A exclusão do cadastro completo do sócio (com o bloqueio quando há vínculos ativos, descrito na seção "Exclusão") pertence exclusivamente a este módulo (Cadastro de Sócios) e, como registrado acima, ainda não foi implementada aqui. Se um dia a nomenclatura "desvincular" do Quadro Societário for revista, mantenha a distinção clara entre as duas ações — são operações diferentes sobre entidades diferentes (vínculo vs. pessoa).

## Navegação: aba dentro de Cadastros Auxiliares, não módulo próprio

Este módulo não tem mais uma entrada isolada no menu de nível superior. Ele vive como aba interna ("Sócios") dentro do módulo **Cadastros Auxiliares** — que reúne cadastros mestres reutilizados por Empresas, hoje "Sócios" e "Registro de Contadores" (ver \`docs/04-registro-contadores.md\`). A tela em si (arquivo, comportamento, componentes, mock de dados, layout) foi preservada integralmente; só a localização na navegação mudou.

No protótipo, isso significa: o item de menu lateral passou de "Sócios" (\`socios/index.html\`) para "Cadastros Auxiliares" (\`cadastros-auxiliares/socios.html\`), e a tela ganhou uma barra de abas acima do próprio título "Sócios" para alternar para "Registro de Contadores" — a única adição visual sobre a tela original. Os arquivos internos (\`js/data.js\` → \`SociosData\`, \`js/list.js\`) foram movidos verbatim para \`cadastros-auxiliares/js/socios/\`, sem alteração de comportamento.`,
  },

  // fonte: docs/04-registro-contadores.md
  "04-registro-contadores": {
    title: `Registro de Contadores — Especificação funcional`,
    source: "docs/04-registro-contadores.md",
    markdown: `# Especificação Funcional — Registro de Contadores

> Status: MVP implementado no protótipo navegável — ver "Notas de implementação do protótipo" ao final
> Escopo: MVP
> Documento funcional para orientar a construção do módulo Registro de Contadores.

---

# Objetivo

O módulo **Registro de Contadores** é responsável por manter o cadastro único de contadores habilitados a atuar sobre uma ou mais empresas (por exemplo, para assinar demonstrativos).

Seu objetivo é centralizar os dados cadastrais do contador, evitando duplicidade de informações entre empresas e permitindo que um mesmo contador seja vinculado a diferentes empresas ao longo do tempo.

Este módulo não substitui a aba **Contadores** do Cadastro de Empresas. Ele complementa esse fluxo fornecendo uma entidade mestre reutilizável — exatamente o mesmo papel que o **Cadastro de Sócios** desempenha para o Quadro Societário (ver \`docs/03-cadastro-socios.md\`).

---

# Princípios do Domínio

## Cadastro único

Cada contador deve possuir apenas um cadastro.

A identidade do cadastro é determinada principalmente pelo CPF.

Não deve existir duplicação de registros para o mesmo contador.

---

## Compartilhamento

Um mesmo contador pode atender diversas empresas.

Alterações cadastrais realizadas no cadastro do contador (nome, CPF, CRC) devem refletir automaticamente em todas as empresas onde ele esteja vinculado.

---

## Sem atributos próprios de vínculo

Diferente do Sócio (cuja participação numa empresa carrega percentual, quotas, tipo e datas — ver \`docs/03-cadastro-socios.md\`), o vínculo entre um contador e uma empresa não tem atributos próprios: o contador está vinculado, ou não está. Não existe "percentual de atendimento" nem período de vínculo.

---

# Escopo do MVP

O MVP contempla apenas o cadastro mestre do contador.

## Funcionalidades

### Listagem

A tela deve permitir:

- listar contadores cadastrados
- pesquisar por nome
- pesquisar por CPF
- visualizar quantidade de empresas vinculadas

---

### Cadastro

Permitir:

- cadastrar novo contador
- editar dados cadastrais
- visualizar cadastro

---

### Dados mínimos

Obrigatórios

- Nome completo
- CPF
- CRC

Fora do escopo (ver "Fora do Escopo do MVP")

- Dados de acesso
- Credenciais necessárias

---

### Exclusão

Caso o contador possua vínculos com empresas, sua exclusão não deve ser permitida.

Neste cenário o sistema deverá orientar o usuário a remover primeiro os vínculos.

> Nota de implementação: o protótipo navegável ainda não expõe uma ação de excluir na listagem — apenas cadastrar, editar e visualizar (ver "Listagem" e "Cadastro" acima). A regra de bloqueio por vínculo permanece definida aqui para quando essa ação for adicionada. Mesma decisão já tomada no Cadastro de Sócios.

---

# Integração com Cadastro de Empresas

A aba **Contadores** deixa de listar contadores em modo somente leitura.

Ela passa a trabalhar apenas com vínculos.

Fluxo esperado:

Vincular Contador

↓

Pesquisar cadastro existente

↓

Selecionar contador

↓

Confirmar vínculo

Caso o contador ainda não exista:

Vincular Contador

↓

Cadastrar em Cadastros Auxiliares → Registro de Contadores

↓

Salvar

↓

Retornar ao fluxo de vinculação, agora com o contador disponível no combobox.

> Nota de implementação: esse fluxo já está de pé no protótipo — a aba Contadores (Cadastro de Empresas) e o Registro de Contadores consomem o mesmo registro (\`ContadoresData\`). O combobox "Vincular contador" da aba Contadores já pesquisa nesse registro único e já exclui quem já está vinculado à empresa atual. A integração descrita nesta seção não ficou para uma evolução futura — foi antecipada nesta entrega, no mesmo padrão já usado por Sócios/Quadro Societário (ver "Notas de implementação do protótipo").

---

# Responsabilidades

## Registro de Contadores

Responsável por:

- dados pessoais do contador (nome, CPF, CRC)
- cadastro único

Não gerencia quais empresas o contador atende — isso é o vínculo.

---

## Cadastro de Empresas

Responsável por:

- vínculo entre a empresa aberta e um contador já cadastrado
- remoção do vínculo (não a exclusão do cadastro do contador, que é responsabilidade do Registro de Contadores — ver "Exclusão" acima)

---

# Regras de Negócio

## CPF único

Não permitir dois contadores com o mesmo CPF.

---

## Cadastro compartilhado

Toda empresa referencia o mesmo cadastro do contador.

Não deve existir duplicação de dados cadastrais.

---

## Vínculo independente por empresa

Um mesmo contador pode atender empresas diferentes, cada vínculo sendo independente dos demais.

Exemplo

Empresa A

- Contador vinculado

Empresa B

- Mesmo contador vinculado

Empresa C

- Contador diferente vinculado

---

# Fora do Escopo do MVP

Não faz parte desta entrega:

- Dados de acesso
- Credenciais necessárias
- gestão de documentos
- certificados digitais
- procurações
- assinaturas
- histórico de alterações
- upload de arquivos
- workflow de aprovação
- definição explícita de qual contador vinculado é o "Contador responsável" exibido em Dados Gerais (hoje resolvido automaticamente pelo primeiro vínculo encontrado)

---

# Evoluções Futuras

O modelo proposto prepara o sistema para futuras evoluções sem necessidade de remodelagem.

Possíveis incrementos:

## Perfil do Contador

- foto
- endereço
- especialidades

---

## Dados de Acesso e Credenciais

Definição de produto sobre o significado exato desses campos (login/senha vs. outra credencial) e sua forma de armazenamento seguro.

---

## Histórico

Visualizar todos os vínculos ao longo do tempo (hoje o vínculo não tem data de início/fim, diferente da participação de sócio).

---

## Consulta Consolidada

Visualizar:

- empresas atendidas
- contador responsável por empresa, com ação explícita de definição

---

## Integrações

Possibilidade de integração com outros módulos do produto que utilizem o mesmo cadastro de pessoa (por exemplo, se o mesmo indivíduo também for sócio).

---

# Princípios de UX

O usuário deve cadastrar um contador apenas uma vez.

Depois disso, todas as empresas reutilizam esse cadastro.

O fluxo deve privilegiar:

- pesquisa antes da criação;
- prevenção de duplicidade;
- reaproveitamento de cadastro;
- consistência dos dados;
- consistência com o padrão já estabelecido pelo Cadastro de Sócios.

---

# Decisões Arquiteturais

## Cadastro centralizado

Optou-se por um cadastro mestre de contadores para garantir uma única fonte de verdade para os dados cadastrais do contador — mesma decisão já tomada para Sócios.

## Sem entidade de "participação"

Diferente de Sócios, não existe uma entidade de vínculo com atributos próprios (percentual, quotas, tipo, datas). O vínculo contador–empresa é uma simples associação (contador atende ou não atende a empresa), o que simplifica o modelo e a tela de vínculo em relação ao Quadro Societário.

## Evolução incremental

O MVP contempla apenas o cadastro mestre e sua integração com o Cadastro de Empresas.

Funcionalidades como dados de acesso, credenciais, documentos e histórico devem ser implementadas em evoluções futuras, preservando a simplicidade inicial sem comprometer a arquitetura.

---

# Notas de implementação do protótipo

Decisões tomadas durante a construção do protótipo navegável que não estavam explícitas nesta especificação, ou que a antecipam. Registradas aqui para manter este documento como fonte de verdade — se alguma delas for revista, atualize este documento junto com o protótipo.

## Navegação: aba dentro de Cadastros Auxiliares

Este módulo não tem uma entrada isolada no menu de nível superior. Ele vive como aba interna ("Registro de Contadores") dentro do módulo **Cadastros Auxiliares**, ao lado da aba "Sócios" (ver \`docs/03-cadastro-socios.md\`). O item de menu lateral é "Cadastros Auxiliares" (\`cadastros-auxiliares/socios.html\`, primeira aba); a partir dali a barra de abas leva para \`contadores.html\`.

## Visualizar e editar unificados num único drawer

Não existem telas/estados separados para "visualizar" e "editar". Um clique na seta da linha (mesmo ícone/posição usados na listagem de Sócios e de Empresas) abre um único painel lateral (drawer) sempre editável, pré-preenchido com os dados do contador. Ver e alterar um cadastro passaram a ser a mesma ação; salvar é opcional. Mesmo padrão do Cadastro de Sócios.

## Integração com a aba Contadores antecipada

A seção "Integração com Cadastro de Empresas" acima descreve o fluxo de pesquisar/selecionar um contador existente a partir da aba Contadores. Essa integração já está implementada: o Registro de Contadores e a aba Contadores (Cadastro de Empresas) leem e escrevem no mesmo registro (\`ContadoresData\`, \`localStorage\` na chave \`autopilot_prototype_contadores_v1\`). Um contador cadastrado ou editado em uma das duas telas aparece imediatamente na outra.

## Atalho para o cadastro da empresa

Dentro do drawer, cada empresa em "Empresas vinculadas" tem um link "Abrir cadastro" que leva direto à aba Dados gerais daquela empresa no Cadastro de Empresas — mesmo padrão do drawer de Sócios.

## "Desvincular" (aba Contadores) não é "excluir" (Registro de Contadores)

A aba Contadores (Cadastro de Empresas) permite remover o vínculo de um contador com a empresa aberta — a ação é rotulada "desvincular", nunca "excluir", e a mensagem de confirmação deixa explícito que o contador continua cadastrado no Registro de Contadores e mantém seus vínculos com outras empresas. Essa tela nunca exclui o cadastro do contador em si. Mesma distinção já aplicada em Sócios/Quadro Societário.

A exclusão do cadastro completo do contador (com o bloqueio quando há vínculos ativos, descrito na seção "Exclusão") pertence exclusivamente a este módulo (Registro de Contadores) e, como registrado acima, ainda não foi implementada aqui.

## Ação de excluir ainda não existe na tela

A regra de negócio "CPF único" e a regra de bloqueio de exclusão com vínculos ativos (seção "Exclusão") estão descritas nesta especificação, mas a listagem do protótipo ainda não tem um botão de excluir — apenas cadastrar, editar e visualizar. Quando essa ação for adicionada, a regra de bloqueio já está definida e deve ser aplicada.
`,
  },

  // fonte: docs/05-importacao-massiva-empresas.md
  "05-importacao-massiva-empresas": {
    title: `Importação Massiva de Empresas — Especificação funcional`,
    source: "docs/05-importacao-massiva-empresas.md",
    markdown: `# Importação Massiva de Empresas — AutoPilot

> Status: Fase 1 implementada no protótipo navegável, incluindo consulta cadastral por CNPJ e fallback por planilha completa, com dois modelos de planilha (simplificado e completo) — ver "Dois modelos de planilha" e "Notas de implementação do protótipo" ao final
> Escopo: Fase 1 (importação em lote dos dados do Cadastro Geral)
> Documento funcional/as-built — descreve o que existe hoje no protótipo, incluindo os pontos em que impacta telas já existentes do módulo Empresas.

Não confundir com **"Importação de Perfil"**, item de Fase 2 listado em \`docs/cadastro-empresas-spec.md\` ("Próximas evoluções") — aquele item trata de importar módulos/perfil de configuração para **uma única empresa já cadastrada**; esta funcionalidade trata de cadastrar **várias empresas de uma vez**, a partir de uma planilha. São dois conceitos distintos, sem sobreposição.

---

# Objetivo

Permitir cadastrar várias empresas de uma só vez, a partir de uma planilha, em vez de repetir o cadastro individual empresa por empresa.

A importação cobre exclusivamente os dados equivalentes à aba **Dados Gerais** (o "Cadastro Geral") de uma empresa — os mesmos campos que já existem nessa aba, sem inventar campos novos. Sócios, Contadores, Atividades e Empresa Centralizadora continuam fora do escopo e precisam ser preenchidos/vinculados manualmente depois, empresa por empresa, como já é feito hoje.

Existem dois modelos de planilha, para dois cenários distintos (ver "Dois modelos de planilha"): um **modelo simplificado**, que traz somente o CNPJ e é o caminho oferecido inicialmente — o AutoPilot consulta os dados cadastrais e preenche automaticamente o resto do Cadastro Geral —, e uma **planilha completa**, oferecida apenas quando a consulta cadastral está indisponível, com todos os campos do Cadastro Geral para preenchimento manual, validada pelas mesmas regras de obrigatoriedade já usadas no Cadastro Geral individual.

Este módulo não substitui o cadastro individual de uma empresa (\`empresas/dados-gerais.html\` e as demais 5 abas) — ele complementa esse fluxo oferecendo uma porta de entrada em lote para o mesmo conjunto de dados.

---

# Princípios do Domínio

## Uma planilha, várias empresas

Cada linha da planilha corresponde a uma empresa nova. Não existe importação parcial de uma única empresa nem edição em lote de empresas já existentes — a importação massiva sempre cria empresas novas.

## Escopo fechado no Cadastro Geral (+ Responsável Legal)

A planilha simulada espelha os campos da aba Dados Gerais **e** os campos da aba Responsável Legal (Nome, CPF, Cargo/Qualificação) — na prática, tudo que descreve "quem é a empresa e quem responde por ela". CNAE (Atividades), Sócios, Contadores e a relação Matriz/Filial (Empresa Centralizadora) não têm coluna na planilha e não são tocados pela importação. Essa divisão está detalhada em "Dois modelos de planilha" e em "Notas de implementação do protótipo".

Importante: incluir Responsável Legal no escopo da planilha é uma decisão da **experiência de importação**, não uma mudança na fonte de verdade desse dado. Por \`docs/01-cadastro-empresas.md\` (seção "3. Responsável Legal"), a aba Responsável Legal do Cadastro de Empresas é somente leitura e tem o Cockpit como fonte de verdade — o mesmo vale para uma empresa importada. A planilha e a consulta cadastral apenas representam/populam esses três campos no protótipo para que a aba não fique vazia após a importação; isso não substitui nem contradiz o Cockpit como origem oficial do dado.

## CNPJ sempre obrigatório, demais campos condicionais ao modelo

O CNPJ nunca pode faltar — é a chave que a consulta cadastral usa para localizar a empresa, e é a única coluna do modelo simplificado. Os demais campos do Cadastro Geral só entram em jogo quando a consulta cadastral está indisponível: nesse momento o usuário passa a usar a planilha completa, que traz todos os campos e exige o preenchimento dos que a consulta não cobriria (ex.: Inscrição Estadual/Municipal, Regime Tributário Federal, Responsável Legal) e de todos os demais campos essenciais do Cadastro Geral individual (ver "Dois modelos de planilha" e "Consulta cadastral e fallback").

## Validar antes de importar

Toda linha é validada antes de qualquer cadastro ser efetivado. Uma linha com inconsistência nunca é importada parcialmente — ou o registro entra completo, ou não entra. A importação massiva nunca cria uma regra de cadastro mais permissiva do que o cadastro individual: uma empresa só é importada se atender aos mesmos requisitos mínimos exigidos para existir no Cadastro de Empresas.

## Simulação completa, sem backend

Fase 1 é inteiramente simulada no protótipo: não há upload real, não há parsing real de planilha, não há API (nem para leitura de planilha, nem para a consulta cadastral). O "processamento", a "consulta cadastral" e a "validação" usam lotes mock fixos e determinísticos (ver "Regras de Negócio"), e a persistência do resultado usa o mesmo mecanismo de \`localStorage\` namespaced já usado por Sócios e Contadores.

---

# Consulta cadastral e fallback

Esta é a lógica central da atualização da Fase 1: depois de identificar os CNPJs da planilha, o sistema tenta uma consulta cadastral simulada para preencher automaticamente o Cadastro Geral, e só recorre à planilha como fonte obrigatória quando a consulta não cobre um dado.

## O que a consulta cadastral devolve

Quando o CNPJ é localizado, a consulta preenche: Razão social, Nome fantasia, Natureza jurídica, Logradouro, Número, Complemento, Bairro, Município, UF, CEP, Telefone, E-mail e Início de atividade (\`ImportarEmpresasData.CAMPOS_VIA_CONSULTA\`, em \`empresas/js/importar-data.js\`). São dados de registro público, equivalentes ao que uma consulta de CNPJ real devolveria.

## O que a consulta cadastral não devolve

Inscrição Estadual, Inscrição Municipal e Regime Tributário Federal não são devolvidos pela consulta — são registros estaduais/municipais ou uma escolha da própria empresa, não dados públicos de CNPJ. Esses campos sempre dependem da planilha, mesmo quando a consulta funciona.

Responsável Legal (Nome/CPF/Cargo) também não vem da consulta cadastral, mas por um motivo diferente: não é um dado de registro de CNPJ nem uma escolha da empresa capturada nesta importação — sua fonte de verdade é o Cockpit (\`docs/01-cadastro-empresas.md\`, seção "3. Responsável Legal"). Na planilha, esses três campos existem apenas para que o protótipo consiga representá-los na aba Responsável Legal de uma empresa recém-importada; eles não deixam de ser, conceitualmente, dados de origem Cockpit.

## Obrigatoriedade condicional

Os campos obrigatórios são exatamente os "Campos Essenciais" do Cadastro Geral individual (\`docs/01-cadastro-empresas.md\`, seção "Dados Gerais"), restritos aos que existem na planilha — Razão social, Natureza jurídica, Regime tributário federal, Logradouro, Número, Bairro, Município, UF, Inscrição estadual, Inscrição municipal e Início de atividade (\`ImportarEmpresasData.CAMPOS_OBRIGATORIOS\`) — mais o CNPJ, sempre obrigatório à parte. "Contador Responsável" e "Status do Cliente" também são essenciais no cadastro individual, mas não fazem parte da planilha (o primeiro é um vínculo com o cadastro de Contadores, fora do escopo desta importação; o segundo é sempre definido como "Ativo" na importação) — por isso não bloqueiam a importação.

Uma linha só é considerada "pronta para importação" quando todos os campos obrigatórios estão preenchidos — não importa se vieram da consulta ou da planilha completa (fallback).

## Consulta indisponível

Se a consulta cadastral não puder ser feita, o sistema não importa uma empresa apenas com o CNPJ. É mostrada uma tela própria ("Consulta cadastral indisponível") com três ações:

- **Tentar novamente** — repete a consulta simulada.
- **Usar planilha completa** — leva para uma etapa própria ("Cadastro manual por planilha") que explica o fallback, disponibiliza o download da planilha completa e pede o envio dela; ao confirmar o envio, o sistema segue para a Validação usando somente os dados preenchidos na planilha completa, aplicando a mesma régua de campos obrigatórios do Cadastro Geral (ver "Dois modelos de planilha").
- **Voltar** — retorna para a etapa de Upload.

No protótipo, a primeira tentativa de consulta é sempre simulada como indisponível (determinístico); uma segunda tentativa ("Tentar novamente") sempre é bem-sucedida — o suficiente para demonstrar os dois caminhos sem depender de aleatoriedade.

## CNPJ inválido vs. CNPJ não localizado vs. consulta indisponível

São três problemas diferentes, com mensagens diferentes, para não confundir o usuário:

- **CNPJ em formato inválido** — a linha nem chega a ser consultada; o problema está no dado da planilha.
- **CNPJ não localizado na consulta cadastral** — o formato é válido, mas a consulta (que está funcionando) não encontrou registro para aquele número; a orientação é revisar o número na planilha.
- **Consulta cadastral indisponível** — falha do serviço de consulta como um todo, não tem relação com nenhum CNPJ específico; a orientação é tentar novamente ou usar a planilha completa.

---

# Escopo da Fase 1

## Ponto de entrada

Botão **"Importar empresas"** no cabeçalho da Listagem de Empresas (\`empresas/index.html\`), ao lado do título "Empresas". Leva para uma tela própria, \`empresas/importar.html\`, com um indicador de etapas (stepper) no topo mostrando as 8 etapas do fluxo.

## Etapa 1 — Introdução

Explica o que a importação faz, o que não faz (aviso de limite de escopo), reforça que só o CNPJ é obrigatório para iniciar a consulta cadastral e disponibiliza o download do **modelo simplificado** (arquivo \`.csv\` gerado no próprio navegador, só com a coluna CNPJ + uma linha de exemplo). A planilha completa (fallback) não é oferecida nesta etapa — só aparece se a consulta cadastral ficar indisponível (ver "Dois modelos de planilha"). Ações: Cancelar (volta para a Listagem) / Continuar.

## Etapa 2 — Upload

Área de envio de arquivo (dropzone com clique ou arrastar-e-soltar) mais um atalho "Usar planilha de exemplo" para quem não tem um arquivo em mãos. O conteúdo do arquivo escolhido não é lido — só o nome e o tamanho são exibidos; o lote de dados usado nas etapas seguintes é sempre um dos lotes mock fixos descritos em "Regras de Negócio". Ações: Voltar / Processar planilha (habilitado só após "selecionar" um arquivo).

## Etapa 3 — Processamento

Estado de carregamento simulado (~1,4s) que comunica que o sistema está lendo o arquivo e identificando os CNPJs informados, antes de partir para a consulta cadastral.

## Etapa 4 — Consulta cadastral

Estado de carregamento simulado (~1,4s) representando a consulta cadastral por CNPJ e o preenchimento automático dos dados encontrados. Ao final:

- **Consulta bem-sucedida** (a partir da 2ª tentativa) → segue automaticamente para a Validação, com os dados já combinados (consulta + planilha simplificada).
- **Consulta indisponível** (1ª tentativa) → mostra a tela de indisponibilidade descrita em "Consulta cadastral e fallback", com as ações Tentar novamente / Usar planilha completa / Voltar. "Usar planilha completa" leva a uma etapa própria de download + envio da planilha completa antes de seguir para a Validação (não é uma etapa numerada do stepper, da mesma forma que a tela de indisponibilidade — ambas ficam "dentro" da Etapa 4).

## Etapa 5 — Validação

Mostra um aviso indicando se os dados vieram da consulta cadastral ou (no fallback) diretamente da planilha completa, o resumo quantitativo (total encontrado / prontas / com inconsistência) e a lista completa das linhas processadas, com filtro (Todas / Prontas / Com inconsistência) e um atalho "Ver detalhe" em cada linha inconsistente, que abre um dialog com a lista de problemas daquela linha (CNPJ inválido, CNPJ não localizado ou campos obrigatórios ausentes, com o nome de cada campo faltante). Ações: Voltar (upload) / Continuar.

## Etapa 6 — Revisão

Repete o aviso de origem dos dados e a lista (sem filtro, todas as linhas) com um resumo textual de quantas empresas serão de fato importadas e quantas ficarão de fora. Ações: Voltar (validação) / Importar empresas.

## Confirmação

Ao clicar em "Importar empresas", abre um dialog de confirmação cujo texto muda conforme a consulta cadastral: quando bem-sucedida, informa que os dados encontrados na consulta serão usados para preencher o Cadastro Geral; no fallback, informa que os dados informados na planilha completa serão usados e que só empresas com os campos obrigatórios preenchidos poderão ser importadas. Ações: Cancelar / Confirmar importação.

## Etapa 7 — Importação

Estado de carregamento simulado (barra de progresso, ~1,5s) representando o cadastro em lote e a sincronização com o Cockpit.

## Etapa 8 — Resultado

Resumo quantitativo (importadas / não importadas), bloco "Dados sincronizados" com o diagrama Planilha → Empresas → Cockpit, uma nota indicando se os dados vieram da consulta cadastral combinada com a planilha simplificada ou diretamente da planilha completa (fallback), e um atalho que abre a aba Dados Gerais de uma das empresas importadas (ver "Integração com Cadastro de Empresas e com o Cockpit"), aviso de "Complete o cadastro das empresas" (mesmo texto de escopo repetido pela terceira vez no fluxo, agora em destaque) e, quando há linhas não importadas, uma lista delas com o motivo. Ação: Ver empresas importadas (volta para a Listagem de Empresas).

---

# Dois modelos de planilha

Existem dois arquivos \`.csv\` baixáveis, para dois cenários distintos — nunca o mesmo arquivo serve aos dois propósitos:

## Modelo simplificado (cenário principal — consulta cadastral disponível)

Oferecido na Etapa 1 ("Baixar modelo"). Contém uma única coluna:

CNPJ.

É o único dado que o usuário precisa informar para o AutoPilot iniciar a consulta cadastral de cada empresa; todos os demais campos do Cadastro Geral, quando a consulta é bem-sucedida, são preenchidos automaticamente (ver "O que a consulta cadastral devolve" e "O que a consulta cadastral não devolve").

## Planilha completa (cenário alternativo — consulta cadastral indisponível)

Oferecida somente na etapa de fallback "Cadastro manual por planilha" (acessada pela ação "Usar planilha completa" a partir da tela de consulta indisponível — ver "Consulta cadastral e fallback"). Nunca é sugerida como opção inicial. Mapeada 1:1 aos campos já existentes no Cadastro Geral (\`EmpresasData.EMPRESAS[].dadosGerais\`) e no Responsável Legal (\`responsavelLegal\`) — nenhum campo novo foi inventado:

Razão social, Nome fantasia, CNPJ, Inscrição estadual, Inscrição municipal, Logradouro, Número, Complemento, Bairro, Município, UF, CEP, Telefone, E-mail, Natureza jurídica, Regime tributário federal, Início de atividade, Responsável legal — Nome, Responsável legal — CPF, Responsável legal — Cargo.

Traz todos os campos porque, sem a consulta cadastral, a planilha completa passa a ser a única fonte dos dados — precisa conter tudo que o Cadastro Geral individual exigiria.

## Marcação de obrigatoriedade no arquivo

Nos dois modelos, o cabeçalho de cada coluna de preenchimento obrigatório recebe o sufixo \`" *"\` (ex.: \`"CNPJ *"\`, \`"Razão social *"\`), e uma linha de legenda é acrescentada ao final do arquivo: \`"* Campo de preenchimento obrigatório."\`. A obrigatoriedade marcada é sempre a mesma usada pela validação (\`ImportarEmpresasData.CAMPOS_OBRIGATORIOS\` + CNPJ) — o arquivo nunca afirma uma regra diferente da que é de fato aplicada:

- **Modelo simplificado**: CNPJ (única coluna) é marcado.
- **Planilha completa**: CNPJ, Razão social, Natureza jurídica, Regime tributário federal, Logradouro, Número, Bairro, Município, UF, Inscrição estadual, Inscrição municipal e Início de atividade são marcados; Nome fantasia, Complemento, CEP, Telefone, E-mail e os três campos de Responsável Legal ficam sem marcação (opcionais).

Campos do Cadastro Geral que **não** vêm de nenhuma planilha nem da consulta (preenchidos com um valor padrão neutro na importação): Status do cliente (sempre "Ativo"), Cliente desde (= Início de atividade), Duração do contrato ("Indeterminado"), Certificado digital ("Pendente de emissão"), Observações gerais (nota automática indicando que a empresa veio de importação em massa, com o número da linha de origem).

---

# Regras de Negócio

## Lotes de validação

O protótipo simula dois lotes fixos de 50 linhas cada, gerados de forma determinística (sem \`Math.random()\`, resultado sempre igual a cada execução):

- **Lote "com consulta"** (\`ImportarEmpresasData.gerarLinhasComConsulta\`) — usado quando a consulta cadastral é bem-sucedida. A planilha simulada é enxuta (só CNPJ + os campos que a consulta não cobre, o mesmo conjunto de dados que o modelo simplificado real pede); a maioria das linhas fica pronta só com o que a consulta devolve. Inclui 1 CNPJ com formato inválido, 1 CNPJ válido mas não localizado na consulta, 1 CNPJ duplicado contra a base semente, 3 linhas que a consulta encontra mas que ainda faltam um campo que só a planilha poderia informar (IE ou Regime Tributário) e 1 linha preenchida manualmente na íntegra mesmo com a consulta disponível — demonstrando que preencher mais campos do que o exigido continua sendo válido.
- **Lote "sem consulta"** (\`ImportarEmpresasData.gerarLinhasFallback\`) — usado quando o usuário escolhe "Usar planilha completa" e envia o arquivo na etapa de fallback. A planilha simulada já vem mais completa (comportamento esperado de quem preenche sem contar com preenchimento automático); inclui 3 CNPJs com formato inválido e 5 linhas com um campo obrigatório diferente ausente cada uma, para demonstrar motivos variados de bloqueio.

## Inconsistências simuladas

- **CNPJ em formato inválido** — não corresponde ao padrão \`00.000.000/0000-00\`; bloqueia a linha em qualquer um dos dois lotes, sem tentar consulta.
- **CNPJ não localizado na consulta cadastral** — formato válido, mas a consulta (disponível) não encontrou o registro; só ocorre no lote "com consulta".
- **CNPJ já cadastrado** — corresponde ao CNPJ de uma empresa que já existe na base semente (\`EmpresasData.EMPRESAS_BASE\`; ver "Notas de implementação do protótipo" sobre por que a comparação não inclui lotes de importações anteriores).
- **Campo obrigatório não preenchido** — qualquer um dos campos de \`ImportarEmpresasData.CAMPOS_OBRIGATORIOS\` vazio, seja porque a consulta não cobre aquele campo e a planilha simplificada também não o trouxe, seja porque o fallback depende só da planilha completa.

Qualquer outra combinação de campos é considerada válida.

## Importar não afeta o que já existe

A importação sempre adiciona empresas novas; nunca sobrescreve ou edita uma empresa que já existe (nem mesmo quando o CNPJ colide — nesse caso a linha é rejeitada, não substitui a empresa existente).

## Cada rodada de importação substitui a anterior

No protótipo, repetir o fluxo de importação substitui o lote de empresas importadas anteriormente (não acumula duplicatas a cada demonstração). Ver "Notas de implementação do protótipo".

---

# Integração com Cadastro de Empresas e com o Cockpit

A importação não cria uma tela de Cockpit nem uma listagem paralela de "empresas importadas". Ela alimenta exatamente a mesma base de dados que a Listagem de Empresas e as 6 abas de cadastro já leem — por isso, o restante do módulo Empresas continua funcionando sem nenhuma alteração de código.

Fluxo esperado:

Importar planilha

↓

Empresa nova entra na mesma base usada pela Listagem de Empresas (\`EmpresasData.EMPRESAS\`)

↓

Abrir a empresa na Listagem → aba Dados Gerais já mostra os dados importados normalmente, como qualquer outra empresa

↓

Sócios, Contadores, Atividades e Empresa Centralizadora continuam vazios até serem preenchidos/vinculados manualmente

> Nota de implementação: esse fluxo já está de pé no protótipo — a tela de resultado (Etapa 8) tem um atalho "Ver exemplo importado no Cockpit" que abre \`dados-gerais.html?empresa=<código>\` de uma das empresas recém-importadas. Não existe uma tela de Cockpit própria no protótipo; a sincronização é demonstrada reaproveitando a aba Dados Gerais existente, sem tratamento diferente para uma empresa importada. Desde o refinamento de UX de 2026-08-21 (ver \`docs/cadastro-empresas-spec.md\`), essa aba não exibe mais o rótulo fixo "Origem dos dados: Cockpit" nem o badge "Somente leitura" — a relação com o Cockpit passou a ser comunicada de forma contextual, no momento da edição (drawer "Editar" e dialog de confirmação), e não como uma indicação permanente da tela.

## Tabela de impacto por tela existente

| Tela / arquivo | Alteração de código | Efeito ao abrir uma empresa importada |
|---|---|---|
| Listagem de Empresas — \`empresas/index.html\` | Sim — novo botão "Importar empresas" no cabeçalho | A empresa aparece como uma linha normal da tabela, junto das empresas-semente; nenhuma coluna, filtro, ordenação ou paginação foi alterada. |
| Fonte de dados — \`empresas/js/data.js\` | Sim — \`EmpresasData.EMPRESAS\` passou a ser a lista-semente (\`EMPRESAS_BASE\`) somada às empresas importadas (lidas do \`localStorage\`) | Toda tela que já lia \`EmpresasData.EMPRESAS\`/\`findEmpresaByCodigo\` (Listagem e as 6 abas de detalhe) passa a "ver" as empresas importadas automaticamente — sem alteração de código nessas telas. |
| Aba Dados Gerais — \`empresas/dados-gerais.html\` | Não | Mostra os dados vindos da planilha como qualquer outra empresa, sem nenhum rótulo ou badge diferente — é assim que a sincronização com o Cockpit é demonstrada. |
| Aba Responsável Legal — \`empresas/responsavel-legal.html\` | Não | Aparece preenchida (Nome, CPF, Cargo) — a planilha inclui esses campos. |
| Aba Atividades — \`empresas/atividades.html\` | Não | **CNAE principal aparece em branco** (a planilha não tem essa coluna e o campo não tem estado vazio próprio, ao contrário de "CNAEs secundários"). Registrado como pendência abaixo. |
| Aba Quadro Societário — \`empresas/socios.html\` | Não | Mostra "Nenhum sócio vinculado a esta empresa ainda." — e já é possível vincular um sócio existente normalmente por essa aba, sem ajuste algum. |
| Aba Contadores — \`empresas/contadores.html\` | Não | Mostra "Nenhum contador vinculado a esta empresa ainda." — vínculo manual já funcional pela aba. |
| Aba Empresa Centralizadora — \`empresas/centralizadora.html\` | Não | Empresa importada não tem entrada em \`CENTRALIZACAO_INICIAL\`; o fallback que já existia (\`getCentralizacao()\` devolve "não se aplica" para código desconhecido) cobre o caso — aparece isolada, classificada "Não se aplica". |
| Cabeçalho do cadastro — \`empresas/js/detail-common.js\` | Não | \`modulosHabilitados: []\` para toda empresa importada → cabeçalho mostra "Nenhum módulo habilitado.", mesmo estado vazio que já existia. |
| Ícones compartilhados — \`shared/js/icons.js\` | Sim — 4 ícones novos (\`upload\`, \`download\`, \`file-text\`, \`circle-x\`) | Ficam disponíveis para qualquer tela do protótipo via \`Icon(...)\`. |
| Componentes compartilhados — \`shared/css/components.css\` | Sim — 6 componentes novos, exclusivos do protótipo (stepper, upload-dropzone, spinner, progress-bar, stat-card, flow-diagram) | Não alteram nenhum componente existente; ficam disponíveis para outra trilha do protótipo que precise de um fluxo em etapas. |
| Ferramenta "Restaurar dados do protótipo" (FAB) — \`shared/js/fab-tools.js\` | Não | A chave de persistência das empresas importadas já segue o prefixo \`autopilot_prototype_\`, então é apagada automaticamente por essa ferramenta existente, sem qualquer ajuste nela. |

---

# Responsabilidades

## Importação Massiva de Empresas

Responsável por:

- ler (de forma simulada) a planilha e gerar o lote de linhas processadas;
- consultar (de forma simulada) os dados cadastrais por CNPJ e combiná-los com os dados da planilha simplificada, ou usar somente a planilha completa quando a consulta estiver indisponível;
- validar cada linha (CNPJ, campos obrigatórios do Cadastro Geral, duplicidade contra a base semente);
- converter as linhas válidas para o mesmo formato de empresa usado pela Listagem/Cadastro;
- persistir o lote importado.

Não gerencia Sócios, Contadores, Atividades nem Empresa Centralizadora — apenas os campos equivalentes a Dados Gerais e Responsável Legal.

## Cadastro de Empresas (Listagem + abas)

Responsável por:

- exibir toda empresa (semente ou importada) de forma idêntica;
- continuar sendo o único lugar onde se completa manualmente o que a importação não cobre (Sócios, Contadores, Atividades, Empresa Centralizadora, Módulos).

---

# Fora do Escopo da Fase 1

- Upload e parsing real de arquivo \`.xlsx\`/\`.csv\` — o conteúdo do arquivo escolhido pelo usuário não é lido.
- Integração real com a Receita Federal ou qualquer fonte oficial de consulta de CNPJ — a consulta cadastral é inteiramente mockada (ver "Consulta cadastral e fallback"), mas a experiência já está desenhada para uma futura integração real usar o mesmo ponto de entrada.
- Edição dos dados pendentes/não encontrados após a importação — a orientação é redirecionar para **Empresas → Cadastro da empresa**; a tela de edição em si não faz parte desta entrega.
- Importação de Sócios, Contadores, Atividades (CNAE) ou Empresa Centralizadora.
- Edição em lote de empresas já cadastradas — a importação só cria empresas novas.
- Qualquer integração real com o Cockpit — a sincronização é demonstrada reaproveitando a aba Dados Gerais existente (ver "Integração com Cadastro de Empresas e com o Cockpit"), sem chamada a um serviço externo.
- Definir qual usuário fez a importação, log/histórico de importações, ou desfazer uma importação já confirmada (além de repetir o fluxo, que substitui o lote anterior — ver "Notas de implementação do protótipo").

---

# Evoluções Futuras

- Preencher CNAE a partir da consulta cadastral (resolveria a pendência do campo "CNAE principal" em branco na aba Atividades) — a consulta mock já devolveria esse dado numa integração real, mas o mapeamento não foi feito nesta entrega para não tocar em Atividades.
- Permitir importar/atualizar Sócios e Contadores no mesmo fluxo (hoje seguem exclusivamente manuais).
- Integração real com a Receita Federal (ou fonte equivalente) no lugar da consulta cadastral mockada.
- Tela de complementação para editar, dentro do próprio fluxo de importação, os dados pendentes de uma empresa importada (hoje a orientação é acessar Empresas → Cadastro da empresa).
- Processamento real de arquivo (\`.xlsx\`/\`.csv\`) e validações de negócio adicionais (ex.: CNPJ com dígito verificador real, IE por UF).
- Histórico de importações (quem importou, quando, quantas linhas, possibilidade de reverter).

---

# Princípios de UX

- A limitação de escopo ("só o Cadastro Geral") é comunicada em pelo menos três momentos do fluxo: na Introdução, na Confirmação e no Resultado — nunca escondida em texto secundário.
- A mensagem central ("você só precisa informar os CNPJs; o restante é preenchido automaticamente quando possível") aparece já na Introdução, reforçada pelo próprio modelo simplificado só ter a coluna de CNPJ — o usuário nunca vê uma planilha extensa "por precaução" antes de saber que o preenchimento manual só é necessário se a consulta falhar.
- Nenhuma etapa é uma troca instantânea de tela — Processamento, Consulta cadastral e Importação sempre mostram um estado de carregamento com contexto (nunca uma tela em branco com só um spinner).
- A origem dos dados (consulta cadastral ou planilha) é sempre comunicada de forma visível na Validação, na Revisão e no Resultado — nunca fica implícita.
- A tabela de validação/revisão nunca deixa implícito quais empresas serão importadas — todo registro tem um status visível (badge de "Pronta para importação" ou "Com inconsistência") e, quando inconsistente, o motivo está a um clique de distância ("Ver detalhe"), com mensagens diferentes para CNPJ inválido, CNPJ não localizado e campo obrigatório ausente.

---

# Decisões Arquiteturais

## Reaproveitar a aba Dados Gerais em vez de criar uma tela de Cockpit

Como não existe uma tela de Cockpit no protótipo, decidiu-se demonstrar a sincronização apontando para a aba Dados Gerais já existente em vez de construir uma representação nova do Cockpit só para esta funcionalidade — evita duplicar linguagem visual e mantém a Listagem/Cadastro como única fonte de verdade também no protótipo. Essa aba não tem mais um rótulo fixo de "origem Cockpit" (removido no refinamento de UX de 2026-08-21) — a relação com o Cockpit é comunicada apenas no contexto da edição, não como uma característica permanente da tela.

## Persistência por \`localStorage\`, substituindo o lote a cada rodada

Segue o mesmo padrão de Sócios/Contadores (\`localStorage\` namespado com prefixo \`autopilot_prototype_\`), mas com uma diferença deliberada: cada confirmação de importação **substitui** o lote anteriormente importado (em vez de somar). Decisão tomada para a demonstração do protótipo ser sempre repetível (evita acumular dezenas de "IMP-000N" duplicados a cada vez que alguém percorre o fluxo).

## Duplicidade de CNPJ comparada só contra a base semente

A checagem de "CNPJ já cadastrado" compara a planilha contra \`EmpresasData.EMPRESAS_BASE\` (a lista-semente), não contra empresas de importações anteriores. Combinado com a decisão anterior (cada rodada substitui a anterior), isso evita que a segunda execução do fluxo, no mesmo protótipo, marque como "duplicadas" as próprias empresas que a rodada anterior importou.

## Confirmação como dialog modal

Mantido o mesmo padrão já usado em confirmações de outras telas do módulo (ex.: "desvincular sócio/contador", "restaurar dados do protótipo") — um dialog modal, não uma etapa própria do fluxo.

---

# Notas de implementação do protótipo

Decisões tomadas durante a construção do protótipo navegável que não estavam explícitas no pedido original, ou que o antecipam. Registradas aqui para manter este documento como fonte de verdade — se alguma delas for revista, atualize este documento junto com o protótipo.

## Responsável Legal foi incluído na planilha, mas o Cockpit continua sendo a fonte de verdade

O pedido original definia o escopo como "somente os dados do Cadastro Geral", sem detalhar se isso incluía a aba Responsável Legal. Decidiu-se incluir Nome/CPF/Cargo do responsável legal na planilha — é dado que normalmente se conhece no momento do cadastro de uma empresa, junto com razão social/CNPJ/endereço. Isso significa que, ao contrário de Sócios, Contadores, Atividades e Empresa Centralizadora, a aba **Responsável Legal** de uma empresa importada não fica vazia.

Essa decisão é sobre a **experiência de importação do protótipo**, não sobre a fonte de verdade do dado: por \`docs/01-cadastro-empresas.md\` (seção "3. Responsável Legal"), a aba Responsável Legal é somente leitura e tem o Cockpit como origem oficial, inclusive para empresas importadas. A planilha (e, num sistema real, a consulta cadastral) apenas fornece um valor para popular essa aba dentro do protótipo — não representa uma mudança de onde esse dado "mora" de fato. Por isso Responsável Legal só existe na planilha completa (fallback) e não é exigido por \`CAMPOS_OBRIGATORIOS\` — se essa leitura for revista, ajuste \`PLANILHA_COLUNAS\` e \`converterParaEmpresa\` em \`empresas/js/importar-data.js\`.

## Campo "CNAE principal" fica em branco para empresa importada

Consequência direta de Atividades não fazer parte do escopo: \`atividades.cnaePrincipal\` é gravado como string vazia. A aba Atividades (\`empresas/js/atividades.js\`) já tem um estado vazio dedicado para "CNAEs secundários" ("Nenhum CNAE secundário cadastrado."), mas não tem um equivalente para "CNAE principal" — o campo aparece só com o rótulo, sem valor nem texto de estado vazio. É uma pendência visual pré-existente da aba Atividades, exposta por esta funcionalidade, e não um problema desta funcionalidade em si. Corrigir exigiria alterar \`atividades.js\` (fora do escopo desta entrega).

## Nenhuma alteração no cadastro individual ou nas demais abas

Todos os arquivos das 6 abas de detalhe (\`dados-gerais.js\`, \`atividades.js\`, \`responsavel-legal.js\`, \`socios.js\`, \`contadores.js\`, \`centralizadora.js\`) e o cabeçalho compartilhado (\`detail-common.js\`) permanecem exatamente como estavam. O efeito descrito na "Tabela de impacto por tela existente" acontece só porque essas telas já liam \`EmpresasData.EMPRESAS\` de forma genérica — bastou empresas novas entrarem nessa lista.

## Mock da planilha e da consulta são determinísticos, não aleatórios

Os dois lotes de 50 linhas (\`ImportarEmpresasData.gerarLinhasComConsulta()\` e \`gerarLinhasFallback()\`, em \`empresas/js/importar-data.js\`) são gerados por fórmula fixa a partir do índice da linha — não há \`Math.random()\`. No lote "com consulta", os índices reservados para os cenários de inconsistência são sempre os mesmos (12 = CNPJ inválido, 27 = CNPJ não localizado, 33 = CNPJ duplicado, 7/20/38 = precisam de complementação, 41 = preenchido manualmente). No lote "sem consulta", os índices 5/19/44 são sempre CNPJ inválido e os índices 3/15/26/34/47 sempre têm um campo obrigatório diferente ausente. A indisponibilidade da consulta cadastral também é determinística: a 1ª tentativa de cada rodada é sempre "indisponível" e a 2ª sempre é bem-sucedida. Isso torna o fluxo repetível para demonstração, ao custo de nunca variar o cenário entre uma execução e outra.

## Indisponibilidade da consulta é sempre a mesma nos dois primeiros cliques

Diferente de um serviço real (que falharia de forma imprevisível), a Etapa 4 sempre mostra "indisponível" na primeira tentativa e sempre funciona na segunda ("Tentar novamente"). A alternativa seria adicionar um controle de demonstração (ex.: selecionar o cenário manualmente) só para alternar esse estado — decidiu-se não fazer isso para não adicionar UI que não existiria em produção; o determinismo já garante que ambos os caminhos (retomar a consulta / continuar sem ela) sejam sempre alcançáveis a partir da tela de indisponibilidade.

## Os dois modelos de planilha são CSVs gerados no navegador

Nem "Baixar modelo" (Etapa 1, modelo simplificado) nem "Baixar planilha completa" (etapa de fallback) baixam um arquivo \`.xlsx\` real — cada um gera um \`.csv\` (cabeçalho + uma linha de exemplo + linha de legenda de obrigatoriedade) via \`Blob\`/\`URL.createObjectURL\` no próprio navegador, a partir de \`ImportarEmpresasData.gerarModeloSimplificadoCsv()\` e \`gerarModeloCompletoCsv()\` respectivamente. Suficiente para demonstrar o formato esperado (inclusive quais colunas são obrigatórias) sem depender de uma biblioteca de planilhas.

## Upload não lê o conteúdo do arquivo

Os dois componentes de upload do fluxo — o da Etapa 2 (planilha simplificada) e o da etapa de fallback "Cadastro manual por planilha" (planilha completa) — aceitam um arquivo real (clique ou arrastar-e-soltar) e exibem nome/tamanho reais, mas o conteúdo nunca é processado — o lote usado na Validação é sempre um dos mocks fixos descritos acima (\`gerarLinhasComConsulta()\` ou \`gerarLinhasFallback()\`, conforme o caminho seguido). Do ponto de vista do usuário, a interação de selecionar um arquivo é real; o resultado é sempre simulado. Os dois uploads mantêm estado independente (arquivo escolhido em um não interfere no outro).

## Navegação: página própria, fora da navegação por abas do cadastro

Diferente das 6 abas de uma empresa (que são páginas HTML separadas, mas conceitualmente "uma aba do mesmo cadastro"), a Importação Massiva vive em uma página própria (\`empresas/importar.html\`), acessada a partir da Listagem, não de dentro do cadastro de uma empresa específica — faz sentido, já que o resultado da importação são várias empresas novas, não a edição de uma já aberta.
`,
  },
};
