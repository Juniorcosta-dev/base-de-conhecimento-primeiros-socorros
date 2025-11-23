// Variável global para armazenar os dados do JSON
let dadosProcedimentos = [];
let filtroAtual = "todos";

// Função que carrega os dados do JSON quando a página abre
async function carregarDados() {
    try {
        const resposta = await fetch("./dados.json");
        const dados = await resposta.json();
        dadosProcedimentos = dados.procedimentos;

        // Cria os filtros por categoria
        criarFiltros();

        // Exibe todos os procedimentos ao carregar a página
        exibirProcedimentos(dadosProcedimentos);
        atualizarContador(dadosProcedimentos.length, dadosProcedimentos.length);
    } catch (erro) {
        console.error("Erro ao carregar os dados:", erro);
        exibirMensagemErro();
    }
}

// Cria os botões de filtro por categoria
function criarFiltros() {
    const categorias = [
        ...new Set(dadosProcedimentos.map((p) => p.categoria)),
    ].sort();

    const filtrosHTML = `
        <div class="filtros-container">
            <button class="filtro-btn ativo" data-filtro="todos">
                Todos
            </button>
            <button class="filtro-btn filtro-gravidade" data-filtro="alta">
                🔴 Urgentes
            </button>
            ${categorias
                .map(
                    (cat) => `
                <button class="filtro-btn" data-filtro="${cat}">
                    ${cat}
                </button>
            `
                )
                .join("")}
        </div>
    `;

    const container = document.querySelector(".card-container");
    container.insertAdjacentHTML("beforebegin", filtrosHTML);

    document.querySelectorAll(".filtro-btn").forEach((btn) => {
        btn.addEventListener("click", () => aplicarFiltro(btn));
    });
}

// Aplica o filtro selecionado
function aplicarFiltro(btnClicado) {
    document
        .querySelectorAll(".filtro-btn")
        .forEach((btn) => btn.classList.remove("ativo"));
    btnClicado.classList.add("ativo");

    filtroAtual = btnClicado.dataset.filtro;

    document.getElementById("campo-busca").value = "";

    let resultados;

    if (filtroAtual === "todos") {
        resultados = dadosProcedimentos;
    } else if (filtroAtual === "alta") {
        resultados = dadosProcedimentos.filter((p) => p.gravidade === "alta");
    } else {
        resultados = dadosProcedimentos.filter(
            (p) => p.categoria === filtroAtual
        );
    }

    resultados = [...resultados].sort((a, b) => {
        if (a.gravidade === "alta" && b.gravidade !== "alta") return -1;
        if (a.gravidade !== "alta" && b.gravidade === "alta") return 1;
        return 0;
    });

    exibirProcedimentos(resultados);
    atualizarContador(resultados.length, dadosProcedimentos.length);
}

// Função que cria o HTML de um card
function criarCard(procedimento) {
    const classeGravidade =
        procedimento.gravidade === "alta"
            ? "gravidade-alta"
            : "gravidade-media";

    return `
        <article class="card" onclick="abrirModal(${procedimento.id})" aria-label="${procedimento.nome}">
            <div class="card-icone">${procedimento.icone}</div>
            <h2 class="card-titulo">${procedimento.nome}</h2>
            <span class="tag ${classeGravidade}">${procedimento.categoria}</span>
        </article>
    `;
}

// Função para criar o modal com detalhes
function criarModalHTML(proc) {
    const listaSinais = proc.sinais.map((s) => `<li>${s}</li>`).join("");
    const listaFazer = proc.oqueFazer
        .map((p, i) => `<li><span class="num">${i + 1}</span>${p}</li>`)
        .join("");
    const listaNaoFazer = proc.oqueNaoFazer
        .map((item) => `<li>${item}</li>`)
        .join("");

    return `
        <div class="modal-overlay" onclick="fecharModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <button class="modal-fechar" onclick="fecharModal(event)" aria-label="Fechar">×</button>
                
                <header class="modal-header">
                    <span class="modal-icone">${proc.icone}</span>
                    <div>
                        <h2>${proc.nome}</h2>
                        <span class="tag tag-${proc.gravidade}">${proc.categoria} • Gravidade ${proc.gravidade}</span>
                    </div>
                </header>
                
                <div class="modal-conteudo">
                    <section class="modal-secao">
                        <h3>🔍 Como identificar</h3>
                        <ul class="lista-sinais">${listaSinais}</ul>
                    </section>
                    
                    <section class="modal-secao secao-fazer">
                        <h3>✅ O que fazer</h3>
                        <ol class="lista-fazer">${listaFazer}</ol>
                    </section>
                    
                    <section class="modal-secao secao-nao-fazer">
                        <h3>🚫 O que NÃO fazer</h3>
                        <ul class="lista-nao-fazer">${listaNaoFazer}</ul>
                    </section>
                    
                    <section class="modal-secao secao-emergencia">
                        <h3>📞 Quando chamar ajuda</h3>
                        <p>${proc.quandoChamarAjuda}</p>
                    </section>
                </div>
                
                <footer class="modal-footer">
                    <a href="tel:192" class="btn btn-emergencia">📱 Ligar SAMU 192</a>
                    <a href="${proc.saibaMais}" target="_blank" rel="noopener" class="btn btn-link">Saiba mais →</a>
                </footer>
            </div>
        </div>
    `;
}

