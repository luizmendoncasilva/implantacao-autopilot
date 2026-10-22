/*
  Endereço por CEP — compartilhado pelos formulários com endereço (drawer
  "Editar empresa" e drawer de Sindicato). Município e UF nunca são texto
  livre:
  - CEP completo encontrado → preenche Município e UF (travados) e sugere
    Logradouro e Bairro (editáveis); para trocar município/UF, troca-se o CEP.
  - CEP não encontrado → UF (select) e Município (combobox filtrado pela UF)
    passam a ser escolhidos em lista.
  Busca só pelo CEP completo, como os serviços reais (Correios/ViaCEP) — sem
  sugestão por prefixo. No protótipo a busca é simulada (BASE_CEP, com atraso
  artificial); nenhuma chamada externa.
*/
(function (global) {
  const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

  // Catálogo resumido (capital + alguns municípios) — GO mais completo por
  // concentrar os dados de exemplo.
  const MUNICIPIOS_POR_UF = {
    AC: ["Rio Branco", "Cruzeiro do Sul"],
    AL: ["Maceió", "Arapiraca"],
    AP: ["Macapá", "Santana"],
    AM: ["Manaus", "Parintins"],
    BA: ["Salvador", "Feira de Santana", "Vitória da Conquista"],
    CE: ["Fortaleza", "Caucaia", "Juazeiro do Norte"],
    DF: ["Brasília"],
    ES: ["Vitória", "Vila Velha", "Serra"],
    GO: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Trindade", "Senador Canedo", "Catalão", "Itumbiara", "Caldas Novas", "Jataí", "Luziânia", "Formosa"],
    MA: ["São Luís", "Imperatriz"],
    MT: ["Cuiabá", "Várzea Grande", "Rondonópolis"],
    MS: ["Campo Grande", "Dourados"],
    MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora"],
    PA: ["Belém", "Ananindeua", "Santarém"],
    PB: ["João Pessoa", "Campina Grande"],
    PR: ["Curitiba", "Londrina", "Maringá"],
    PE: ["Recife", "Jaboatão dos Guararapes", "Olinda"],
    PI: ["Teresina", "Parnaíba"],
    RJ: ["Rio de Janeiro", "Niterói", "Duque de Caxias"],
    RN: ["Natal", "Mossoró"],
    RS: ["Porto Alegre", "Caxias do Sul", "Pelotas"],
    RO: ["Porto Velho", "Ji-Paraná"],
    RR: ["Boa Vista"],
    SC: ["Florianópolis", "Joinville", "Blumenau"],
    SP: ["São Paulo", "Campinas", "Guarulhos", "Santos"],
    SE: ["Aracaju", "Nossa Senhora do Socorro"],
    TO: ["Palmas", "Araguaína"],
  };

  // Base simulada: CEPs dos dados de exemplo (Empresas e Sindicatos) + alguns
  // extras. CEP sem logradouro/bairro = CEP geral de município (cidade pequena).
  const BASE_CEP = {
    "74223000": { municipio: "Goiânia", uf: "GO", logradouro: "Rua das Flores", bairro: "Setor Bueno" },
    "74675000": { municipio: "Goiânia", uf: "GO", logradouro: "Av. Industrial", bairro: "Distrito Industrial" },
    "74230030": { municipio: "Goiânia", uf: "GO", logradouro: "Rua T-30", bairro: "Setor Bueno" },
    "74030010": { municipio: "Goiânia", uf: "GO", logradouro: "Av. Anhanguera", bairro: "Centro" },
    "75132560": { municipio: "Anápolis", uf: "GO", logradouro: "Rod. BR-153", bairro: "Distrito Agroindustrial" },
    "75380010": { municipio: "Trindade", uf: "GO", logradouro: "Av. Contorno", bairro: "Distrito Industrial II" },
    "74905070": { municipio: "Aparecida de Goiânia", uf: "GO", logradouro: "Av. Independência", bairro: "Jardim Novo Mundo" },
    "75900000": { municipio: "Rio Verde", uf: "GO", logradouro: "", bairro: "" },
    "01310100": { municipio: "São Paulo", uf: "SP", logradouro: "Av. Paulista", bairro: "Bela Vista" },
    "70040010": { municipio: "Brasília", uf: "DF", logradouro: "SBN Quadra 1", bairro: "Asa Norte" },
    "20040020": { municipio: "Rio de Janeiro", uf: "RJ", logradouro: "Av. Rio Branco", bairro: "Centro" },
    "30130010": { municipio: "Belo Horizonte", uf: "MG", logradouro: "Av. Afonso Pena", bairro: "Centro" },
  };

  const ATRASO_BUSCA_MS = 450;

  function apenasDigitos(valor) {
    return (valor || "").replace(/\D/g, "");
  }
  // Mesmo formato já usado nos dados do protótipo: 00.000-000.
  function formatarCep(valor) {
    const d = apenasDigitos(valor).slice(0, 8);
    if (d.length > 5) return d.slice(0, 2) + "." + d.slice(2, 5) + "-" + d.slice(5);
    if (d.length > 2) return d.slice(0, 2) + "." + d.slice(2);
    return d;
  }
  function buscarCep(cep) {
    const resultado = BASE_CEP[apenasDigitos(cep)] || null;
    return new Promise((resolve) => setTimeout(() => resolve(resultado), ATRASO_BUSCA_MS));
  }

  /*
    cfg: { cep, uf, municipio, logradouro, bairro, status } — elementos do
    formulário. `uf` é um <select class="field-select">, `municipio` é a raiz
    de um .combobox, `status` é um <span> de ajuda abaixo do CEP. onChange()
    opcional, chamado a cada mudança de estado (ex.: revalidar o "Salvar").
    Retorna { setValores({cep, municipio, uf}), getValores(), estaBuscando() }.
  */
  function init(cfg) {
    let municipioAtual = "";
    let buscaSeq = 0;
    let buscando = false;
    const onChange = cfg.onChange || function () {};

    cfg.uf.innerHTML = '<option value="">Selecione...</option>' + UFS.map((uf) => '<option value="' + uf + '">' + uf + "</option>").join("");

    function setStatus(texto, tom) {
      cfg.status.textContent = texto;
      cfg.status.style.color = tom === "erro" ? "var(--destructive)" : "";
    }

    function renderMunicipios() {
      const lista = (MUNICIPIOS_POR_UF[cfg.uf.value] || []).slice();
      // Valor legado fora do catálogo continua selecionável, para não se perder.
      if (municipioAtual && !lista.includes(municipioAtual)) lista.unshift(municipioAtual);
      UI.initCombobox(cfg.municipio, lista.map((m) => ({ value: m, label: m })), municipioAtual, (value) => {
        municipioAtual = value;
        onChange();
      });
    }

    function travar(travado) {
      cfg.uf.disabled = travado;
      cfg.municipio.querySelector(".combobox-trigger").disabled = travado || !cfg.uf.value;
    }

    function estadoEncontrado() {
      travar(true);
      setStatus("Município e UF preenchidos pelo CEP.");
    }
    function estadoManual() {
      travar(false);
      setStatus("CEP não encontrado. Selecione a UF e o município.", "erro");
    }
    function estadoIncompleto() {
      travar(true);
      setStatus("Informe o CEP completo para preencher município e UF.");
    }

    function aplicar(municipio, uf) {
      cfg.uf.value = uf || "";
      municipioAtual = municipio || "";
      renderMunicipios();
    }

    cfg.cep.addEventListener("input", () => {
      cfg.cep.value = formatarCep(cfg.cep.value);
      const digitos = apenasDigitos(cfg.cep.value);
      const seq = ++buscaSeq;
      if (digitos.length < 8) {
        buscando = false;
        estadoIncompleto();
        onChange();
        return;
      }
      buscando = true;
      travar(true);
      setStatus("Buscando CEP...");
      onChange();
      buscarCep(digitos).then((endereco) => {
        if (seq !== buscaSeq) return;
        buscando = false;
        if (endereco) {
          aplicar(endereco.municipio, endereco.uf);
          if (endereco.logradouro) cfg.logradouro.value = endereco.logradouro;
          if (endereco.bairro) cfg.bairro.value = endereco.bairro;
          estadoEncontrado();
        } else {
          aplicar("", "");
          estadoManual();
        }
        onChange();
      });
    });

    cfg.uf.addEventListener("change", () => {
      municipioAtual = "";
      renderMunicipios();
      travar(false);
      onChange();
    });

    // Abertura do formulário: CEP da base → travado; CEP fora da base (ex.:
    // empresa importada) → escolha em lista, com os valores atuais mantidos.
    function setValores(v) {
      buscaSeq++;
      buscando = false;
      cfg.cep.value = formatarCep(v.cep || "");
      aplicar(v.municipio, v.uf);
      const digitos = apenasDigitos(v.cep);
      if (digitos.length < 8) estadoIncompleto();
      else if (BASE_CEP[digitos]) estadoEncontrado();
      else {
        travar(false);
        setStatus("CEP não encontrado na base. Confira a UF e o município.");
      }
    }

    function getValores() {
      return { cep: cfg.cep.value.trim(), municipio: municipioAtual, uf: cfg.uf.value };
    }

    return { setValores: setValores, getValores: getValores, estaBuscando: () => buscando };
  }

  global.EnderecoCep = { UFS: UFS, MUNICIPIOS_POR_UF: MUNICIPIOS_POR_UF, formatarCep: formatarCep, buscarCep: buscarCep, init: init };
})(window);
