# Implantação Autopilot — Protótipo

Protótipo navegável (HTML/CSS/JS estático, sem build) da **Implantação** do Cockpit AutoPilot:

- **Console geral:** uma linha por empresa, com as frentes DP, Fiscal e Contábil inline.
- **Console da empresa:** abas por frente no topo. DP (colaboradores, histórico de folha, rubricas, cálculo em paralelo, parâmetros, relatórios, histórico) e Fiscal (saldos de CPP para o Fator R, CTB-534). Contábil em breve.
- **Chassi do Cockpit** (novo-chassi-v1, sem o BSamurai): topbar com busca global e menu do usuário, gaveta da direita que empurra o conteúdo, sino de atividades e modal "Pra onde você iria".

Visual no design system BSystem 2.0, tema Cockpit (`prototype/shared/css/tokens.css`). Detalhes em `prototype/README.md`.

Todos os dados são fictícios; servem só para validação de experiência.

## Rodar localmente

```bash
python .claude/serve-prototype.py
```

Abre em `http://localhost:8000`. Ponto de entrada: `prototype/index.html`, que abre a Implantação.
