# Implantação Autopilot — Protótipo

Protótipo navegável (HTML/CSS/JS estático, sem build) da trilha de **Implantação de Empresas** do Cockpit AutoPilot — telas de DP (colaboradores, histórico de folha, rubricas, cálculo em paralelo, parâmetros), Cadastro de Empresas, Cadastros Auxiliares e o dash geral com as três frentes (DP/Fiscal/Contábil).

Versão adaptada ao design system do Cockpit (sidebar, topbar e componentes de `prototype/assets/core/`), em vez do visual original do protótipo.

Todos os dados são fictícios; servem só para validação de experiência.

## Rodar localmente

```bash
python .claude/serve-prototype.py
```

Abre em `http://localhost:8000`. Ponto de entrada: `prototype/index.html` (hub com links para todas as telas).
