const ALIMENTOS_DB = {
    'brigadeiro': { calorias: 130, emoji: '🍫' },
    'chocolate': { calorias: 545, emoji: '🍫' },
    'sorvete': { calorias: 207, emoji: '🍦' },
    'pizza': { calorias: 266, emoji: '🍕' },
    'hamburguer': { calorias: 295, emoji: '🍔' },
    'batata frita': { calorias: 312, emoji: '🍟' },
    'bolo': { calorias: 257, emoji: '🍰' },
    'refrigerante': { calorias: 37, emoji: '🥤' },
    'cerveja': { calorias: 43, emoji: '🍺' },
    'vinho': { calorias: 83, emoji: '🍷' },
    'doce': { calorias: 100, emoji: '🍬' },
    'pudim': { calorias: 147, emoji: '🍮' },
    'pastel': { calorias: 251, emoji: '🥟' },
    'coxinha': { calorias: 279, emoji: '🍗' },
    'pão': { calorias: 264, emoji: '🍞' },
    'queijo': { calorias: 402, emoji: '🧀' },
    'bacon': { calorias: 541, emoji: '🥓' },
    'biscoito': { calorias: 138, emoji: '🍪' },
    'cookie': { calorias: 138, emoji: '🍪' },
    'macarrão': { calorias: 131, emoji: '🍝' },
    'lasanha': { calorias: 132, emoji: '🍝' }
};

class FureiADieta {
    constructor() {
        this.btnPrato = document.getElementById('btnPrato');
        this.toggleTheme = document.getElementById('toggleTheme');
        this.resetBtn = document.getElementById('resetBtn');
        this.calendario = document.getElementById('calendario');
        this.pressionando = false;
        this.timerPressao = null;
        this.diasMarcados = new Set();
        this.welcomeDialog = document.getElementById('welcomeDialog');
        this.startButton = document.getElementById('startButton');
        this.primeiraNotaCriada = localStorage.getItem('primeiraNotaCriada') === 'true';
        this.primeiroReset = true;
        this.resetDialog = document.getElementById('resetDialog');
        this.resetDialog.style.display = 'none';
        this.confirmResetBtn = document.getElementById('confirmReset');
        this.cancelResetBtn = document.getElementById('cancelReset');
        this.painelAnotacao = document.getElementById('painelAnotacao');
        this.overlay = document.createElement('div');
        this.overlay.className = 'overlay-painel';
        document.body.appendChild(this.overlay);
        this.analisarBtn = this.painelAnotacao.querySelector('.analisar-btn');
        this.salvarBtn = this.painelAnotacao.querySelector('.salvar-anotacao');
        this.analiseCalorias = this.painelAnotacao.querySelector('.analise-calorias');
        this.listaAlimentos = this.painelAnotacao.querySelector('.lista-alimentos');
        this.totalCalorias = this.painelAnotacao.querySelector('.total-calorias span');

        // Verificar se é a primeira visita
        if (!localStorage.getItem('visitedBefore')) {
            this.mostrarDialogoInicial();
        } else {
            // Se não for a primeira visita, esconder o diálogo
            this.welcomeDialog.style.display = 'none';
        }

        // Adicionar propriedades para análise calórica
        this.analisesPorNota = new Map();
        this.carregarAnalises();

        // Adicionar debounce para análise
        this.debounceTimeout = null;

        this.inicializar();
    }

    inicializar() {
        this.criarCalendario();
        this.configurarEventos();
        this.carregarDiasMarcados();
        this.carregarAnotacoes();
        this.carregarNotas();
    }

    configurarEventos() {
        this.btnPrato.addEventListener('mousedown', () => this.iniciarPressao());
        this.btnPrato.addEventListener('mouseup', () => this.pararPressao());
        this.btnPrato.addEventListener('mouseleave', () => this.pararPressao());
        this.toggleTheme.addEventListener('click', () => this.alternarTema());
        this.resetBtn.addEventListener('click', () => this.resetarCalendario());
    }

    iniciarPressao() {
        this.pressionando = true;
        this.btnPrato.classList.add('inflando');
        
        this.timerPressao = setTimeout(() => {
            if (this.pressionando) {
                this.criarNota();
                this.btnPrato.classList.remove('inflando');
            }
        }, 2000);
    }

    pararPressao() {
        this.pressionando = false;
        this.btnPrato.classList.remove('inflando');
        
        if (this.timerPressao) {
            clearTimeout(this.timerPressao);
            this.timerPressao = null;
        }
    }