// Abre o modal
function abrirModal(id) {
    const proc = dadosProcedimentos.find((p) => p.id === id);
    if (!proc) return;

    const modalHTML = criarModalHTML(proc);
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
        document.querySelector(".modal-overlay").classList.add("ativo");
    });
}

// Fecha o modal
function fecharModal(event) {
    const overlay = document.querySelector(".modal-overlay");
    if (!overlay) return;

    overlay.classList.remove("ativo");
    document.body.style.overflow = "";

    setTimeout(() => overlay.remove(), 200);
}

// Função que exibe os procedimentos na tela
function exibirProcedimentos(procedimentos) {
    const container = document.querySelector(".card-container");

    if (procedimentos.length === 0) {
        container.innerHTML = `
            <div class="sem-resultados">
                <p>😕 Nenhum procedimento encontrado.</p>
                <p>Tente buscar por: engasgo, queimadura, desmaio, infarto...</p>
            </div>
        `;
        return;
    }

    const cardsHTML = procedimentos.map((proc) => criarCard(proc)).join("");
    container.innerHTML = cardsHTML;
}

// Função que exibe mensagem de erro
function exibirMensagemErro() {
    const container = document.querySelector(".card-container");
    container.innerHTML = `
        <div class="sem-resultados">
            <p>❌ Erro ao carregar os dados.</p>
            <p>Verifique se o arquivo dados.json está na pasta correta.</p>
        </div>
    `;
}

