/*
  Dados mock da trilha Empresas — portados verbatim de
  src/features/empresas/mocks/empresasMocks.js e config/empresasConfig.js.
  Fictícios, só para validação de UX (mesmo aviso do banner "Protótipo").
*/
(function (global) {
  const EMPRESAS_BASE = [
    {
      nome: "Padaria Aurora", codigo: "PA-0011", resp: "Elizandra Souza", optanteSimples: true,
      dadosGerais: {
        razaoSocial: "Padaria Aurora Ltda", nomeFantasia: "Padaria Aurora", tipoInscricao: "CNPJ",
        cnpj: "12.345.678/0001-90", ie: "10.111.222-3", im: "123456-7",
        logradouro: "Rua das Flores", numero: "120", complemento: "", bairro: "Setor Bueno",
        municipio: "Goiânia", uf: "GO", cep: "74.223-000",
        telefone: "(62) 3210-4455", email: "contato@padariaaurora.com.br",
        naturezaJuridica: "206-2 — Sociedade Empresária Limitada", regimeTributarioFederal: "Simples Nacional",
        inicioAtividade: "15/03/2015", statusCliente: "ativo", clienteDesde: "15/03/2015", dataInativacao: null,
        duracaoContrato: "Indeterminado", certificadoDigital: "Válido até 20/11/2026", observacoesGerais: "",
        grupoEmpresas: "",
      },
      atividades: { cnaePrincipal: "1091-1/00", cnaeSecundarios: ["4721-1/02", "5611-2/01"] },
      responsavelLegal: { nome: "Elizandra Souza", cpf: "045.812.663-70", cargo: "Sócia-administradora" },
      modulosHabilitados: ["dp", "contabil"],
    },
    {
      nome: "Metalúrgica Sigma", codigo: "MS-0027", resp: "Wender Jonathan", optanteSimples: false,
      dadosGerais: {
        razaoSocial: "Metalúrgica Sigma Ltda", nomeFantasia: "Sigma Metais", tipoInscricao: "CNPJ",
        cnpj: "06.265.226/0001-09", ie: "10.234.567-8", im: "987654-3",
        logradouro: "Av. Industrial", numero: "850", complemento: "Galpão 3", bairro: "Distrito Industrial",
        municipio: "Goiânia", uf: "GO", cep: "74.675-000",
        telefone: "(62) 3299-7788", email: "contato@sigmametais.com.br",
        naturezaJuridica: "206-2 — Sociedade Empresária Limitada", regimeTributarioFederal: "Lucro Presumido",
        inicioAtividade: "02/06/2009", statusCliente: "ativo", clienteDesde: "02/06/2009", dataInativacao: null,
        duracaoContrato: "12 meses, renovação automática", certificadoDigital: "Válido até 08/04/2027", observacoesGerais: "Empresa com filiais — aguardando definição do campo Empresa Centralizadora.",
        grupoEmpresas: "Grupo Sigma",
      },
      atividades: { cnaePrincipal: "2599-3/99", cnaeSecundarios: ["2542-0/00"] },
      responsavelLegal: { nome: "Wender Jonathan", cpf: "108.334.209-52", cargo: "Sócio-administrador" },
      modulosHabilitados: ["fiscal", "dp", "contabil"],
    },
    {
      nome: "Comércio Horizonte", codigo: "CH-0042", resp: "Andressa Lima", optanteSimples: true,
      dadosGerais: {
        razaoSocial: "Comércio Horizonte Ltda", nomeFantasia: "Horizonte", tipoInscricao: "CNPJ",
        cnpj: "22.333.444/0001-55", ie: "10.345.678-1", im: "456123-9",
        logradouro: "Rua T-30", numero: "540", complemento: "", bairro: "Setor Bueno",
        municipio: "Goiânia", uf: "GO", cep: "74.230-030",
        telefone: "(62) 3245-1122", email: "contato@horizontecomercio.com.br",
        naturezaJuridica: "206-2 — Sociedade Empresária Limitada", regimeTributarioFederal: "Simples Nacional",
        inicioAtividade: "22/09/2020", statusCliente: "inativo", clienteDesde: "22/09/2020", dataInativacao: "12/07/2026",
        duracaoContrato: "Indeterminado", certificadoDigital: "Expirado em 01/02/2026", observacoesGerais: "",
        grupoEmpresas: "",
      },
      atividades: { cnaePrincipal: "4721-1/02", cnaeSecundarios: [] },
      responsavelLegal: { nome: "Andressa Lima", cpf: "312.907.446-11", cargo: "Sócia-administradora" },
      modulosHabilitados: ["contabil"],
    },
    {
      nome: "Metalúrgica Sigma", codigo: "MS-0027-F1", resp: "Wender Jonathan", optanteSimples: false,
      dadosGerais: {
        razaoSocial: "Metalúrgica Sigma Ltda", nomeFantasia: "Sigma Metais Anápolis", tipoInscricao: "CNPJ",
        cnpj: "06.265.226/0002-80", ie: "10.234.568-6", im: "987655-1",
        logradouro: "Rod. BR-153", numero: "Km 12", complemento: "", bairro: "Distrito Agroindustrial",
        municipio: "Anápolis", uf: "GO", cep: "75.132-560",
        telefone: "(62) 3299-7790", email: "anapolis@sigmametais.com.br",
        naturezaJuridica: "206-2 — Sociedade Empresária Limitada", regimeTributarioFederal: "Lucro Presumido",
        inicioAtividade: "10/02/2018", statusCliente: "ativo", clienteDesde: "10/02/2018", dataInativacao: null,
        duracaoContrato: "12 meses, renovação automática", certificadoDigital: "Válido até 08/04/2027", observacoesGerais: "",
        grupoEmpresas: "Grupo Sigma",
      },
      atividades: { cnaePrincipal: "2599-3/99", cnaeSecundarios: [] },
      responsavelLegal: { nome: "Wender Jonathan", cpf: "108.334.209-52", cargo: "Sócio-administrador" },
      modulosHabilitados: ["fiscal", "dp", "contabil"],
    },
    {
      nome: "Metalúrgica Sigma", codigo: "MS-0027-F2", resp: "Wender Jonathan", optanteSimples: false,
      dadosGerais: {
        razaoSocial: "Metalúrgica Sigma Ltda", nomeFantasia: "Sigma Metais Trindade", tipoInscricao: "CNPJ",
        cnpj: "06.265.226/0003-61", ie: "10.234.569-4", im: "987656-0",
        logradouro: "Av. Contorno", numero: "2200", complemento: "Sala 4", bairro: "Distrito Industrial II",
        municipio: "Trindade", uf: "GO", cep: "75.380-010",
        telefone: "(62) 3299-7791", email: "trindade@sigmametais.com.br",
        naturezaJuridica: "206-2 — Sociedade Empresária Limitada", regimeTributarioFederal: "Lucro Presumido",
        inicioAtividade: "05/09/2021", statusCliente: "ativo", clienteDesde: "05/09/2021", dataInativacao: null,
        duracaoContrato: "12 meses, renovação automática", certificadoDigital: "Válido até 08/04/2027", observacoesGerais: "",
        grupoEmpresas: "Grupo Sigma",
      },
      atividades: { cnaePrincipal: "2599-3/99", cnaeSecundarios: [] },
      responsavelLegal: { nome: "Wender Jonathan", cpf: "108.334.209-52", cargo: "Sócio-administrador" },
      modulosHabilitados: ["fiscal", "dp", "contabil"],
    },
  ];

  // Catálogo de Regime Tributário Federal — domínio D01, docs/02-parametros-fiscais.md,
  // seção 14 ("Dicionário de listas suspensas"). Cadastro de Empresas é o
  // único ponto de edição deste atributo (docs/cadastro-empresas-spec.md,
  // docs/RN-RF_CadastroEmpresasAuxiliares.md); Fiscal e o futuro Contábil só
  // consomem `dadosGerais.regimeTributarioFederal`, sem manter cópia própria.
  // No escopo atual do Autopilot, somente Simples Nacional é suportado —
  // os demais regimes permanecem no catálogo (visíveis), mas desabilitados
  // para seleção, até que o produto amplie a cobertura.
  const REGIME_TRIBUTARIO_FEDERAL_OPCOES = [
    { value: "Simples Nacional", disabled: false },
    { value: "Simples Nacional — MEI", disabled: true },
    { value: "Simples Nacional — excesso de sublimite", disabled: true },
    { value: "Lucro Presumido", disabled: true },
    { value: "Lucro Real", disabled: true },
    { value: "Imune", disabled: true },
    { value: "Isenta", disabled: true },
  ];

  // Empresas trazidas pela Importação Massiva (empresas/importar.html) —
  // guardadas à parte da lista-semente acima (mesmo padrão de localStorage
  // namespaced usado por SociosData) para não misturar dados versionados no
  // código com dados criados durante a navegação. Cada rodada de importação
  // substitui o lote anterior, então repetir o fluxo no protótipo não duplica
  // empresas.
  const EMPRESAS_IMPORTADAS_KEY = "autopilot_prototype_empresas_importadas_v1";
  function getEmpresasImportadas() {
    try {
      const raw = window.localStorage.getItem(EMPRESAS_IMPORTADAS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function salvarEmpresasImportadas(lista) {
    try {
      window.localStorage.setItem(EMPRESAS_IMPORTADAS_KEY, JSON.stringify(lista));
    } catch (e) {
      /* localStorage indisponível — segue só em memória nesta renderização */
    }
  }

  const EMPRESAS = EMPRESAS_BASE.concat(getEmpresasImportadas());

  // Grupo de Empresas — agrupamento operacional (filtros/relatórios/comunicação
  // futuros), independente de matriz/filial e de Empresa Centralizadora (ver
  // docs/cadastro-empresas-spec.md, seção "Dados Gerais"). É o único campo
  // editável dentro da aba Dados Gerais, que do contrário é 100% somente
  // leitura (espelho do Cockpit) — por isso guarda a edição à parte, no mesmo
  // padrão de localStorage namespaced já usado para empresas importadas, em
  // vez de tentar gravar no mock read-only.
  const GRUPO_EMPRESAS_KEY = "autopilot_prototype_grupo_empresas_v1";
  function getGruposEmpresasSalvos() {
    try {
      const raw = window.localStorage.getItem(GRUPO_EMPRESAS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function setGrupoEmpresas(codigoEmpresa, valor) {
    const empresa = findEmpresaByCodigo(codigoEmpresa);
    const valorAnterior = empresa ? empresa.dadosGerais.grupoEmpresas || "" : "";
    if (empresa) empresa.dadosGerais.grupoEmpresas = valor;
    const salvos = getGruposEmpresasSalvos();
    salvos[codigoEmpresa] = valor;
    try {
      window.localStorage.setItem(GRUPO_EMPRESAS_KEY, JSON.stringify(salvos));
    } catch (e) {
      /* localStorage indisponível — segue só em memória nesta renderização */
    }
    if (valorAnterior !== valor) {
      registrarEventoHistorico(codigoEmpresa, [{ campo: "Grupo de empresas", de: valorAnterior, para: valor }]);
    }
  }
  // Aplica overrides salvos por cima do mock-base ao carregar a página, para
  // que o valor editado sobreviva a um F5 (mesmo princípio de persistência
  // dos outros dados nativos do AutoPilot nesta trilha).
  (function aplicarGruposEmpresasSalvos() {
    const salvos = getGruposEmpresasSalvos();
    Object.keys(salvos).forEach((codigo) => {
      const empresa = EMPRESAS.find((e) => e.codigo === codigo);
      if (empresa) empresa.dadosGerais.grupoEmpresas = salvos[codigo];
    });
  })();

  // Edição de empresa via drawer lateral no Autopilot (Dados gerais,
  // Atividades, Responsável legal) — os campos abaixo eram só espelho do
  // Cockpit; agora podem ser editados por aqui, exceto CNPJ, Certificado
  // digital, Contador responsável e Contrato, que continuam bloqueados no
  // drawer. Mesmo padrão de override em localStorage já usado por
  // setGrupoEmpresas, guardado à parte do mock-base.
  const DADOS_GERAIS_OVERRIDES_KEY = "autopilot_prototype_dados_gerais_overrides_v1";
  const ATIVIDADES_OVERRIDES_KEY = "autopilot_prototype_atividades_overrides_v1";
  const RESPONSAVEL_LEGAL_OVERRIDES_KEY = "autopilot_prototype_responsavel_legal_overrides_v1";

  function getOverrides(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function salvarOverride(key, codigoEmpresa, valores) {
    const salvos = getOverrides(key);
    salvos[codigoEmpresa] = valores;
    try {
      window.localStorage.setItem(key, JSON.stringify(salvos));
    } catch (e) {
      /* localStorage indisponível — segue só em memória nesta renderização */
    }
  }
  // Compara valores antes/depois campo a campo e devolve só o que mudou —
  // mesmo conceito de diffParticipacao em empresas/js/socios.js, usado aqui
  // para registrar o histórico de alterações de cada aba editável.
  function diffCampos(camposLabels, antes, depois) {
    return Object.keys(camposLabels)
      .map((chave) => {
        const valorAntes = antes[chave] || "";
        const valorDepois = depois[chave] || "";
        if (valorAntes === valorDepois) return null;
        return { campo: camposLabels[chave], de: valorAntes || "—", para: valorDepois || "—" };
      })
      .filter(Boolean);
  }

  const DADOS_GERAIS_CAMPOS_EDITAVEIS = {
    razaoSocial: "Razão social", nomeFantasia: "Nome fantasia", naturezaJuridica: "Natureza jurídica",
    regimeTributarioFederal: "Regime tributário federal", ie: "Inscrição estadual", im: "Inscrição municipal",
    telefone: "Telefone", email: "E-mail",
    logradouro: "Logradouro", numero: "Número", complemento: "Complemento", bairro: "Bairro",
    municipio: "Município", uf: "UF", cep: "CEP", observacoesGerais: "Observações gerais",
  };
  function setDadosGeraisEmpresa(codigoEmpresa, novosValores) {
    const empresa = findEmpresaByCodigo(codigoEmpresa);
    if (!empresa) return [];
    const anterior = {};
    Object.keys(DADOS_GERAIS_CAMPOS_EDITAVEIS).forEach((chave) => (anterior[chave] = empresa.dadosGerais[chave]));
    Object.assign(empresa.dadosGerais, novosValores);
    salvarOverride(DADOS_GERAIS_OVERRIDES_KEY, codigoEmpresa, novosValores);
    const alteracoes = diffCampos(DADOS_GERAIS_CAMPOS_EDITAVEIS, anterior, novosValores);
    if (alteracoes.length) registrarEventoHistorico(codigoEmpresa, alteracoes);
    return alteracoes;
  }

  const ATIVIDADES_CAMPOS_EDITAVEIS = { cnaePrincipal: "CNAE principal", cnaeSecundarios: "CNAEs secundários" };
  function setAtividadesEmpresa(codigoEmpresa, novosValores) {
    const empresa = findEmpresaByCodigo(codigoEmpresa);
    if (!empresa) return [];
    const anterior = {
      cnaePrincipal: empresa.atividades.cnaePrincipal,
      cnaeSecundarios: (empresa.atividades.cnaeSecundarios || []).join(", "),
    };
    const depois = {
      cnaePrincipal: novosValores.cnaePrincipal,
      cnaeSecundarios: (novosValores.cnaeSecundarios || []).join(", "),
    };
    empresa.atividades.cnaePrincipal = novosValores.cnaePrincipal;
    empresa.atividades.cnaeSecundarios = novosValores.cnaeSecundarios || [];
    salvarOverride(ATIVIDADES_OVERRIDES_KEY, codigoEmpresa, {
      cnaePrincipal: empresa.atividades.cnaePrincipal,
      cnaeSecundarios: empresa.atividades.cnaeSecundarios,
    });
    const alteracoes = diffCampos(ATIVIDADES_CAMPOS_EDITAVEIS, anterior, depois);
    if (alteracoes.length) registrarEventoHistorico(codigoEmpresa, alteracoes);
    return alteracoes;
  }

  const RESPONSAVEL_LEGAL_CAMPOS_EDITAVEIS = { nome: "Nome do responsável legal", cpf: "CPF do responsável legal", cargo: "Cargo / Qualificação" };
  function setResponsavelLegalEmpresa(codigoEmpresa, novosValores) {
    const empresa = findEmpresaByCodigo(codigoEmpresa);
    if (!empresa) return [];
    const anterior = Object.assign({}, empresa.responsavelLegal);
    empresa.responsavelLegal = Object.assign({}, empresa.responsavelLegal, novosValores);
    salvarOverride(RESPONSAVEL_LEGAL_OVERRIDES_KEY, codigoEmpresa, empresa.responsavelLegal);
    const alteracoes = diffCampos(RESPONSAVEL_LEGAL_CAMPOS_EDITAVEIS, anterior, novosValores);
    if (alteracoes.length) registrarEventoHistorico(codigoEmpresa, alteracoes);
    return alteracoes;
  }

  // Aplica overrides salvos por cima do mock-base ao carregar a página, para
  // que as edições sobrevivam a um F5 — mesmo princípio de
  // aplicarGruposEmpresasSalvos() abaixo.
  (function aplicarOverridesEdicaoEmpresa() {
    const dadosGerais = getOverrides(DADOS_GERAIS_OVERRIDES_KEY);
    const atividades = getOverrides(ATIVIDADES_OVERRIDES_KEY);
    const responsavelLegal = getOverrides(RESPONSAVEL_LEGAL_OVERRIDES_KEY);
    EMPRESAS.forEach((empresa) => {
      if (dadosGerais[empresa.codigo]) Object.assign(empresa.dadosGerais, dadosGerais[empresa.codigo]);
      if (atividades[empresa.codigo]) Object.assign(empresa.atividades, atividades[empresa.codigo]);
      if (responsavelLegal[empresa.codigo]) empresa.responsavelLegal = Object.assign({}, empresa.responsavelLegal, responsavelLegal[empresa.codigo]);
    });
  })();

  // Cadastro de sócios (pessoa + participações) mora em
  // cadastros-auxiliares/js/socios/data.js — SociosData é o registro mestre,
  // reutilizado por esta aba (ver empresas/js/socios.js) e pelo módulo
  // Cadastros Auxiliares → Sócios. Cadastro de contadores segue o mesmo
  // padrão em cadastros-auxiliares/js/contadores/data.js (ContadoresData) —
  // ver findContadorDaEmpresa abaixo.

  const CENTRALIZACAO_INICIAL = {
    "PA-0011": { tipo: "não se aplica", vinculoCodigo: null },
    "MS-0027": { tipo: "matriz", vinculoCodigo: null },
    "MS-0027-F1": { tipo: "filial", vinculoCodigo: "MS-0027" },
    "MS-0027-F2": { tipo: "filial", vinculoCodigo: "MS-0027" },
    "CH-0042": { tipo: "não se aplica", vinculoCodigo: null },
  };

  // Histórico de alterações — auditoria de quem alterou o quê no cadastro da
  // empresa, agrupada por evento de edição (uma mesma ação de salvar reúne
  // todos os campos alterados naquele momento). Dado mockado só para
  // demonstrar o comportamento da aba (empresas/js/historico.js); a estrutura
  // já prevê os campos que uma integração de auditoria real precisaria
  // preencher (data/hora, usuário, campo, valor anterior, novo valor) — ver
  // docs/cadastro-empresas-spec.md, seção "Histórico de Alterações". Cada
  // lista já vem ordenada do evento mais recente para o mais antigo.
  const HISTORICO_ALTERACOES = {
    "PA-0011": [
      {
        id: "PA-0011-ev3", data: "05/08/2026", hora: "09:14", usuario: "Wender Jonathan",
        alteracoes: [
          { campo: "Telefone", de: "(62) 3210-4400", para: "(62) 3210-4455" },
          { campo: "E-mail", de: "contato@padaria.com.br", para: "contato@padariaaurora.com.br" },
        ],
      },
      {
        id: "PA-0011-ev2", data: "02/06/2026", hora: "16:40", usuario: "Andressa Lima",
        alteracoes: [
          { campo: "Duração do contrato", de: "12 meses, renovação automática", para: "Indeterminado" },
        ],
      },
      {
        id: "PA-0011-ev1", data: "20/03/2026", hora: "11:05", usuario: "Elizandra Souza",
        alteracoes: [
          { campo: "Certificado digital", de: "Válido até 20/11/2025", para: "Válido até 20/11/2026" },
        ],
      },
    ],
    "MS-0027": [
      {
        id: "MS-0027-ev3", data: "10/08/2026", hora: "17:22", usuario: "Wender Jonathan",
        alteracoes: [
          { campo: "Regime tributário federal", de: "Simples Nacional", para: "Lucro Presumido" },
          { campo: "Observações gerais", de: "", para: "Empresa com filiais — aguardando definição do campo Empresa Centralizadora." },
        ],
      },
      {
        id: "MS-0027-ev2", data: "18/05/2026", hora: "10:03", usuario: "Fábio Nogueira",
        alteracoes: [
          { campo: "Status do cliente", de: "Inativa", para: "Ativa" },
          { campo: "Data de inativação", de: "12/07/2025", para: "—" },
        ],
      },
      {
        id: "MS-0027-ev1", data: "02/06/2009", hora: "08:30", usuario: "Cockpit (sincronização)",
        alteracoes: [{ campo: "Cadastro criado", de: "—", para: "Metalúrgica Sigma Ltda" }],
      },
    ],
  };
  // Eventos registrados a partir de edições reais feitas no protótipo —
  // "Grupo de empresas" (abaixo, nesta mesma aba) e as ações de vincular/
  // editar/desvincular sócio e contador (empresas/js/socios.js e
  // empresas/js/contadores.js, via EmpresasData.registrarEventoHistorico) —
  // guardados à parte da lista-semente acima, mesmo padrão de localStorage
  // namespaced já usado para empresas importadas e para o próprio Grupo de
  // Empresas. Consultivo apenas: não é uma trilha de auditoria real, só fecha
  // o laço visual "editei → aparece no histórico" dentro do protótipo.
  const HISTORICO_EVENTOS_KEY = "autopilot_prototype_historico_eventos_v1";
  // Usuário fixo do protótipo — mesmo usuário mockado exibido no rodapé da
  // barra lateral (ver shared/js/shell.js, sidebar-user).
  const HISTORICO_USUARIO_PROTOTIPO = "Elaine Calazans";
  function getHistoricoEventosSalvos() {
    try {
      const raw = window.localStorage.getItem(HISTORICO_EVENTOS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function pad2(n) {
    return String(n).padStart(2, "0");
  }
  function registrarEventoHistorico(codigoEmpresa, alteracoes) {
    const agora = new Date();
    const evento = {
      id: codigoEmpresa + "-user-" + agora.getTime(),
      data: pad2(agora.getDate()) + "/" + pad2(agora.getMonth() + 1) + "/" + agora.getFullYear(),
      hora: pad2(agora.getHours()) + ":" + pad2(agora.getMinutes()),
      usuario: HISTORICO_USUARIO_PROTOTIPO,
      alteracoes: alteracoes,
    };
    const salvos = getHistoricoEventosSalvos();
    const eventosDaEmpresa = salvos[codigoEmpresa] || [];
    eventosDaEmpresa.unshift(evento);
    salvos[codigoEmpresa] = eventosDaEmpresa;
    try {
      window.localStorage.setItem(HISTORICO_EVENTOS_KEY, JSON.stringify(salvos));
    } catch (e) {
      /* localStorage indisponível — segue só em memória nesta renderização */
    }
  }
  // Eventos registrados por edições reais aparecem primeiro (mais recentes),
  // seguidos pelos eventos mockados de exemplo — a lista inteira já vem
  // ordenada do mais recente para o mais antigo.
  function getHistoricoAlteracoes(codigoEmpresa) {
    const eventosUsuario = getHistoricoEventosSalvos()[codigoEmpresa] || [];
    const eventosSeed = HISTORICO_ALTERACOES[codigoEmpresa] || [];
    return eventosUsuario.concat(eventosSeed);
  }

  const TIPO_SOCIO_OPCOES = ["Administrador", "Cotista"];
  const MODULOS_DISPONIVEIS = [
    { key: "fiscal", label: "Fiscal" },
    { key: "dp", label: "DP" },
    { key: "contabil", label: "Contábil" },
  ];
  const FILIAIS_PAGE_SIZE = 6;
  const EMPRESAS_PAGE_SIZE = 25;

  const STATUS_FILTRO_OPCOES = [
    { value: "todas", label: "Todas" },
    { value: "ativo", label: "Ativas" },
    { value: "inativo", label: "Inativas" },
  ];
  const TIPO_FILTRO_OPCOES = [
    { value: "todos", label: "Todas" },
    { value: "matriz", label: "Matrizes" },
    { value: "filial", label: "Filiais" },
  ];
  const ORDENACAO_OPCOES = [
    { value: "empresa", label: "Empresa" },
    { value: "codigo", label: "Código" },
    { value: "cnpj", label: "CNPJ" },
    { value: "responsavel", label: "Contador responsável" },
  ];

  function findEmpresaByCodigo(codigo) {
    return EMPRESAS.find((e) => e.codigo === codigo);
  }
  // Lê o registro mestre de contadores (ContadoresData, mora em
  // cadastros-auxiliares/js/contadores/data.js) — toda página que chama esta
  // função precisa incluir aquele script antes deste.
  function findContadorDaEmpresa(codigoEmpresa) {
    const contadores = global.ContadoresData ? global.ContadoresData.getContadores() : [];
    return contadores.find((c) => c.empresasAtendidas.includes(codigoEmpresa));
  }

  // Contador Responsável — seleção provisória e genérica (ver docs/cadastro-
  // empresas-spec.md, pendência "Contador Responsável"). Independente do
  // vínculo plural já existente na aba Contadores (empresasAtendidas, N
  // contadores por empresa): aqui se guarda apenas QUAL contador do mesmo
  // Registro de Contadores é considerado o responsável, quando escolhido
  // explicitamente. Nenhum segundo cadastro de contador foi criado — a
  // seleção sempre lê do mesmo ContadoresData.getContadores().
  //
  // Regra definitiva de vínculo NÃO fechada pelo Produto: se a seleção deve
  // exigir vínculo prévio via aba Contadores, se pode haver mais de um
  // responsável, prioridade entre eles. Esta implementação deliberadamente
  // não assume nenhuma dessas regras — permite selecionar qualquer contador
  // do registro, sem validar vínculo prévio.
  // Vigência NÃO é mais pendência (resolvido 15/09/2026, confirmado por
  // Thais Lima de Souza): o Log de Histórico de Alterações (aba Histórico)
  // já cobre o rastreio de trocas de responsável — ver
  // docs/RN-RF_CadastroEmpresasAuxiliares.md, seção 4-A.
  const CONTADOR_RESPONSAVEL_KEY = "autopilot_prototype_contador_responsavel_v1";
  function getContadoresResponsaveisSalvos() {
    try {
      const raw = window.localStorage.getItem(CONTADOR_RESPONSAVEL_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  // Resolve o contador exibido como responsável: prioriza a seleção
  // explícita feita por esta ação; na ausência dela, cai para a derivação
  // implícita que já existia (findContadorDaEmpresa — primeiro contador do
  // registro cujo empresasAtendidas inclui a empresa), preservando o valor
  // hoje exibido para as empresas que já tinham essa relação, sem exigir uma
  // seleção manual retroativa.
  function resolveContadorResponsavel(codigoEmpresa) {
    const contadores = global.ContadoresData ? global.ContadoresData.getContadores() : [];
    const idExplicito = getContadoresResponsaveisSalvos()[codigoEmpresa];
    if (idExplicito != null) {
      const explicito = contadores.find((c) => c.id === idExplicito);
      if (explicito) return explicito;
    }
    return findContadorDaEmpresa(codigoEmpresa);
  }
  function setContadorResponsavel(codigoEmpresa, contadorId) {
    const empresa = findEmpresaByCodigo(codigoEmpresa);
    const anterior = resolveContadorResponsavel(codigoEmpresa);
    if (anterior && anterior.id === contadorId) return;
    const salvos = getContadoresResponsaveisSalvos();
    salvos[codigoEmpresa] = contadorId;
    try {
      window.localStorage.setItem(CONTADOR_RESPONSAVEL_KEY, JSON.stringify(salvos));
    } catch (e) {
      /* localStorage indisponível — segue só em memória nesta renderização */
    }
    const contadores = global.ContadoresData ? global.ContadoresData.getContadores() : [];
    const novo = contadores.find((c) => c.id === contadorId);
    if (empresa) {
      registrarEventoHistorico(codigoEmpresa, [
        {
          campo: "Contador responsável",
          de: anterior ? anterior.nome + " — " + anterior.crc : "—",
          para: novo ? novo.nome + " — " + novo.crc : "—",
        },
      ]);
    }
  }
  function formatarEndereco(dg) {
    const numeroComplemento = dg.complemento ? dg.numero + ", " + dg.complemento : dg.numero;
    return dg.logradouro + ", " + numeroComplemento + " — " + dg.bairro + " — " + dg.municipio + "/" + dg.uf + " · CEP " + dg.cep;
  }
  // Badge de status do cliente (Ativa/Inativa) — usado nas 3 telas que listam
  // ou detalham empresa (lista, dados gerais, centralizadora); antes era
  // reimplementado de forma idêntica em cada arquivo.
  function situacaoBadge(dg) {
    const ativo = dg.statusCliente === "ativo";
    return '<span class="badge ' + (ativo ? "badge-success" : "badge-outline") + '">' + (ativo ? "Ativa" : "Inativa") + "</span>";
  }
  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  // Matriz/Filial vem do Cockpit e é somente leitura no AutoPilot (ver aba
  // Empresa centralizadora) — por isso, ao contrário de Sócios, não há
  // aqui uma versão local editável em localStorage: getCentralizacao só
  // expõe a classificação inicial.
  function getCentralizacao() {
    return CENTRALIZACAO_INICIAL;
  }

  global.EmpresasData = {
    EMPRESAS,
    EMPRESAS_BASE,
    CENTRALIZACAO_INICIAL,
    REGIME_TRIBUTARIO_FEDERAL_OPCOES,
    TIPO_SOCIO_OPCOES,
    MODULOS_DISPONIVEIS,
    FILIAIS_PAGE_SIZE,
    EMPRESAS_PAGE_SIZE,
    STATUS_FILTRO_OPCOES,
    TIPO_FILTRO_OPCOES,
    ORDENACAO_OPCOES,
    findEmpresaByCodigo,
    findContadorDaEmpresa,
    resolveContadorResponsavel,
    setContadorResponsavel,
    formatarEndereco,
    situacaoBadge,
    getQueryParam,
    getCentralizacao,
    getEmpresasImportadas,
    salvarEmpresasImportadas,
    setGrupoEmpresas,
    setDadosGeraisEmpresa,
    setAtividadesEmpresa,
    setResponsavelLegalEmpresa,
    getHistoricoAlteracoes,
    registrarEventoHistorico,
  };
})(window);