    criarNota(notaSalva = null) {
        const hoje = new Date().toLocaleDateString();
        const ultimaNota = localStorage.getItem('ultimaNota');

        if (!notaSalva && ultimaNota === hoje) {
            alert('Você já registrou uma nota hoje!');
            return;
        }

        const nota = document.createElement('div');
        nota.className = 'nota';
        
        const agora = notaSalva ? new Date(notaSalva.data) : new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR');
        const horaFormatada = agora.toLocaleTimeString('pt-BR');
        
        nota.innerHTML = `
            <div class="nota-header">
                <div class="timestamp">${dataFormatada} - ${horaFormatada}</div>
                <div class="drag-handle">⋮⋮</div>
            </div>
            <div class="nota-content">
                <div>Ops... Furei a dieta! 🍽️</div>
                <div class="nota-indicador">📝</div>
            </div>
        `;

        // Usar rotação salva ou gerar nova
        const rotacao = notaSalva ? notaSalva.rotacao : Math.random() * 20 - 10;
        nota.style.setProperty('--rotacao', `${rotacao}deg`);

        // Usar posição salva ou gerar nova
        if (notaSalva) {
            nota.style.left = `${notaSalva.posicao.x}px`;
            nota.style.top = `${notaSalva.posicao.y}px`;
        } else {
            const posicao = this.gerarPosicaoValida();
            nota.style.left = `${posicao.x}px`;
            nota.style.top = `${posicao.y}px`;
        }

        document.body.appendChild(nota);
        
        const dataId = notaSalva ? notaSalva.id : agora.toISOString().split('T')[0];
        nota.dataset.notaId = dataId;

        if (!notaSalva) {
            this.marcarDia(agora);
            localStorage.setItem('ultimaNota', hoje);
        }

        setTimeout(() => {
            this.tornarArrastavel(nota);
        }, 500);

        if (notaSalva && notaSalva.anotacao) {
            nota.dataset.anotacao = notaSalva.anotacao;
            const indicador = nota.querySelector('.nota-indicador');
            indicador.style.display = 'block';
        }

        if (!notaSalva && !this.primeiraNotaCriada) {
            this.mostrarDicaReset();
            this.primeiraNotaCriada = true;
            localStorage.setItem('primeiraNotaCriada', 'true');
        }

        nota.addEventListener('notaClick', () => this.abrirPainelAnotacao(nota));
        this.salvarNotas(); // Salvar após criar
    }

    gerarPosicaoValida() {
        const footerHeight = document.querySelector('footer').offsetHeight;
        const maxX = window.innerWidth - 250;
        const maxY = window.innerHeight - footerHeight - 100;
        const minY = footerHeight + 50;
        
        let tentativas = 0;
        let posicaoValida = false;
        let x, y;

        while (!posicaoValida && tentativas < 10) {
            x = Math.random() * maxX + 48;
            y = Math.random() * (maxY - minY) + minY;
            
            const outrasNotas = document.querySelectorAll('.nota');
            posicaoValida = true;

            for (let outraNota of outrasNotas) {
                const rect = outraNota.getBoundingClientRect();
                const distancia = Math.hypot(x - rect.left, y - rect.top);
                
                if (distancia < 200) {
                    posicaoValida = false;
                    break;
                }
            }
            
            tentativas++;
        }

        return { x, y };
    }

    salvarNotas() {
        const notas = [];
        document.querySelectorAll('.nota').forEach(nota => {
            notas.push({
                id: nota.dataset.notaId,
                data: new Date(nota.dataset.notaId).toISOString(),
                posicao: {
                    x: parseInt(nota.style.left),
                    y: parseInt(nota.style.top)
                },
                rotacao: parseInt(nota.style.getPropertyValue('--rotacao')),
                anotacao: nota.dataset.anotacao || ''
            });
        });
        localStorage.setItem('notas', JSON.stringify(notas));
    }

    carregarNotas() {
        const notasSalvas = localStorage.getItem('notas');
        if (notasSalvas) {
            const notas = JSON.parse(notasSalvas);
            notas.forEach(nota => this.criarNota(nota));
        }
    }

