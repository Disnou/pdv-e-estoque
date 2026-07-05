// ==========================================
// FUNÇÃO MESTRA DE ALERTAS CUSTOMIZADOS
// ==========================================
function abrirAlerta(titulo, message, tipo = "aviso") {
    return new Promise((resolve) => {
        const modalAlerta = document.getElementById("modalAlertaCustom");
        const elTitulo = document.getElementById("tituloAlertaCustom");
        const elTexto = document.getElementById("textoAlertaCustom");
        const btnOk = document.getElementById("btnOkAlerta");
        const btnCancelar = document.getElementById("btnCancelarAlerta");

        elTitulo.innerText = titulo;
        elTexto.innerText = message;

        if (tipo === "erro") elTitulo.style.color = "var(--danger)";
        else if (tipo === "sucesso") elTitulo.style.color = "var(--success)";
        else elTitulo.style.color = "var(--accent)";

        if (tipo === "confirmacao") {
            btnCancelar.style.display = "inline-block";
            btnOk.innerText = "Sim, Cancelar";
            btnOk.style.backgroundColor = "var(--danger)";
            btnOk.style.color = "#fff";
        } else {
            btnCancelar.style.display = "none";
            btnOk.innerText = "Entendido";
            btnOk.style.backgroundColor = "var(--accent)";
            btnOk.style.color = "#161200";
        }

        modalAlerta.style.display = "flex";
        setTimeout(() => btnOk.focus(), 10);

        btnOk.onclick = () => { modalAlerta.style.display = "none"; resolve(true); };
        btnCancelar.onclick = () => { modalAlerta.style.display = "none"; resolve(false); };
    });
}

// ==========================================
// 1. SEGURANÇA E CONTROLE DE SESSÃO
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    const usuarioLogado = localStorage.getItem("usuarioLogado");
    const cargoUsuario = localStorage.getItem("cargoUsuario");

    if (!usuarioLogado) {
        await abrirAlerta("Acesso Negado", "Por favor, faça o login primeiro.", "erro");
        window.location.href = "../login/login.html";
        return;
    }
    document.getElementById("nomeOperador").innerText = usuarioLogado.toUpperCase();

    const btnEstoque = document.getElementById("btnEstoque");
    if (cargoUsuario === "gerente") btnEstoque.style.display = "inline-flex";

    document.querySelector(".logout-btn").addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("usuarioLogado");
        localStorage.removeItem("cargoUsuario");
        window.location.href = "../login/login.html";
    });
});

// ==========================================
// 2. INTEGRAÇÃO COM O ESTOQUE
// ==========================================
if (!localStorage.getItem("estoqueProdutos")) {
    const estoqueInicial = [
        { codigo: "123", nome: "Arroz Branco 5kg", preco: 25.90, quantidadeEstoque: 10 },
        { codigo: "456", nome: "Feijão Carioca 1kg", preco: 8.50, quantidadeEstoque: 15 },
        { codigo: "789", nome: "Refrigerante Cola 2L", preco: 10.00, quantidadeEstoque: 999 }
    ];
    localStorage.setItem("estoqueProdutos", JSON.stringify(estoqueInicial));
}

let estoque = JSON.parse(localStorage.getItem("estoqueProdutos"));
let totalCompra = 0; 
let carrinhoTemporario = []; 

const inputCodigo = document.getElementById("codigoProduto");
const inputQuantidade = document.getElementById("quantidade");
const btnAdicionar = document.getElementById("btnAdicionar");
const listaProdutos = document.getElementById("listaProdutos");
const displayTotal = document.getElementById("valorTotal");
const btnFinalizar = document.getElementById("btnFinalizar");
const emptyState = document.getElementById("emptyState");
const itemsTable = document.getElementById("itemsTable");
const countBadge = document.getElementById("countBadge");

// Função dos botões + e -
document.getElementById('qtyMinus').addEventListener('click', () => {
    let v = parseInt(inputQuantidade.value, 10) || 1;
    inputQuantidade.value = Math.max(1, v - 1);
});
document.getElementById('qtyPlus').addEventListener('click', () => {
    let v = parseInt(inputQuantidade.value, 10) || 1;
    inputQuantidade.value = v + 1;
});

// Atualiza UI da Tabela Nova
function checarTabelaVazia() {
    if (carrinhoTemporario.length === 0) {
        emptyState.style.display = "flex";
        itemsTable.style.display = "none";
        countBadge.innerText = "0 itens";
    } else {
        emptyState.style.display = "none";
        itemsTable.style.display = "table";
        const qtdItens = carrinhoTemporario.reduce((acc, item) => acc + item.quantidade, 0);
        countBadge.innerText = `${qtdItens} ${qtdItens === 1 ? 'item' : 'itens'}`;
    }
}

