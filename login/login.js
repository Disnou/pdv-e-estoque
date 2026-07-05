// 1. Nosso "banco de dados" simulado
const bancoDeUsuarios = [
    { login: "disnou", senha: "123", cargo: "gerente" },
    { login: "caixa01", senha: "abc", cargo: "operador" }
];

// 2. Capturando o formulário da tela pelo ID que você colocou no HTML
const formulario = document.getElementById("formLogin");

// 3. Criando o evento de "escuta" para o clique do botão
formulario.addEventListener("submit", function(evento) {
    
    // ESTA É A LINHA QUE IMPEDE O "?" NA URL E O RECARREGAMENTO DA PÁGINA
    evento.preventDefault(); 

    const usuarioDigitado = document.getElementById("usuario").value;
    const senhaDigitada = document.getElementById("senha").value;

    // 4. Verificação
    const usuarioEncontrado = bancoDeUsuarios.find(
        (pessoa) => pessoa.login === usuarioDigitado && pessoa.senha === senhaDigitada
    );

    // 5. Decisão de Acesso
    if (usuarioEncontrado) {
        localStorage.setItem("usuarioLogado", usuarioEncontrado.login);
        localStorage.setItem("cargoUsuario", usuarioEncontrado.cargo);
        
        alert(`Bem-vindo(a), ${usuarioEncontrado.login}! Acesso permitido.`);
        
        // Vai para a tela do PDV (voltando uma pasta e entrando em pdv)
        window.location.href = "../pdv/pdv.html"; 
    } else {
        alert("Usuário ou senha incorretos! Tente novamente.");
        document.getElementById("senha").value = ""; 
    }
});