    tornarArrastavel(elemento) {
        const dragHandle = elemento.querySelector('.drag-handle');
        const content = elemento.querySelector('.nota-content');
        let offsetX = 0;
        let offsetY = 0;
        let isDragging = false;

        // Evento de clique apenas no conteúdo
        content.addEventListener('click', (e) => {
            if (!isDragging) {
                this.abrirPainelAnotacao(elemento);
            }
        });

        // Arrasto apenas pelo handle
        dragHandle.addEventListener('mousedown', iniciarArrasto);
        
        function iniciarArrasto(e) {
            e.preventDefault();
            isDragging = true;
            
            const rect = elemento.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            elemento.style.cursor = 'grabbing';
            document.addEventListener('mousemove', arrastar);
            document.addEventListener('mouseup', pararArrasto);
            elemento.style.zIndex = '1000';
        }
        
        function arrastar(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            elemento.style.left = `${x}px`;
            elemento.style.top = `${y}px`;
        }
        
        const self = this;
        
        function pararArrasto() {
            isDragging = false;
            elemento.style.cursor = 'default';
            document.removeEventListener('mousemove', arrastar);
            document.removeEventListener('mouseup', pararArrasto);
            elemento.style.zIndex = 'var(--z-nota)';
            self.salvarNotas();
        }
    }

    verificarSobreposicao(rect1, rect2) {
        return !(rect1.x + rect1.width < rect2.x ||
                rect1.x > rect2.x + rect2.width ||
                rect1.y + rect1.height < rect2.y ||
                rect1.y > rect2.y + rect2.height);
    }

    criarCalendario() {
        // Limpar calendário existente
        this.calendario.innerHTML = '';
        
        // Pegar o ano atual
        const anoAtual = new Date().getFullYear();
        const primeiroDia = new Date(anoAtual, 0, 1);
        const ultimoDia = new Date(anoAtual, 11, 31);
        
        // Criar um ponto para cada dia do ano atual
        for (let data = new Date(primeiroDia); data <= ultimoDia; data.setDate(data.getDate() + 1)) {
            const dia = document.createElement('div');
            dia.className = 'dia';
            
            // Guardar a data completa como atributo
            const dataFormatada = data.toISOString().split('T')[0];
            dia.dataset.data = dataFormatada;
            
            // Formatar data para exibição (DD/MM/YYYY)
            const dataExibicao = data.toLocaleDateString('pt-BR');
            dia.dataset.tooltip = dataExibicao;
            
            this.calendario.appendChild(dia);
        }
    }

    marcarDia(data) {
        const dataFormatada = data.toISOString().split('T')[0];
        const diaElemento = this.calendario.querySelector(`[data-data="${dataFormatada}"]`);
        
        if (diaElemento) {
            // Adicionar classe com animação
            diaElemento.className = 'dia';
            requestAnimationFrame(() => {
                diaElemento.classList.add('marcado', 'animando');
            });

            // Atualizar tooltip com resumo
            const nota = document.querySelector(`.nota[data-nota-id="${dataFormatada}"]`);
            const analise = this.analisesPorNota.get(dataFormatada);
            
            let resumo = `${data.toLocaleDateString('pt-BR')}`;
            if (nota?.dataset.anotacao) {
                resumo += `\n${nota.dataset.anotacao.slice(0, 50)}${nota.dataset.anotacao.length > 50 ? '...' : ''}`;
            }
            if (analise?.length > 0) {
                const totalCalorias = analise.reduce((sum, a) => sum + a.calorias, 0);
                resumo += `\n${totalCalorias} calorias`;
            }
            
            diaElemento.dataset.tooltip = resumo;
            
            this.diasMarcados.add(dataFormatada);
            this.salvarDiasMarcados();

            diaElemento.addEventListener('click', () => this.destacarNota(dataFormatada));
        }
    }

    destacarNota(dataId) {
        const nota = document.querySelector(`.nota[data-nota-id="${dataId}"]`);
        if (nota) {
            // Remover destaque de outras notas
            document.querySelectorAll('.nota').forEach(n => {
                n.style.zIndex = '1';
                n.classList.remove('saltando');
            });

            // Destacar a nota selecionada
            nota.style.zIndex = '5';
            nota.classList.remove('saltando');
            void nota.offsetWidth;
            nota.classList.add('saltando');

            // Remover a classe após a animação
            nota.addEventListener('animationend', () => {
                nota.classList.remove('saltando');
            }, { once: true });
        }
    }

    alternarTema() {
        const body = document.body;
        if (body.classList.contains('dark-mode')) {
            body.classList.replace('dark-mode', 'light-mode');
            this.toggleTheme.textContent = '☀️';
                    } else {
            body.classList.replace('light-mode', 'dark-mode');
            this.toggleTheme.textContent = '🌙';
        }
    }