// Remove acentos para busca mais flexível
function removerAcentos(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Palavras-chave sinônimas para busca inteligente
const sinonimos = {
    engasgo: [
        "engasgado",
        "engasgando",
        "sufocando",
        "asfixia",
        "não respira",
        "comida presa",
    ],
    infarto: ["ataque cardíaco", "dor no peito", "coração", "cardíaco"],
    avc: ["derrame", "acidente vascular", "paralisia", "rosto caído"],
    queimadura: ["queimado", "fogo", "água quente", "sol"],
    sangue: ["sangramento", "hemorragia", "sangrando", "corte"],
    osso: ["fratura", "quebrado", "quebrou", "luxação"],
    desmaio: ["desmaiou", "desmaiando", "inconsciente", "apagou"],
    convulsão: ["convulsionando", "tremendo", "ataque epilético", "epilepsia"],
    afogamento: ["afogando", "água", "piscina", "mar"],
    veneno: [
        "envenenamento",
        "intoxicação",
        "ingeriu produto",
        "tomou remédio",
    ],
    picada: ["mordida", "cobra", "escorpião", "aranha", "abelha"],
    alergia: ["anafilaxia", "alérgico", "inchaço", "urticária"],
    respiração: ["respirar", "falta de ar", "não respira", "asma"],
    bebê: ["criança", "recém-nascido", "infantil", "filho"],
    calor: ["insolação", "hipertermia", "sol", "quente"],
    frio: ["hipotermia", "congelando", "gelado"],
    açúcar: ["hipoglicemia", "glicose", "diabético", "diabetes"],
    pânico: ["ansiedade", "crise", "nervoso", "tremendo"],
};

// Expande o termo de busca com sinônimos
function expandirBusca(termo) {
    const termoLimpo = removerAcentos(termo.toLowerCase());
    let termos = [termoLimpo];

    for (const [chave, valores] of Object.entries(sinonimos)) {
        if (
            termoLimpo.includes(chave) ||
            valores.some((v) => termoLimpo.includes(removerAcentos(v)))
        ) {
            termos.push(chave);
            termos = termos.concat(valores.map((v) => removerAcentos(v)));
        }
    }

    return [...new Set(termos)];
}

// Calcula relevância do resultado
function calcularRelevancia(proc, termos) {
    let pontos = 0;
    const procTexto = removerAcentos(JSON.stringify(proc).toLowerCase());

    for (const termo of termos) {
        if (removerAcentos(proc.nome.toLowerCase()).includes(termo))
            pontos += 10;
        if (removerAcentos(proc.categoria.toLowerCase()).includes(termo))
            pontos += 5;
        if (
            proc.sinais.some((s) =>
                removerAcentos(s.toLowerCase()).includes(termo)
            )
        )
            pontos += 4;
        if (
            proc.oqueFazer.some((p) =>
                removerAcentos(p.toLowerCase()).includes(termo)
            )
        )
            pontos += 2;
        if (procTexto.includes(termo)) pontos += 1;
    }

    if (proc.gravidade === "alta") pontos += 3;

    return pontos;
}

// Função de busca
function iniciarBusca() {
    const campoBusca = document.getElementById("campo-busca");
    const termoBusca = campoBusca.value.trim();

    // Se vazio, mostra todos ordenados por gravidade
    if (termoBusca === "") {
        const ordenados = [...dadosProcedimentos].sort((a, b) => {
            if (a.gravidade === "alta" && b.gravidade !== "alta") return -1;
            if (a.gravidade !== "alta" && b.gravidade === "alta") return 1;
            return 0;
        });
        exibirProcedimentos(ordenados);
        atualizarContador(ordenados.length, dadosProcedimentos.length);
        return;
    }

    const termosExpandidos = expandirBusca(termoBusca);

    const resultados = dadosProcedimentos
        .map((proc) => ({
            ...proc,
            relevancia: calcularRelevancia(proc, termosExpandidos),
        }))
        .filter((proc) => proc.relevancia > 0)
        .sort((a, b) => b.relevancia - a.relevancia);

    exibirProcedimentos(resultados);
    atualizarContador(resultados.length, dadosProcedimentos.length);
}

// Atualiza contador de resultados
function atualizarContador(encontrados, total) {
    let contador = document.getElementById("contador-resultados");

    if (!contador) {
        contador = document.createElement("div");
        contador.id = "contador-resultados";
        contador.className = "contador-resultados";
        document.querySelector(".card-container").before(contador);
    }

    if (encontrados === total) {
        contador.textContent = `Mostrando todos os ${total} procedimentos`;
    } else {
        contador.textContent = `${encontrados} de ${total} procedimentos encontrados`;
    }
}

// Mensagens criativas para input vazio
const mensagensInputVazio = [
    "🩺 Ops! Assim como um diagnóstico, a busca precisa de informações. Digite algo!",
    "🚑 Campo vazio detectado! Digite uma emergência para buscar.",
    "💉 Prescrição: digite pelo menos uma palavra para iniciar a busca.",
    "🏥 Atenção! O campo de busca está em estado crítico... de vazio!",
    "❤️ Primeiros socorros para sua busca: adicione pelo menos um termo.",
    "🔍 Busca em parada cardíaca! Reanime digitando algo.",
    "📋 Prontuário vazio! Informe o que você procura.",
    "⚠️ Alerta: impossível diagnosticar uma busca sem sintomas (palavras)!",
    "🩹 Curativo necessário: preencha o campo de busca.",
    "😷 Máscara, álcool gel e... uma palavra na busca, por favor!",
];

// Retorna uma mensagem aleatória
function getMensagemAleatoria() {
    const index = Math.floor(Math.random() * mensagensInputVazio.length);
    return mensagensInputVazio[index];
}

// Mostra mensagem de aviso
function mostrarAviso(mensagem) {
    const avisoAnterior = document.querySelector(".aviso-busca");
    if (avisoAnterior) avisoAnterior.remove();

    const aviso = document.createElement("div");
    aviso.className = "aviso-busca";
    aviso.innerHTML = `
        <span class="aviso-texto">${mensagem}</span>
        <button class="aviso-fechar" onclick="this.parentElement.remove()">×</button>
    `;

    const main = document.querySelector("main");
    main.insertBefore(aviso, main.firstChild);

    const input = document.getElementById("campo-busca");
    input.classList.add("input-erro");
    input.focus();

    setTimeout(() => {
        input.classList.remove("input-erro");
    }, 2000);

    setTimeout(() => {
        if (aviso.parentElement) {
            aviso.classList.add("aviso-saindo");
            setTimeout(() => aviso.remove(), 300);
        }
    }, 5000);
}

// Valida e executa a busca (chamada pelo onclick do botão e pelo Enter)
function validarEbuscar() {
    const campoBusca = document.getElementById("campo-busca");
    const termo = campoBusca.value.trim();

    if (termo === "") {
        mostrarAviso(getMensagemAleatoria());
        return;
    }

    iniciarBusca();
}

// Busca ao pressionar Enter no input
document
    .getElementById("campo-busca")
    .addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            validarEbuscar();
        }
    });

// Carrega os dados quando a página terminar de carregar
document.addEventListener("DOMContentLoaded", carregarDados);
