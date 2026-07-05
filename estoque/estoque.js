// ==========================================
// 1. INICIALIZAÇÃO SEGURA E CONTROLE DE ACESSO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const usuarioLogado = localStorage.getItem("usuarioLogado");
    const cargoUsuario = localStorage.getItem("cargoUsuario");

    if (!usuarioLogado) {
        alert("Acesso negado! Por favor, faça o login primeiro.");
        window.location.href = "../login/login.html";
        return;
    }

    if (cargoUsuario !== "gerente") {
        alert("Acesso restrito! Apenas gerentes podem acessar este painel.");
        window.location.href = "../pdv/pdv.html"; 
        return;
    }

    document.getElementById("nomeGerente").innerText = `Gerente: ${usuarioLogado.toUpperCase()}`;

    renderizarTabela();
    calcularDashboard();
    renderizarHistorico();
    renderizarClientes();
    renderizarDescontosDiarios(); 

    // ==========================================
    // 2. GATILHOS DE EVENTOS
    // ==========================================
    
    const formProduto = document.getElementById("formProduto");
    if(formProduto) {
        formProduto.addEventListener("submit", (evento) => {
            evento.preventDefault();
            const codigo = document.getElementById("prodCodigo").value.trim();
            const nome = document.getElementById("prodNome").value.trim();
            const preco = parseFloat(document.getElementById("prodPreco").value);
            const quantidade = parseInt(document.getElementById("prodQtd").value);

            let estoqueAtual = obterEstoque();
            const index = estoqueAtual.findIndex(p => p.codigo === codigo);

            if (index !== -1) {
                estoqueAtual[index] = { codigo, nome, preco, quantidadeEstoque: quantidade };
                alert("Produto atualizado com sucesso!");
            } else {
                estoqueAtual.push({ codigo, nome, preco, quantidadeEstoque: quantidade });
                alert("Novo produto cadastrado com sucesso!");
            }

            salvarEstoque(estoqueAtual);
            renderizarTabela();
            formProduto.reset();
            document.getElementById("prodCodigo").focus();
        });
    }

    const inputBusca = document.getElementById("inputBusca");
    if(inputBusca) {
        inputBusca.addEventListener("input", (e) => renderizarTabela(e.target.value));
    }

    // NOVA LÓGICA: CADASTRO DE PROMOÇÃO ATRELADA AO PRODUTO
    const formDescontoDia = document.getElementById("formDescontoDia");
    if (formDescontoDia) {
        formDescontoDia.addEventListener("submit", (e) => {
            e.preventDefault();
            const dia = document.getElementById("promocaoDiaSemana").value;
            const codigoPromo = document.getElementById("promocaoCodigoProd").value.trim();
            const pct = parseFloat(document.getElementById("promocaoPorcentagem").value);

            // Valida se o produto existe no estoque
            const estoqueAtual = obterEstoque();
            const produtoPromo = estoqueAtual.find(p => p.codigo === codigoPromo);

            if (!produtoPromo) {
                alert("⚠️ Erro: Código de produto não encontrado no estoque!");
                document.getElementById("promocaoCodigoProd").select();
                return;
            }

            let descontos = JSON.parse(localStorage.getItem("descontosDiarios")) || {};
            
            // Agora salva o código e o nome do produto junto com a porcentagem
            descontos[dia] = { 
                codigo: codigoPromo, 
                nome: produtoPromo.nome, 
                pct: pct 
            };
            
            localStorage.setItem("descontosDiarios", JSON.stringify(descontos));

            alert(`✅ Sucesso! Na ${dia}, o produto [${produtoPromo.nome}] terá ${pct}% de desconto.`);
            renderizarDescontosDiarios();
            formDescontoDia.reset();
        });
    }

    const formCliente = document.getElementById("formCliente");
    if(formCliente) {
        formCliente.addEventListener("submit", (e) => {
            e.preventDefault();
            const cpf = document.getElementById("clienteCpf").value.trim();
            const nome = document.getElementById("clienteNome").value.trim();

            let clientes = obterClientes();

            if (clientes.some(c => c.cpf === cpf)) {
                alert("⚠️ CPF JÁ CADASTRADO! Este cliente já consta na base de dados.");
                return; 
            }

            clientes.push({ cpf, nome });
            localStorage.setItem("clientesCadastrados", JSON.stringify(clientes));

            alert("✅ Cliente cadastrado com sucesso!");
            renderizarClientes();
            e.target.reset();
        });
    }

    const inputBuscaCliente = document.getElementById("inputBuscaCliente");
    if(inputBuscaCliente) {
        inputBuscaCliente.addEventListener("input", (e) => renderizarClientes(e.target.value));
    }
});

// ==========================================
// 3. FUNÇÕES DE APOIO
// ==========================================

function obterEstoque() { return JSON.parse(localStorage.getItem("estoqueProdutos")) || []; }
function salvarEstoque(novoEstoque) { localStorage.setItem("estoqueProdutos", JSON.stringify(novoEstoque)); }
function obterClientes() { return JSON.parse(localStorage.getItem("clientesCadastrados")) || []; }