// ==========================================
// 3. OPERAÇÃO DE BIPIAR MERCADORIAS
// ==========================================
btnAdicionar.addEventListener("click", async () => {
    const codigoDigitado = inputCodigo.value.trim();
    const qtdDigitada = parseInt(inputQuantidade.value);

    if (codigoDigitado === "") {
        btnFinalizar.click();
        return;
    }

    if (isNaN(qtdDigitada) || qtdDigitada <= 0) {
        await abrirAlerta("Ops!", "Quantidade inválida.", "aviso");
        setTimeout(() => inputCodigo.focus(), 100);
        return;
    }

    const produtoEstoque = estoque.find(produto => produto.codigo === codigoDigitado);

    if (produtoEstoque) {
        if (qtdDigitada > produtoEstoque.quantidadeEstoque) {
            await abrirAlerta("Estoque Insuficiente!", `O produto ${produtoEstoque.nome} possui apenas ${produtoEstoque.quantidadeEstoque} unidades disponíveis.`, "erro");
            setTimeout(() => inputQuantidade.select(), 100);
            return;
        }

        produtoEstoque.quantidadeEstoque -= qtdDigitada;
        const subtotal = produtoEstoque.preco * qtdDigitada;
        totalCompra += subtotal;
        
        carrinhoTemporario.push({ codigo: codigoDigitado, quantidade: qtdDigitada, subtotal: subtotal });

        const precoFormatado = produtoEstoque.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const subtotalFormatado = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        const novoItem = document.createElement("tr");
        novoItem.innerHTML = `
            <td>
                <span class="prod-name">${produtoEstoque.nome}</span>
                <span class="prod-code">${codigoDigitado}</span>
            </td>
            <td class="qty-cell">${qtdDigitada}</td>
            <td class="price-cell">${precoFormatado}</td>
            <td class="subtotal-cell" style="color: var(--accent);">${subtotalFormatado}</td>
            <td class="row-remove">
                <button class="icon-btn btn-cancelar-item" aria-label="Remover item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0l-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
                </button>
            </td>
        `;
        
        novoItem.querySelector('.btn-cancelar-item').addEventListener("click", async () => {
            const confirmacao = await abrirAlerta("Cancelar Item?", `Deseja remover ${produtoEstoque.nome}?`, "confirmacao");
            if (confirmacao) {
                produtoEstoque.quantidadeEstoque += qtdDigitada;
                carrinhoTemporario = carrinhoTemporario.filter(item => !(item.codigo === codigoDigitado && item.quantidade === qtdDigitada));
                totalCompra = Math.max(0, totalCompra - subtotal);
                displayTotal.innerText = totalCompra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                novoItem.remove();
                checarTabelaVazia();
                inputCodigo.focus();
            }
        });
        
        listaProdutos.appendChild(novoItem);
        displayTotal.innerText = totalCompra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        checarTabelaVazia();

        inputCodigo.value = "";
        inputQuantidade.value = "1";
        inputCodigo.focus();
    } else {
        await abrirAlerta("Não Encontrado", "Código inexistente.", "aviso");
        setTimeout(() => inputCodigo.select(), 100);
    }
});

// ==========================================
// 4. MOTOR LIQUIDADOR DE DESCONTOS E MODAL
// ==========================================
let valorRestante = 0;
let pagamentosRegistrados = [];
let metodoAtual = "";
let descontoFidelidadeAcumulado = 0;
let descontoDiaFixo = 0;

const modal = document.getElementById("modalPagamento");
const btnFecharModal = document.getElementById("btnFecharModal");
const areaDinamica = document.getElementById("areaDinamicaPagamento");
const areaQRCode = document.getElementById("areaQRCode");
const inputValorParcial = document.getElementById("valorPagamentoParcial");
const btnConfirmarParte = document.getElementById("btnConfirmarParte");
const listaPagamentosFeitos = document.getElementById("listaPagamentosFeitos");
const btnConcluirVenda = document.getElementById("btnConcluirVenda");
const botoesMetodo = document.getElementById("botoesMetodo");
const inputCpfFidelidade = document.getElementById("inputCpfFidelidade");
const btnAplicarFidelidade = document.getElementById("btnAplicarFidelidade");

if (inputCpfFidelidade) {
    inputCpfFidelidade.addEventListener("input", function(e) {
        let valor = e.target.value.replace(/\D/g, "");
        if (valor.length > 11) valor = valor.slice(0, 11);
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        e.target.value = valor;
    });
}

