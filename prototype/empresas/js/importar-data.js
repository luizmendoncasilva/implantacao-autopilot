/*
  Mock da Importação Massiva de Empresas (Fase 1) — simula a leitura de uma
  planilha com os mesmos campos do Cadastro Geral (aba "Dados gerais", ver
  empresas/js/data.js e empresas/js/dados-gerais.js), agora combinada com uma
  consulta cadastral por CNPJ mockada. Gera sempre os mesmos lotes (um para o
  caminho "com consulta" e outro para o caminho "sem consulta") para a
  demonstração do fluxo ser reproduzível — nada aqui lê um arquivo real do
  usuário nem chama um serviço real.
*/
(function (global) {
  // Colunas do "modelo de planilha" — espelham 1:1 os campos de
  // EmpresasData.EMPRESAS[].dadosGerais + responsavelLegal, sem inventar
  // campos novos (ver docs/cadastro-empresas-spec.md, seção "Dados Gerais").
  // A planilha continua trazendo TODOS esses campos — a obrigatoriedade de
  // preenchimento manual é que passa a ser condicional (ver CAMPOS_OBRIGATORIOS
  // e CAMPOS_VIA_CONSULTA abaixo).
  const PLANILHA_COLUNAS = [
    { key: "razaoSocial", label: "Razão social" },
    { key: "nomeFantasia", label: "Nome fantasia" },
    { key: "cnpj", label: "CNPJ" },
    { key: "ie", label: "Inscrição estadual" },
    { key: "im", label: "Inscrição municipal" },
    { key: "logradouro", label: "Logradouro" },
    { key: "numero", label: "Número" },
    { key: "complemento", label: "Complemento" },
    { key: "bairro", label: "Bairro" },
    { key: "municipio", label: "Município" },
    { key: "uf", label: "UF" },
    { key: "cep", label: "CEP" },
    { key: "telefone", label: "Telefone" },
    { key: "email", label: "E-mail" },
    { key: "naturezaJuridica", label: "Natureza jurídica" },
    { key: "regimeTributarioFederal", label: "Regime tributário federal" },
    { key: "inicioAtividade", label: "Início de atividade" },
    { key: "responsavelNome", label: "Responsável legal — Nome" },
    { key: "responsavelCpf", label: "Responsável legal — CPF" },
    { key: "responsavelCargo", label: "Responsável legal — Cargo" },
  ];

  // Campos que a consulta cadastral (Receita/mock) devolve quando o CNPJ é
  // localizado. Por serem dados públicos de registro, cobrem identificação e
  // endereço — não cobrem IE/IM (registros estaduais/municipais), Regime
  // tributário (escolha da empresa) nem Responsável legal, que por isso
  // continuam dependendo da planilha mesmo quando a consulta funciona.
  const CAMPOS_VIA_CONSULTA = ["razaoSocial", "nomeFantasia", "naturezaJuridica", "logradouro", "numero", "complemento", "bairro", "municipio", "uf", "cep", "telefone", "email", "inicioAtividade"];

  // Campos essenciais do Cadastro Geral — mesma fonte de verdade usada pela
  // implementação individual (ver docs/01-cadastro-empresas.md, "Campos
  // Essenciais"). CNPJ é validado à parte (é sempre obrigatório, com regra
  // própria de formato/duplicidade). "Contador Responsável" e "Status do
  // Cliente" também são essenciais no cadastro individual, mas não fazem
  // parte do escopo desta planilha (o primeiro é um vínculo com o cadastro
  // de Contadores; o segundo é sempre definido como "Ativo" na importação) —
  // por isso não são exigidos aqui.
  const CAMPOS_OBRIGATORIOS = [
    { key: "razaoSocial", label: "Razão social" },
    { key: "naturezaJuridica", label: "Natureza jurídica" },
    { key: "regimeTributarioFederal", label: "Regime tributário federal" },
    { key: "logradouro", label: "Logradouro" },
    { key: "numero", label: "Número" },
    { key: "bairro", label: "Bairro" },
    { key: "municipio", label: "Município" },
    { key: "uf", label: "UF" },
    { key: "ie", label: "Inscrição estadual" },
    { key: "im", label: "Inscrição municipal" },
    { key: "inicioAtividade", label: "Início de atividade" },
  ];

  // Modelo simplificado (Cenário principal — consulta cadastral disponível):
  // traz somente o CNPJ. É a única informação que o usuário precisa fornecer
  // para o AutoPilot iniciar a consulta cadastral; os demais campos do
  // Cadastro Geral são preenchidos automaticamente quando a consulta cobrir
  // o dado (ver CAMPOS_VIA_CONSULTA acima) e só entram na planilha completa
  // (fallback) quando a consulta estiver indisponível.
  const PLANILHA_COLUNAS_SIMPLIFICADA = [{ key: "cnpj", label: "CNPJ" }];

  const CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

  const RAMOS = ["Comércio", "Serviços", "Indústria", "Distribuidora", "Transportes", "Confecções", "Papelaria", "Farmácia", "Restaurante", "Construtora", "Auto Peças", "Consultoria", "Gráfica", "Móveis", "Informática", "Cosméticos", "Materiais Elétricos", "Alimentos", "Bebidas", "Calçados", "Livraria", "Vidraçaria", "Serralheria", "Pet Shop", "Ótica"];
  const SUFIXOS = ["Nacional", "Central", "Popular", "Moderna", "Prime", "União", "Estrela", "Horizonte", "Progresso", "Aliança"];
  const LOCAIS = [
    { municipio: "Goiânia", uf: "GO", bairro: "Setor Bueno", logradouro: "Rua T-40" },
    { municipio: "Anápolis", uf: "GO", bairro: "Jundiaí", logradouro: "Av. Brasil Norte" },
    { municipio: "Trindade", uf: "GO", bairro: "Centro", logradouro: "Rua Padre Wendel" },
    { municipio: "Aparecida de Goiânia", uf: "GO", bairro: "Jardim Novo Mundo", logradouro: "Av. Independência" },
    { municipio: "Senador Canedo", uf: "GO", bairro: "Distrito Agroindustrial", logradouro: "Rod. BR-060" },
  ];
  const REGIMES = ["Simples Nacional", "Lucro Presumido", "Lucro Real"];
  const RESPONSAVEIS = [
    { nome: "Bruno Cardoso Teixeira", cpf: "111.222.333-44" },
    { nome: "Camila Ferreira Duarte", cpf: "222.333.444-55" },
    { nome: "Diego Martins Salgado", cpf: "333.444.555-66" },
    { nome: "Fabiana Rezende Costa", cpf: "444.555.666-77" },
    { nome: "Gustavo Henrique Barros", cpf: "555.666.777-88" },
    { nome: "Larissa Nunes Pimentel", cpf: "666.777.888-99" },
    { nome: "Rodrigo Alves Siqueira", cpf: "777.888.999-00" },
  ];

  function pad2(n) {
    return String(n).padStart(2, "0");
  }
  function formatCnpj(indice) {
    const digitos8 = String(20000001 + indice * 137).slice(0, 8).padStart(8, "0");
    const dv = pad2(((indice * 7 + 11) % 90) + 10);
    return digitos8.slice(0, 2) + "." + digitos8.slice(2, 5) + "." + digitos8.slice(5, 8) + "/0001-" + dv;
  }
  function slug(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "");
  }

  // Dados "completos" de uma empresa (índice → registro determinístico) —
  // representa o que existiria de fato para aquele CNPJ, seja ele obtido via
  // consulta cadastral, preenchido na planilha, ou os dois.
  function gerarDadosCompletos(indice) {
    const ramo = RAMOS[indice % RAMOS.length];
    const sufixo = SUFIXOS[(indice + 3) % SUFIXOS.length];
    const local = LOCAIS[indice % LOCAIS.length];
    const resp = RESPONSAVEIS[indice % RESPONSAVEIS.length];
    const nomeFantasia = ramo + " " + sufixo;
    const dominio = slug(nomeFantasia) + ".com.br";

    return {
      razaoSocial: nomeFantasia + " Ltda",
      nomeFantasia: nomeFantasia,
      cnpj: formatCnpj(indice),
      ie: "10." + String(300000 + indice * 11).slice(0, 6) + "-" + (indice % 10),
      im: String(100000 + indice * 23).slice(0, 6) + "-" + (indice % 10),
      logradouro: local.logradouro,
      numero: String(50 + indice * 3),
      complemento: indice % 4 === 0 ? "Sala " + (1 + (indice % 9)) : "",
      bairro: local.bairro,
      municipio: local.municipio,
      uf: local.uf,
      cep: "74." + String(200 + indice).slice(0, 3) + "-0" + (indice % 10) + "0",
      telefone: "(62) 3" + String(200 + indice * 7).slice(0, 3) + "-" + String(1000 + indice * 13).slice(0, 4),
      email: "contato@" + dominio,
      naturezaJuridica: "206-2 — Sociedade Empresária Limitada",
      regimeTributarioFederal: REGIMES[indice % REGIMES.length],
      inicioAtividade: pad2(1 + (indice % 28)) + "/" + pad2(1 + (indice % 12)) + "/" + (2010 + (indice % 14)),
      responsavelNome: resp.nome,
      responsavelCpf: resp.cpf,
      responsavelCargo: "Sócio-administrador",
    };
  }

  function campoVazio(campos) {
    const c = {};
    PLANILHA_COLUNAS.forEach((col) => (c[col.key] = ""));
    return Object.assign(c, campos);
  }

  function validarLinha(campos) {
    const erros = [];
    if (!campos.cnpj || !CNPJ_REGEX.test(campos.cnpj)) {
      erros.push("CNPJ em formato inválido — use o padrão 00.000.000/0000-00.");
      return erros; // formato inválido impede qualquer outra validação da linha
    }
    const digitos = campos.cnpj.replace(/\D/g, "");
    const jaExiste = global.EmpresasData.EMPRESAS_BASE.some((e) => e.dadosGerais.cnpj.replace(/\D/g, "") === digitos);
    if (jaExiste) erros.push("CNPJ já cadastrado em Empresas.");

    CAMPOS_OBRIGATORIOS.forEach((c) => {
      if (!campos[c.key] || !String(campos[c.key]).trim()) {
        erros.push("Campo obrigatório não preenchido: " + c.label + ".");
      }
    });
    return erros;
  }

  // ===== Cenário 1: planilha só com CNPJ (+ campos que a consulta não cobre)
  // + consulta cadastral disponível e bem-sucedida =====
  // Índices fixos reservados para os cenários de inconsistência exigidos pela
  // especificação — os demais índices geram linhas "enxutas" que dependem da
  // consulta para ficarem prontas.
  const INDICE_CNPJ_INVALIDO = 12;
  const INDICE_CNPJ_NAO_LOCALIZADO = 27;
  const INDICE_CNPJ_DUPLICADO = 33;
  const INDICES_PRECISAM_COMPLEMENTACAO = [7, 20, 38]; // consulta encontra o CNPJ, mas falta um campo que ela não cobre
  const INDICE_PREENCHIDO_MANUALMENTE = 41; // usuário preencheu tudo na planilha mesmo com consulta disponível

  function gerarLinhasComConsulta() {
    const linhas = [];
    for (let indice = 0; indice < 50; indice++) {
      const completos = gerarDadosCompletos(indice);

      // Planilha "enxuta": só o que a consulta não cobre. CNPJ é sempre
      // preenchido (é sempre obrigatório); os campos que a consulta devolve
      // ficam em branco — o usuário não precisa digitá-los.
      let planilha = campoVazio({
        cnpj: completos.cnpj,
        ie: completos.ie,
        im: completos.im,
        regimeTributarioFederal: completos.regimeTributarioFederal,
        responsavelNome: completos.responsavelNome,
        responsavelCpf: completos.responsavelCpf,
        responsavelCargo: completos.responsavelCargo,
      });

      let cnpjConsultavel = true;
      let consultaEncontrou = true;

      if (indice === INDICE_CNPJ_INVALIDO) {
        planilha.cnpj = "11.222.333/0001-4"; // formato inválido — nem chega a ser consultado
        cnpjConsultavel = false;
      } else if (indice === INDICE_CNPJ_NAO_LOCALIZADO) {
        consultaEncontrou = false; // CNPJ com formato válido, mas não encontrado na consulta
      } else if (indice === INDICE_CNPJ_DUPLICADO) {
        planilha.cnpj = global.EmpresasData.EMPRESAS_BASE[0].dadosGerais.cnpj; // já cadastrado (Padaria Aurora)
      } else if (INDICES_PRECISAM_COMPLEMENTACAO.includes(indice)) {
        // consulta encontra e preenche os dados de registro, mas um campo
        // que só a planilha poderia informar ficou vazio
        if (indice % 2 === 0) planilha.regimeTributarioFederal = "";
        else planilha.ie = "";
      } else if (indice === INDICE_PREENCHIDO_MANUALMENTE) {
        CAMPOS_VIA_CONSULTA.forEach((k) => (planilha[k] = completos[k])); // preencheu tudo mesmo assim
      }

      const campos = Object.assign({}, planilha);
      const erros = [];
      let motivo = null;

      if (!cnpjConsultavel) {
        motivo = "cnpj_invalido";
      } else if (!consultaEncontrou) {
        erros.push("CNPJ não localizado na consulta cadastral. Verifique o número informado na planilha.");
        motivo = "cnpj_nao_localizado";
      } else {
        CAMPOS_VIA_CONSULTA.forEach((k) => {
          campos[k] = completos[k];
        });
      }

      erros.push(...validarLinha(campos));
      if (!motivo && erros.length) motivo = "campo_obrigatorio";

      linhas.push({
        linha: indice + 2, // linha 1 da planilha = cabeçalho
        campos: campos,
        planilhaOriginal: planilha,
        consultaUtilizada: cnpjConsultavel && consultaEncontrou,
        erros: erros,
        motivo: motivo,
        status: erros.length ? "invalida" : "valida",
      });
    }
    return linhas;
  }

  // ===== Cenário 2: consulta cadastral indisponível → planilha precisa
  // trazer os campos obrigatórios do Cadastro Geral (mesma regra do cadastro
  // individual) =====
  const INDICES_CNPJ_INVALIDO_FALLBACK = [5, 19, 44];
  // cada índice abaixo tem um campo obrigatório diferente ausente na planilha,
  // para demonstrar motivos variados de bloqueio
  const CAMPOS_AUSENTES_FALLBACK = { 3: "naturezaJuridica", 15: "regimeTributarioFederal", 26: "bairro", 34: "ie", 47: "im" };

  function gerarLinhasFallback() {
    const linhas = [];
    for (let indice = 0; indice < 50; indice++) {
      const completos = gerarDadosCompletos(indice);
      const planilha = campoVazio(completos);

      if (INDICES_CNPJ_INVALIDO_FALLBACK.includes(indice)) {
        planilha.cnpj = "11.222.333/0001-4";
      }
      const campoAusente = CAMPOS_AUSENTES_FALLBACK[indice];
      if (campoAusente) planilha[campoAusente] = "";

      const erros = validarLinha(planilha);
      let motivo = null;
      if (erros.length) motivo = INDICES_CNPJ_INVALIDO_FALLBACK.includes(indice) ? "cnpj_invalido" : "campo_obrigatorio";

      linhas.push({
        linha: indice + 2,
        campos: planilha,
        planilhaOriginal: planilha,
        consultaUtilizada: false,
        erros: erros,
        motivo: motivo,
        status: erros.length ? "invalida" : "valida",
      });
    }
    return linhas;
  }

  // Empresa (linha da planilha) → mesmo shape de EmpresasData.EMPRESAS[]. O
  // código gerado (IMP-00xx) evita colidir com os códigos das empresas-semente
  // (ex.: PA-0011, MS-0027) — ordem de chegada define o número sequencial.
  function converterParaEmpresa(linha, ordem) {
    const c = linha.campos;
    const codigo = "IMP-" + String(ordem).padStart(4, "0");
    return {
      nome: c.nomeFantasia,
      codigo: codigo,
      resp: c.responsavelNome,
      optanteSimples: c.regimeTributarioFederal === "Simples Nacional",
      dadosGerais: {
        razaoSocial: c.razaoSocial, nomeFantasia: c.nomeFantasia, tipoInscricao: "CNPJ",
        cnpj: c.cnpj, ie: c.ie, im: c.im,
        logradouro: c.logradouro, numero: c.numero, complemento: c.complemento, bairro: c.bairro,
        municipio: c.municipio, uf: c.uf, cep: c.cep,
        telefone: c.telefone, email: c.email,
        naturezaJuridica: c.naturezaJuridica, regimeTributarioFederal: c.regimeTributarioFederal,
        inicioAtividade: c.inicioAtividade, statusCliente: "ativo", clienteDesde: c.inicioAtividade, dataInativacao: null,
        duracaoContrato: "Indeterminado", certificadoDigital: "Pendente de emissão",
        observacoesGerais: "Empresa cadastrada via Importação massiva de empresas — planilha, linha " + linha.linha + ".",
      },
      atividades: { cnaePrincipal: "", cnaeSecundarios: [] },
      responsavelLegal: { nome: c.responsavelNome, cpf: c.responsavelCpf, cargo: c.responsavelCargo },
      modulosHabilitados: [],
    };
  }

  // Um campo é obrigatório no modelo de planilha se for o CNPJ (sempre
  // obrigatório, validado à parte) ou estiver em CAMPOS_OBRIGATORIOS — mesma
  // régua usada por validarLinha, para o arquivo baixado não afirmar uma
  // obrigatoriedade diferente da que a validação realmente aplica.
  const LEGENDA_OBRIGATORIEDADE = "* Campo de preenchimento obrigatório.";
  function campoObrigatorio(key) {
    return key === "cnpj" || CAMPOS_OBRIGATORIOS.some((c) => c.key === key);
  }
  function rotuloComMarcador(col) {
    return col.label + (campoObrigatorio(col.key) ? " *" : "");
  }
  function montarCsv(colunas, exemplo) {
    const cabecalho = colunas.map((c) => rotuloComMarcador(c)).join(";");
    const linhaExemplo = colunas.map((c) => exemplo[c.key] || "").join(";");
    return cabecalho + "\n" + linhaExemplo + "\n\n" + LEGENDA_OBRIGATORIEDADE + "\n";
  }

  // Modelo simplificado (Cenário principal) — só a coluna de CNPJ, marcada
  // como obrigatória. É o modelo oferecido em primeiro lugar na Etapa 1.
  function gerarModeloSimplificadoCsv() {
    return montarCsv(PLANILHA_COLUNAS_SIMPLIFICADA, gerarDadosCompletos(0));
  }

  // Modelo completo (Cenário alternativo — consulta cadastral indisponível)
  // — cabeçalho com todos os campos do Cadastro Geral + uma linha de exemplo
  // já preenchida, para o usuário preencher manualmente sem depender da
  // consulta. Os campos essenciais do Cadastro Geral (CAMPOS_OBRIGATORIOS)
  // aparecem marcados com "*". Só é oferecido como fallback, nunca como
  // opção inicial.
  function gerarModeloCompletoCsv() {
    return montarCsv(PLANILHA_COLUNAS, gerarDadosCompletos(0));
  }

  global.ImportarEmpresasData = {
    PLANILHA_COLUNAS,
    PLANILHA_COLUNAS_SIMPLIFICADA,
    CAMPOS_OBRIGATORIOS,
    CAMPOS_VIA_CONSULTA,
    gerarLinhasComConsulta,
    gerarLinhasFallback,
    converterParaEmpresa,
    gerarModeloSimplificadoCsv,
    gerarModeloCompletoCsv,
  };
})(window);