function calcularDashboard() {
    const historico = JSON.parse(localStorage.getItem("historicoVendas")) || [];
    let faturamentoTotal = 0, faturamentoDinheiro = 0, faturamentoCartao = 0, faturamentoPix = 0;

    historico.forEach(venda => {
        faturamentoTotal += venda.total;
        faturamentoDinheiro += venda.dinheiro;
        faturamentoCartao += venda.cartao;
        faturamentoPix += venda.pix;
    });

    document.getElementById("dashTotal").innerText = faturamentoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById("dashDinheiro").innerText = faturamentoDinheiro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById("dashCartao").innerText = faturamentoCartao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById("dashPix").innerText = faturamentoPix.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderizarTabela(filtro = "") {
    const listaProdutos = obterEstoque();
    const corpoTabela = document.getElementById("corpoTabelaEstoque");
    corpoTabela.innerHTML = ""; 

    listaProdutos.forEach(produto => {
        if (filtro && !produto.nome.toLowerCase().includes(filtro.toLowerCase()) && !produto.codigo.includes(filtro)) return;

        let statusBadge = produto.quantidadeEstoque === 0 ? `<span class="status-badge status-zerado">Zerado</span>` :
                          produto.quantidadeEstoque <= 5 ? `<span class="status-badge status-baixo">Baixo (${produto.quantidadeEstoque})</span>` :
                          `<span class="status-badge status-normal">Ok</span>`;

        const linha = document.createElement("tr");
        linha.innerHTML = `<td><strong>${produto.codigo}</strong></td><td>${produto.nome}</td><td>${produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td>${produto.quantidadeEstoque} un</td><td>${statusBadge}</td>`;

        linha.addEventListener("click", () => {
            document.getElementById("prodCodigo").value = produto.codigo;
            document.getElementById("prodNome").value = produto.nome;
            document.getElementById("prodPreco").value = produto.preco;
            document.getElementById("prodQtd").value = produto.quantidadeEstoque;
            document.getElementById("prodNome").focus();
        });
        corpoTabela.appendChild(linha);
    });
}

function renderizarDescontosDiarios() {
    const descontos = JSON.parse(localStorage.getItem("descontosDiarios")) || {};
    const corpoTabela = document.getElementById("corpoTabelaDescontos");
    corpoTabela.innerHTML = "";

    const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    
    dias.forEach(dia => {
        const promo = descontos[dia];
        const linha = document.createElement("tr");
        
        if (promo) {
            linha.innerHTML = `<td><strong>${dia}</strong></td><td style="color: #2b6cb0;">${promo.codigo} - ${promo.nome}</td><td><span style="color: #dd6b20; font-weight: bold;">${promo.pct}% de desconto</span></td>`;
        } else {
            linha.innerHTML = `<td><strong>${dia}</strong></td><td style="color: #a0aec0;">Nenhum produto</td><td><span style="color: #718096; font-weight: bold;">0%</span></td>`;
        }
        
        corpoTabela.appendChild(linha);
    });
}

function renderizarClientes(filtro = "") {
    const clientes = obterClientes();
    const corpoTabela = document.getElementById("corpoTabelaClientes");
    corpoTabela.innerHTML = "";

    clientes.forEach(cli => {
        if (filtro && !cli.nome.toLowerCase().includes(filtro.toLowerCase()) && !cli.cpf.includes(filtro)) return;
        
        const linha = document.createElement("tr");
        linha.innerHTML = `<td><strong>${cli.cpf}</strong></td><td>${cli.nome}</td>`;
        corpoTabela.appendChild(linha);
    });
}

function renderizarHistorico() {
    const historico = JSON.parse(localStorage.getItem("historicoVendas")) || [];
    const corpoTabelaHistorico = document.getElementById("corpoTabelaHistorico");
    corpoTabelaHistorico.innerHTML = ""; 

    historico.slice().reverse().forEach(venda => {
        const linha = document.createElement("tr");
        let detalhes = [];
        if (venda.dinheiro > 0) detalhes.push(`Dinheiro: ${venda.dinheiro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        if (venda.cartao > 0) detalhes.push(`Cartão: ${venda.cartao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        if (venda.pix > 0) detalhes.push(`PIX: ${venda.pix.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);

        linha.innerHTML = `<td style="color: #718096; font-size: 14px;">${venda.data}</td><td><strong style="color: #2b6cb0;">👤 ${venda.operador.toUpperCase()}</strong></td><td><strong>${venda.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></td><td><small style="color: #4a5568;">${detalhes.join(' | ')}</small></td>`;
        corpoTabelaHistorico.appendChild(linha);
    });
}

const inputCpf = document.getElementById("clienteCpf");
if (inputCpf) {
    inputCpf.addEventListener("input", function(e) {
        let valor = e.target.value.replace(/\D/g, "");
        if (valor.length > 11) valor = valor.slice(0, 11);
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        e.target.value = valor;
    });
}