btnAplicarFidelidade.addEventListener("click", async () => {
    if (descontoFidelidadeAcumulado > 0) return;

    const cpfDigitado = inputCpfFidelidade.value.trim();
    if (!cpfDigitado) { botoesMetodo.focus(); return; }

    const clientesCadastrados = JSON.parse(localStorage.getItem("clientesCadastrados")) || [];
    const limparCpf = (str) => (str ? String(str).replace(/\D/g, '') : '');
    const cliente = clientesCadastrados.find(c => limparCpf(c.cpf) === limparCpf(cpfDigitado));

    if (cliente) {
        descontoFidelidadeAcumulado = totalCompra * 0.05;
        inputCpfFidelidade.disabled = true;
        btnAplicarFidelidade.style.backgroundColor = "var(--success)";
        btnAplicarFidelidade.innerText = "Clube Ativo";

        atualizarVisorModal();
        await abrirAlerta("Fidelidade Encontrada!", `Cliente: ${cliente.nome}\nDesconto: ${descontoFidelidadeAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, "sucesso");
    } else {
        await abrirAlerta("Não Encontrado", "Este CPF não é cadastrado no clube.", "erro");
        setTimeout(() => inputCpfFidelidade.select(), 100);
    }
});

btnFinalizar.addEventListener("click", async () => {
    if (totalCompra === 0) {
        await abrirAlerta("Carrinho Vazio", "Bipe algum produto primeiro.", "aviso");
        return;
    }
    
    const diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const diaHoje = diasSemana[new Date().getDay()];
    const descontosGerente = JSON.parse(localStorage.getItem("descontosDiarios")) || {};
    const promocaoHoje = descontosGerente[diaHoje];

    descontoDiaFixo = 0;
    let nomeProdutoPromo = "";
    let pctDescontoDia = 0;

    if (promocaoHoje) {
        pctDescontoDia = parseFloat(promocaoHoje.pct);
        const codigoPromo = promocaoHoje.codigo;
        nomeProdutoPromo = promocaoHoje.nome;
        carrinhoTemporario.forEach(item => {
            if (item.codigo === codigoPromo) descontoDiaFixo += item.subtotal * (pctDescontoDia / 100);
        });
    }

    if (descontoDiaFixo > 0) {
        document.getElementById("linhaDescontoDia").style.display = "flex";
        document.getElementById("modalDescontoDia").innerText = `- ${descontoDiaFixo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${pctDescontoDia}% em ${nomeProdutoPromo})`;
    } else {
        document.getElementById("linhaDescontoDia").style.display = "none";
    }

    descontoFidelidadeAcumulado = 0;
    document.getElementById("linhaDescontoFidelidade").style.display = "none";
    inputCpfFidelidade.value = "";
    inputCpfFidelidade.disabled = false;
    btnAplicarFidelidade.disabled = false;
    btnAplicarFidelidade.style.backgroundColor = "var(--accent)";
    btnAplicarFidelidade.innerText = "Buscar CPF (Enter)";

    pagamentosRegistrados = [];
    atualizarVisorModal();
    
    areaDinamica.style.display = "none";
    listaPagamentosFeitos.innerHTML = "";
    btnConcluirVenda.style.display = "none";
    botoesMetodo.style.display = "flex";

    modal.style.display = "flex";
    setTimeout(() => inputCpfFidelidade.focus(), 50);
});

btnFecharModal.addEventListener("click", () => {
    modal.style.display = "none";
    inputCodigo.focus();
});

function atualizarVisorModal() {
    document.getElementById("modalTotal").innerText = totalCompra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const totalLiquidoVenda = Math.max(0, totalCompra - descontoDiaFixo - descontoFidelidadeAcumulado);

    if(descontoFidelidadeAcumulado > 0) {
        document.getElementById("linhaDescontoFidelidade").style.display = "flex";
        document.getElementById("modalDescontoFidelidade").innerText = `- ${descontoFidelidadeAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    }

    let totalPagoAteAgora = 0;
    pagamentosRegistrados.forEach(p => totalPagoAteAgora += p.valor);
    valorRestante = totalLiquidoVenda - totalPagoAteAgora;

    if (valorRestante > 0) {
        document.getElementById("modalFaltante").innerText = valorRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById("modalTroco").innerText = "R$ 0,00";
    } else {
        document.getElementById("modalFaltante").innerText = "R$ 0,00";
        const troco = Math.abs(valorRestante);
        document.getElementById("modalTroco").innerText = troco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
}

window.selecionarMetodo = function(metodo) {
    metodoAtual = metodo;
    areaDinamica.style.display = "block";
    document.getElementById("tituloMetodo").innerText = `Pagando com: ${metodo}`;
    
    if (metodo === 'PIX') areaQRCode.style.display = "block";
    else areaQRCode.style.display = "none";

    inputValorParcial.value = Math.max(0, valorRestante).toFixed(2);
    setTimeout(() => {
        inputValorParcial.focus();
        inputValorParcial.select();
    }, 50);
};

btnConfirmarParte.addEventListener("click", async () => {
    const valorPago = parseFloat(inputValorParcial.value);
    
    if (isNaN(valorPago) || valorPago <= 0) {
        await abrirAlerta("Erro", "Valor inválido.", "aviso");
        setTimeout(() => inputValorParcial.select(), 100);
        return;
    }

    pagamentosRegistrados.push({ metodo: metodoAtual, valor: valorPago });
    atualizarVisorModal();
    areaDinamica.style.display = "none";

    if (valorRestante <= 0) {
        botoesMetodo.style.display = "none"; 
        btnConcluirVenda.style.display = "block"; 
        setTimeout(() => btnConcluirVenda.focus(), 50); 
    }
});

btnConcluirVenda.addEventListener("click", async () => {
    localStorage.setItem("estoqueProdutos", JSON.stringify(estoque));

    const totalLiquidoFinal = Math.max(0, totalCompra - descontoDiaFixo - descontoFidelidadeAcumulado);

    let dinheiroLiquido = 0, cartaoLiquido = 0, pixLiquido = 0, totalPagoBruto = 0;
    pagamentosRegistrados.forEach(p => totalPagoBruto += p.valor);
    let trocoDaVenda = Math.max(0, totalPagoBruto - totalLiquidoFinal);

    pagamentosRegistrados.forEach(p => {
        if (p.metodo === "Dinheiro") dinheiroLiquido += (p.valor - trocoDaVenda);
        else if (p.metodo === "Cartão") cartaoLiquido += p.valor;
        else if (p.metodo === "PIX") pixLiquido += p.valor;
    });

    const usuarioLogado = localStorage.getItem("usuarioLogado") || "desconhecido";
    let historicoVendas = JSON.parse(localStorage.getItem("historicoVendas")) || [];
    
    historicoVendas.push({
        id: Date.now(),
        operador: usuarioLogado,
        data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
        total: totalLiquidoFinal, 
        dinheiro: dinheiroLiquido,
        cartao: cartaoLiquido,
        pix: pixLiquido
    });
    
    localStorage.setItem("historicoVendas", JSON.stringify(historicoVendas));

    // AQUI ESTÁ A ALTERAÇÃO: O termo "fictício" foi totalmente removido daqui!
    await abrirAlerta("VENDA CONCLUÍDA!", "O cupom fiscal foi gerado com sucesso.", "sucesso");
    
    listaProdutos.innerHTML = "";
    totalCompra = 0;
    carrinhoTemporario = [];
    displayTotal.innerText = "R$ 0,00";
    checarTabelaVazia();
    modal.style.display = "none";
    inputCodigo.focus();
});

// ==========================================
// 5. ATALHOS DE TECLADO (ESTEIRA DO CAIXA)
// ==========================================
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const modalAlerta = document.getElementById("modalAlertaCustom");
        if (modalAlerta.style.display === "flex") { document.getElementById("btnOkAlerta").click(); return; }
        if (modal.style.display === "flex") { btnFecharModal.click(); return; }
    }

    if (modal.style.display === "flex") {
        if (botoesMetodo.style.display !== "none" && document.activeElement !== inputCpfFidelidade) {
            if (e.key === "1") { e.preventDefault(); selecionarMetodo('Dinheiro'); }
            if (e.key === "2") { e.preventDefault(); selecionarMetodo('Cartão'); }
            if (e.key === "3") { e.preventDefault(); selecionarMetodo('PIX'); }
        }
        if (e.target === inputCpfFidelidade && e.key === "Enter") { e.preventDefault(); btnAplicarFidelidade.click(); }
        if (e.target === inputValorParcial && e.key === "Enter") { e.preventDefault(); btnConfirmarParte.click(); }
        if (btnConcluirVenda.style.display === "block" && e.key === "Enter") { e.preventDefault(); btnConcluirVenda.click(); }
    }
});

inputCodigo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') { evento.preventDefault(); btnAdicionar.click(); } 
    else if (evento.key === '*' || evento.key === 'x' || evento.key === 'X') {
        evento.preventDefault();
        inputQuantidade.focus();
        inputQuantidade.select();
    }
});

inputQuantidade.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') { evento.preventDefault(); inputCodigo.focus(); }
});