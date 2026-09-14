/*
  Mock do Cadastro de Sócios — registro mestre de pessoa física, consumido
  também pela aba Quadro Societário de Empresas (empresas/js/socios.js inclui
  este arquivo e usa SociosData.getSocios()/setSocios() em vez de manter sua
  própria cópia). `participacoes` referencia códigos reais de EmpresasData.EMPRESAS.
*/
(function (global) {
  const SOCIOS_INICIAL = [
    {
      id: 1, nome: "Renato Zonzini Bocabello", cpf: "200.000.000-27",
      email: "renato.bocabello@sigmametais.com.br", telefone: "(62) 99101-2233",
      participacoes: [{ empresaCodigo: "MS-0027", percentual: 100, quotasIntegralizadas: 100, quotasAIntegralizar: 0, capitalIntegralizado: 100000, capitalAIntegralizar: 0, tipoSocio: "Administrador", dataEntrada: "02/06/2009", dataSaida: null }],
    },
    {
      id: 2, nome: "Elizandra Souza", cpf: "310.111.222-33",
      email: "elizandra.souza@padariaaurora.com.br", telefone: "(62) 99123-4455",
      participacoes: [{ empresaCodigo: "PA-0011", percentual: 60, quotasIntegralizadas: 60, quotasAIntegralizar: 0, capitalIntegralizado: 60000, capitalAIntegralizar: 0, tipoSocio: "Administrador", dataEntrada: "15/03/2015", dataSaida: null }],
    },
    {
      id: 3, nome: "Marcos Vinícius Souza", cpf: "410.222.333-44",
      email: "marcos.souza@padariaaurora.com.br", telefone: "(62) 99876-5544",
      participacoes: [{ empresaCodigo: "PA-0011", percentual: 40, quotasIntegralizadas: 40, quotasAIntegralizar: 0, capitalIntegralizado: 40000, capitalAIntegralizar: 0, tipoSocio: "Cotista", dataEntrada: "15/03/2015", dataSaida: null }],
    },
    {
      id: 4, nome: "Andressa Lima", cpf: "510.333.444-55",
      email: "andressa.lima@horizontecomercio.com.br", telefone: "(62) 99222-3311",
      participacoes: [{ empresaCodigo: "CH-0042", percentual: 100, quotasIntegralizadas: 100, quotasAIntegralizar: 0, capitalIntegralizado: 100000, capitalAIntegralizar: 0, tipoSocio: "Administrador", dataEntrada: "22/09/2020", dataSaida: null }],
    },
    {
      id: 5, nome: "Carlos Eduardo Ferraz", cpf: "620.444.555-66",
      email: "carlos.ferraz@gmail.com", telefone: "(62) 99333-2244",
      participacoes: [
        { empresaCodigo: "MS-0027-F1", percentual: 100, quotasIntegralizadas: 100, quotasAIntegralizar: 0, capitalIntegralizado: 100000, capitalAIntegralizar: 0, tipoSocio: "Administrador", dataEntrada: "10/02/2018", dataSaida: null },
        { empresaCodigo: "MS-0027-F2", percentual: 100, quotasIntegralizadas: 100, quotasAIntegralizar: 0, capitalIntegralizado: 100000, capitalAIntegralizar: 0, tipoSocio: "Administrador", dataEntrada: "10/02/2018", dataSaida: null },
        { empresaCodigo: "CH-0042", percentual: 5, quotasIntegralizadas: 4, quotasAIntegralizar: 1, capitalIntegralizado: 4000, capitalAIntegralizar: 1000, tipoSocio: "Cotista", dataEntrada: "01/02/2022", dataSaida: null },
      ],
    },
    {
      id: 6, nome: "Juliana Prado", cpf: "720.555.666-77",
      email: "juliana.prado@outlook.com", telefone: "",
      participacoes: [
        { empresaCodigo: "PA-0011", percentual: 5, quotasIntegralizadas: 5, quotasAIntegralizar: 0, capitalIntegralizado: 5000, capitalAIntegralizar: 0, tipoSocio: "Cotista", dataEntrada: "01/08/2019", dataSaida: null },
        { empresaCodigo: "MS-0027", percentual: 5, quotasIntegralizadas: 5, quotasAIntegralizar: 0, capitalIntegralizado: 5000, capitalAIntegralizar: 0, tipoSocio: "Cotista", dataEntrada: "01/08/2019", dataSaida: "20/05/2024" },
      ],
    },
    {
      id: 7, nome: "Paulo Roberto Nascimento", cpf: "830.666.777-88",
      email: "", telefone: "(62) 99555-6677",
      participacoes: [],
    },
    {
      id: 8, nome: "Fernanda Almeida Rocha", cpf: "940.777.888-99",
      email: "fernanda.rocha@rochaadvocacia.com.br", telefone: "(62) 99444-1122",
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

  const SOCIOS_KEY = "autopilot_prototype_socios_v1";

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
    ensureToast,
  };
})(window);