    resetarCalendario() {
        if (this.primeiroReset) {
            // Primeiro reset: executa direto sem confirmação
            this.executarReset();
            this.primeiroReset = false;
            localStorage.setItem('primeiroReset', 'false');
        } else {
            // Mostrar dialog de confirmação
            this.resetDialog.style.display = 'flex';
            document.body.classList.add('dialog-open');
        }
    }

    executarReset() {
        // Limpar dados
        this.diasMarcados.clear();
        localStorage.removeItem('diasMarcados');
        localStorage.removeItem('ultimaNota');
        localStorage.removeItem('notas');
        localStorage.removeItem('analises'); // Precisamos adicionar esta linha
        
        // Remover notas da tela
        document.querySelectorAll('.nota').forEach(nota => nota.remove());
        
        // Limpar calendário
        document.querySelectorAll('.dia').forEach(dia => {
            dia.className = 'dia';
            dia.textContent = '';
        });
        document.body.classList.remove('dialog-open');
    }

    salvarDiasMarcados() {
        localStorage.setItem('diasMarcados', JSON.stringify(Array.from(this.diasMarcados)));
    }

    carregarDiasMarcados() {
        const diasSalvos = localStorage.getItem('diasMarcados');
        if (diasSalvos) {
            this.diasMarcados = new Set(JSON.parse(diasSalvos));
            this.diasMarcados.forEach(dataStr => {
                const diaElemento = this.calendario.querySelector(`[data-data="${dataStr}"]`);
                if (diaElemento) {
                    diaElemento.className = 'dia marcado';
                    // Adicionar evento de clique aos dias carregados
                    diaElemento.addEventListener('click', () => this.destacarNota(dataStr));
                }
            });
        }
    }

    mostrarDialogoInicial() {
        // Garantir que o diálogo esteja visível
        this.welcomeDialog.style.display = 'flex';
        document.body.classList.add('dialog-open');
        
        this.startButton.addEventListener('click', () => {
            // Animar a saída do diálogo
            this.welcomeDialog.style.opacity = '0';
            document.body.classList.remove('dialog-open');
            
            setTimeout(() => {
                this.welcomeDialog.style.display = 'none';
            }, 300);
            
            // Marcar que o usuário já visitou
            localStorage.setItem('visitedBefore', 'true');
        });
    }

    mostrarDicaReset() {
        const dica = document.createElement('div');
        dica.className = 'dica-reset';
        dica.innerHTML = `
            <div class="dica-conteudo">
                <p>Ei! Foi só um teste? 😉</p>
                <p>Você pode usar esse botão para resetar tudo e começar de verdade!</p>
                <button class="dica-button">Entendi!</button>
            </div>
            <div class="dica-seta"></div>
        `;

        document.body.appendChild(dica);

        // Posicionar a dica próxima ao botão de reset
        const resetBtn = document.getElementById('resetBtn');
        const resetRect = resetBtn.getBoundingClientRect();
        
        dica.style.position = 'fixed';
        dica.style.top = `${resetRect.bottom + 10}px`;
        dica.style.left = `${resetRect.left - 150}px`;

        // Animar entrada
        requestAnimationFrame(() => {
            dica.classList.add('visivel');
        });

        // Fechar a dica
        const fecharDica = () => {
            dica.classList.add('saindo');
            setTimeout(() => dica.remove(), 300);
        };

        dica.querySelector('.dica-button').addEventListener('click', fecharDica);
    }

    // Configurar eventos da dialog de reset
    configurarResetDialog() {
        this.confirmResetBtn.addEventListener('click', () => {
            this.executarReset();
            this.resetDialog.style.display = 'none';
        });
        
        this.cancelResetBtn.addEventListener('click', () => {
            this.resetDialog.style.display = 'none';
            document.body.classList.remove('dialog-open');
        });
    }

    // Salvar análise calórica
    salvarAnalise(notaId, analise) {
        this.analisesPorNota.set(notaId, analise);
        localStorage.setItem('analises', JSON.stringify(Array.from(this.analisesPorNota.entries())));
    }

    // Carregar análises salvas
    carregarAnalises() {
        const analisesSalvas = localStorage.getItem('analises');
        if (analisesSalvas) {
            this.analisesPorNota = new Map(JSON.parse(analisesSalvas));
        }
    }

