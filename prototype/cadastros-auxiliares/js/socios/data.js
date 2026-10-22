/*
  Mock do Cadastro de Sócios/Resp. legal — registro mestre de pessoa física,
  consumido também pela aba Sócios/Resp. legal de Empresas (empresas/js/socios.js
  e responsavel-legal.js usam SociosData em vez de manter cópia própria).
  `tipos` diz para qual seleção a pessoa fica disponível no cadastro da empresa
  (TIPOS abaixo); `participacoes` referencia códigos reais de
  EmpresasData.EMPRESAS. O vínculo de responsável legal fica na empresa
  (empresa.responsavelLegal.pessoaId), não aqui.
*/
(function (global) {
  const TIPOS = { SOCIO: "socio", RESPONSAVEL_LEGAL: "responsavelLegal" };
  const TIPO_LABEL = { socio: "Sócio", responsavelLegal: "Resp. legal" };

  const SOCIOS_INICIAL = [
    {
      id: 1, tipos: ["socio"], nome: "Renato Zonzini Bocabello", cpf: "200.000.000-27",
      email: "renato.bocabello@sigmametais.com.br", telefone: "(62) 99101-2233",
      participacoes: [{ empresaCodigo: "MS-0027", percentual: 100, quotasIntegralizadas: 100, quotasAIntegralizar: 0, capitalIntegralizado: 100000, capitalAIntegralizar: 0, tipoSocio: "Administrador", dataEntrada: "02/06/2009", dataSaida: null }],
    },
    {
      id: 2, tipos: ["socio", "responsavelLegal"], nome: "Elizandra Souza", cpf: "310.111.222-33",
      email: "elizandra.souza@padariaaurora.com.br", telefone: "(62) 99123-4455",
      participacoes: [{ empresaCodigo: "PA-0011", percentual: 60, quotasIntegralizadas: 60, quotasAIntegralizar: 0, capitalIntegralizado: 60000, capitalAIntegralizar: 0, tipoSocio: "Administrador", dataEntrada: "15/03/2015", dataSaida: null }],
    },
    {
      id: 3, tipos: ["socio"], nome: "Marcos Vinícius Souza", cpf: "410.222.333-44",
      email: "marcos.souza@padariaaurora.com.br", telefone: "(62) 99876-5544",
      participacoes: [{ empresaCodigo: "PA-0011", percentual: 40, quotasIntegralizadas: 40, quotasAIntegralizar: 0, capitalIntegralizado: 40000, capitalAIntegralizar: 0, tipoSocio: "Cotista", dataEntrada: "15/03/2015", dataSaida: null }],
    },
    {
      id: 4, tipos: ["socio", "responsavelLegal"], nome: "Andressa Lima", cpf: "510.333.444-55",
      email: "andressa.lima@horizontecomercio.com.br", telefone: "(62) 99222-3311",
      participacoes: [{ empresaCodigo: "CH-0042", percentual: 100, quotasIntegralizadas: 100, quotasAIntegralizar: 0, capitalIntegralizado: 100000, capitalAIntegralizar: 0, tipoSocio: "Administrador", dataEntrada: "22/09/2020", dataSaida: null }],
    },
    {
      id: 5, tipos: ["socio"], nome: "Carlos Eduardo Ferraz", cpf: "620.444.555-66",
      email: "carlos.ferraz@gmail.com", telefone: "(62) 99333-2244",
      participacoes: [
        { empresaCodigo: "MS-0027-F1", percentual: 100, quotasIntegralizadas: 100, quotasAIntegralizar: 0, capitalIntegralizado: 100000, capitalAIntegralizar: 0, tipoSocio: "Administrador", dataEntrada: "10/02/2018", dataSaida: null },
        { empresaCodigo: "MS-0027-F2", percentual: 100, quotasIntegralizadas: 100, quotasAIntegralizar: 0, capitalIntegralizado: 100000, capitalAIntegralizar: 0, tipoSocio: "Administrador", dataEntrada: "10/02/2018", dataSaida: null },
        { empresaCodigo: "CH-0042", percentual: 5, quotasIntegralizadas: 4, quotasAIntegralizar: 1, capitalIntegralizado: 4000, capitalAIntegralizar: 1000, tipoSocio: "Cotista", dataEntrada: "01/02/2022", dataSaida: null },
      ],
    },
    {
      id: 6, tipos: ["socio"], nome: "Juliana Prado", cpf: "720.555.666-77",
      email: "juliana.prado@outlook.com", telefone: "",
      participacoes: [
        { empresaCodigo: "PA-0011", percentual: 5, quotasIntegralizadas: 5, quotasAIntegralizar: 0, capitalIntegralizado: 5000, capitalAIntegralizar: 0, tipoSocio: "Cotista", dataEntrada: "01/08/2019", dataSaida: null },
        { empresaCodigo: "MS-0027", percentual: 5, quotasIntegralizadas: 5, quotasAIntegralizar: 0, capitalIntegralizado: 5000, capitalAIntegralizar: 0, tipoSocio: "Cotista", dataEntrada: "01/08/2019", dataSaida: "20/05/2024" },
      ],
    },
    {
      id: 7, tipos: ["socio"], nome: "Paulo Roberto Nascimento", cpf: "830.666.777-88",
      email: "", telefone: "(62) 99555-6677",
      participacoes: [],
    },
    {
      id: 8, tipos: ["socio"], nome: "Fernanda Almeida Rocha", cpf: "940.777.888-99",
      email: "fernanda.rocha@rochaadvocacia.com.br", telefone: "(62) 99444-1122",
      participacoes: [],
    },
    {
      id: 9, tipos: ["responsavelLegal"], nome: "Wender Jonathan", cpf: "108.334.209-52",
      email: "wender.jonathan@sigmametais.com.br", telefone: "(62) 99666-7788",
      participacoes: [],
    },
  ];

  function loadStore(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallback));
    } catch (e) {
      return JSON.parse(JSON.stringify(fallback));
    }
  }
  function saveStore(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* localStorage indisponível — segue só em memória nesta renderização */
    }
  }

  // v2: inclui `tipos` e o responsável legal Wender Jonathan.
  const SOCIOS_KEY = "autopilot_prototype_socios_v2";

  function getSocios() {
    return loadStore(SOCIOS_KEY, SOCIOS_INICIAL);
  }
  function setSocios(socios) {
    saveStore(SOCIOS_KEY, socios);
  }

  function apenasDigitos(valor) {
    return (valor || "").replace(/\D/g, "");
  }
  function formatarCpfInput(valor) {
    const d = apenasDigitos(valor).slice(0, 11);
    let out = d;
    if (d.length > 9) out = d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    else if (d.length > 6) out = d.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (d.length > 3) out = d.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    return out;
  }
  function cpfJaCadastrado(cpf, ignorarId) {
    const digitos = apenasDigitos(cpf);
    return getSocios().some((s) => apenasDigitos(s.cpf) === digitos && s.id !== ignorarId);
  }

  // "Vinculada" = participação em aberto (sem data de saída) — uma
  // participação encerrada não conta mais como vínculo ativo.
  function participacoesAtivas(socio) {
    return (socio.participacoes || []).filter((p) => !p.dataSaida);
  }

  function temTipo(pessoa, tipo) {
    return (pessoa.tipos || []).includes(tipo);
  }
  // Ordem fixa (Sócio antes de Resp. legal), independente da ordem de marcação.
  function tiposLabel(pessoa) {
    return [TIPOS.SOCIO, TIPOS.RESPONSAVEL_LEGAL].filter((t) => temTipo(pessoa, t)).map((t) => TIPO_LABEL[t]).join(", ");
  }
  function findPessoa(id) {
    return getSocios().find((s) => s.id === Number(id)) || null;
  }

  // Importação Massiva: reaproveita a pessoa pelo CPF (marcando-a como
  // Resp. legal, se ainda não for) ou cria um cadastro novo só com esse tipo.
  function garantirResponsavelLegal(dados) {
    const digitos = apenasDigitos(dados.cpf);
    if (digitos.length !== 11) return null;
    const pessoas = getSocios();
    const existente = pessoas.find((s) => apenasDigitos(s.cpf) === digitos);
    if (existente) {
      if (!temTipo(existente, TIPOS.RESPONSAVEL_LEGAL)) {
        existente.tipos = (existente.tipos || []).concat([TIPOS.RESPONSAVEL_LEGAL]);
        setSocios(pessoas);
      }
      return existente.id;
    }
    const novoId = pessoas.reduce((max, s) => Math.max(max, s.id), 0) + 1;
    pessoas.push({ id: novoId, tipos: [TIPOS.RESPONSAVEL_LEGAL], nome: dados.nome || "", cpf: formatarCpfInput(digitos), email: "", telefone: "", participacoes: [] });
    setSocios(pessoas);
    return novoId;
  }

  // Toast compartilhado pela página da trilha — mesmo padrão de
  // empresas/js/detail-common.js (ensureToast), replicado aqui porque este
  // módulo não usa aquele shell de abas.
  function ensureToast() {
    if (document.getElementById("toast")) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.innerHTML =
      '<span class="toast-icon"></span>' +
      '<div class="flex flex-col gap-0-5">' +
      '<span class="toast-title"></span>' +
      '<span class="toast-desc"></span>' +
      "</div>";
    document.body.appendChild(toast);
  }

  global.SociosData = {
    SOCIOS_INICIAL,
    getSocios,
    setSocios,
    formatarCpfInput,
    cpfJaCadastrado,
    participacoesAtivas,
    TIPOS,
    TIPO_LABEL,
    temTipo,
    tiposLabel,
    findPessoa,
    garantirResponsavelLegal,
    ensureToast,
  };
})(window);
