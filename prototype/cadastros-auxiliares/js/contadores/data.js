/*
  Mock do Registro de Contadores — registro mestre, consumido também pela aba
  Contadores de Empresas (empresas/js/contadores.js inclui este arquivo e usa
  ContadoresData.getContadores()/setContadores() em vez de manter cópia
  local). `empresasAtendidas` referencia códigos reais de EmpresasData.EMPRESAS.
  Extraído de EmpresasData.CONTADORES_INICIAL (mesmo padrão de separação já
  aplicado a Sócios — ver js/socios/data.js).
*/
(function (global) {
  const CONTADORES_INICIAL = [
    { id: 1, nome: "Contador da Empresa Exemplo", cpf: "200.000.000-27", crc: "1SC123456/O-4", empresasAtendidas: ["MS-0027", "MS-0027-F1", "MS-0027-F2"] },
    { id: 2, nome: "Juliana Prado Contabilidade", cpf: "620.444.555-66", crc: "1GO987654/O-2", empresasAtendidas: ["PA-0011", "CH-0042"] },
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

  const CONTADORES_KEY = "autopilot_prototype_contadores_v1";

  function getContadores() {
    return loadStore(CONTADORES_KEY, CONTADORES_INICIAL);
  }
  function setContadores(contadores) {
    saveStore(CONTADORES_KEY, contadores);
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
    return getContadores().some((c) => apenasDigitos(c.cpf) === digitos && c.id !== ignorarId);
  }

  // Toast compartilhado pela página da trilha — mesmo padrão de
  // js/socios/data.js, replicado aqui porque este módulo não usa o shell de
  // abas de detalhe de empresa.
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

  global.ContadoresData = {
    CONTADORES_INICIAL,
    getContadores,
    setContadores,
    formatarCpfInput,
    cpfJaCadastrado,
    ensureToast,
  };
})(window);