    // Atualizar botão com estado de loading
    setLoadingState(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `
                <div class="spinner"></div>
                ${button.textContent}
            `;
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.innerHTML = button.textContent;
            button.classList.remove('loading');
        }
    }

    async abrirPainelAnotacao(nota) {
        const anotacaoAtual = nota.dataset.anotacao || '';
        const textarea = this.painelAnotacao.querySelector('.campo-anotacao');
        const salvarBtn = this.painelAnotacao.querySelector('.salvar-btn');
        const analiseLoading = this.painelAnotacao.querySelector('.analise-loading');
        const analiseVazia = this.painelAnotacao.querySelector('.analise-vazia');
        
        textarea.value = anotacaoAtual;
        
        let estadoAtual = {
            texto: anotacaoAtual,
            analise: this.analisesPorNota.get(nota.dataset.notaId),
            modificado: false
        };

        const atualizarBotaoSalvar = () => {
            const temTexto = textarea.value.trim().length > 0;
            const textoMudou = textarea.value.trim() !== estadoAtual.texto;
            salvarBtn.disabled = !temTexto || !textoMudou;
            salvarBtn.classList.toggle('disabled', !temTexto || !textoMudou);
        };

        // Debounce para análise
        const analisarTexto = () => {
            if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
            
            analiseLoading.style.display = 'flex';
            analiseVazia.style.display = 'none';
            this.listaAlimentos.style.display = 'none';
            
            this.debounceTimeout = setTimeout(() => {
                const texto = textarea.value.trim();
                const alimentos = this.analisarTexto(texto);
                
                analiseLoading.style.display = 'none';
                
                if (alimentos.length === 0) {
                    analiseVazia.style.display = 'block';
                    this.listaAlimentos.style.display = 'none';
                    this.totalCalorias.style.display = 'none';
                } else {
                    analiseVazia.style.display = 'none';
                    this.listaAlimentos.style.display = 'block';
                    this.totalCalorias.style.display = 'block';
                    this.atualizarAnaliseCalorias(alimentos);
                    this.salvarAnalise(nota.dataset.notaId, alimentos);
                    estadoAtual.analise = alimentos;
                }
            }, 500);
        };

        textarea.addEventListener('input', () => {
            estadoAtual.modificado = true;
            atualizarBotaoSalvar();
            analisarTexto();
        });

        salvarBtn.onclick = async () => {
            if (!textarea.value.trim()) return;
            
            const btnText = salvarBtn.querySelector('.btn-text');
            const btnSpinner = salvarBtn.querySelector('.spinner');
            
            btnText.style.opacity = '0';
            btnSpinner.style.display = 'block';
            salvarBtn.disabled = true;
            
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                nota.dataset.anotacao = textarea.value;
                const indicador = nota.querySelector('.nota-indicador');
                indicador.style.display = 'block';
                this.salvarAnotacoes();
                
                estadoAtual.texto = textarea.value.trim();
                estadoAtual.modificado = false;
                atualizarBotaoSalvar();
                
                // Feedback visual de sucesso
                btnText.textContent = 'Salvo com sucesso! 🎉';
                setTimeout(() => {
                    btnText.textContent = 'Guardar essa memória 💝';
                }, 2000);
            } finally {
                btnText.style.opacity = '1';
                btnSpinner.style.display = 'none';
                salvarBtn.disabled = false;
            }
        };

        this.painelAnotacao.classList.add('aberto');
        this.overlay.classList.add('visivel');

        const fecharBtn = this.painelAnotacao.querySelector('.fechar-painel');

        const fecharPainel = () => {
            this.painelAnotacao.classList.remove('aberto');
            this.overlay.classList.remove('visivel');
        };

        fecharBtn.onclick = fecharPainel;
        this.overlay.onclick = fecharPainel;

        textarea.focus();
    }

    salvarAnotacoes() {
        const anotacoes = {};
        document.querySelectorAll('.nota').forEach(nota => {
            if (nota.dataset.anotacao) {
                anotacoes[nota.dataset.notaId] = nota.dataset.anotacao;
            }
        });
        localStorage.setItem('anotacoes', JSON.stringify(anotacoes));
    }

    carregarAnotacoes() {
        const anotacoesSalvas = localStorage.getItem('anotacoes');
        if (anotacoesSalvas) {
            const anotacoes = JSON.parse(anotacoesSalvas);
            document.querySelectorAll('.nota').forEach(nota => {
                const id = nota.dataset.notaId;
                if (anotacoes[id]) {
                    nota.dataset.anotacao = anotacoes[id];
                }
            });
        }
    }

    analisarTexto(texto) {
        const alimentosEncontrados = [];
        const textoLower = texto.toLowerCase();
        
        // Padrão para encontrar números seguidos de alimentos
        // Exemplo: "2 brigadeiros", "meia pizza", "três hamburgueres"
        const numerosEscritos = {
            'um': 1, 'uma': 1,
            'dois': 2, 'duas': 2,
            'três': 3, 'tres': 3,
            'quatro': 4,
            'cinco': 5,
            'meia': 0.5, 'meio': 0.5
        };

        for (const [alimento, info] of Object.entries(ALIMENTOS_DB)) {
            // Procurar todas as ocorrências do alimento
            const regex = new RegExp(`(\\d+|${Object.keys(numerosEscritos).join('|')})\\s*(${alimento}s?|${alimento})`, 'gi');
            let match;
            let encontrado = false;

            while ((match = regex.exec(textoLower)) !== null) {
                encontrado = true;
                let quantidade = 1;

                if (match[1]) {
                    // Converter número escrito por extenso
                    if (numerosEscritos[match[1]]) {
                        quantidade = numerosEscritos[match[1]];
                    } else {
                        quantidade = parseInt(match[1]);
                    }
                }

                alimentosEncontrados.push({
                    nome: alimento,
                    quantidade: quantidade,
                    calorias: info.calorias * quantidade,
                    emoji: info.emoji
                });
            }

            // Se não encontrou com quantidade, procura sem
            if (!encontrado && textoLower.includes(alimento)) {
                alimentosEncontrados.push({
                    nome: alimento,
                    quantidade: 1,
                    calorias: info.calorias,
                    emoji: info.emoji
                });
            }
        }

        return alimentosEncontrados;
    }

    atualizarAnaliseCalorias(alimentos) {
        if (alimentos.length === 0) {
            this.analiseCalorias.style.display = 'none';
            return;
        }

        this.analiseCalorias.style.display = 'block';
        this.listaAlimentos.innerHTML = '';
        let total = 0;

        alimentos.forEach(alimento => {
            const item = document.createElement('div');
            item.className = 'alimento-item';
            item.innerHTML = `
                <span>
                    ${alimento.emoji}
                    <span class="alimento-nome">
                        ${alimento.quantidade > 1 ? `${alimento.quantidade}× ` : ''}${alimento.nome}
                    </span>
                </span>
                <span class="alimento-calorias">${alimento.calorias} kcal</span>
            `;
            this.listaAlimentos.appendChild(item);
            total += alimento.calorias;
        });

        this.totalCalorias.innerHTML = `<strong>${total} kcal</strong>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new FureiADieta();
    app.configurarResetDialog();
});

function createSmokeEffect(x, y) {
    const numParticles = 12;
    
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'smoke-particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Direção aleatória para cada partícula
        const angle = (i / numParticles) * 360;
        const distance = 50 + Math.random() * 30;
        const xMove = Math.cos(angle * Math.PI / 180) * distance;
        const yMove = Math.sin(angle * Math.PI / 180) * distance;
        
        particle.style.setProperty('--x', `${xMove}px`);
        particle.style.setProperty('--y', `${yMove}px`);
        
        document.body.appendChild(particle);
        
        // Animar e remover
        particle.style.animation = 'smoke 0.8s ease-out forwards';
        setTimeout(() => particle.remove(), 800);
    }
}

// Quando uma nota for removida
function removeNota(nota) {
    const rect = nota.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    createSmokeEffect(x, y);
    nota.remove();
}

// Para controlar a tooltip da primeira nota
let isFirstNote = true;

function showFirstNoteTooltip() {
    if (isFirstNote) {
        const tooltip = document.getElementById('firstNoteTooltip');
        setTimeout(() => {
            tooltip.classList.add('show');
        }, 800); // Delay de 0.8s após a primeira nota ser criada
        
        isFirstNote = false;
    }
}

// Para o botão de reset na primeira vez
let isFirstReset = true;

function handleReset() {
    if (isFirstReset) {
        // Não mostra confirmação na primeira vez
        resetCalendar();
        isFirstReset = false;
    } else {
        // Mostra confirmação nas próximas vezes
        showResetConfirmation();
    }
}