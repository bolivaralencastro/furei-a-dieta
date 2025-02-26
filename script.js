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
        this.confirmResetBtn = document.getElementById('confirmReset');
        this.cancelResetBtn = document.getElementById('cancelReset');

        // Verificar se é a primeira visita
        if (!localStorage.getItem('visitedBefore')) {
            this.mostrarDialogoInicial();
        } else {
            // Se não for a primeira visita, esconder o diálogo
            this.welcomeDialog.style.display = 'none';
        }

        this.inicializar();
    }

    inicializar() {
        this.criarCalendario();
        this.configurarEventos();
        this.carregarDiasMarcados();
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

    criarNota() {
        const hoje = new Date().toLocaleDateString();
        const ultimaNota = localStorage.getItem('ultimaNota');

        if (ultimaNota === hoje) {
            alert('Você já registrou uma nota hoje!');
            return;
        }

        const nota = document.createElement('div');
        nota.className = 'nota';
        
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR');
        const horaFormatada = agora.toLocaleTimeString('pt-BR');
        
        nota.innerHTML = `
            <div class="timestamp">${dataFormatada} - ${horaFormatada}</div>
            <div>Ops... Furei a dieta! 🍽️</div>
        `;

        const rotacao = Math.random() * 20 - 10;
        nota.style.setProperty('--rotacao', `${rotacao}deg`);

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

        nota.style.left = `${x}px`;
        nota.style.top = `${y}px`;

        document.body.appendChild(nota);
        
        // Adicionar id único para a nota baseado na data
        const dataId = agora.toISOString().split('T')[0];
        nota.dataset.notaId = dataId;

        // Marcar o dia primeiro
        this.marcarDia(agora);

        // Tornar arrastável após um pequeno delay para a animação de entrada
        setTimeout(() => {
            this.tornarArrastavel(nota);
        }, 500); // Espera a animação de flutuar terminar

        localStorage.setItem('ultimaNota', hoje);

        // Se for a primeira nota, mostrar dica de reset
        if (!this.primeiraNotaCriada) {
            this.mostrarDicaReset();
            this.primeiraNotaCriada = true;
            localStorage.setItem('primeiraNotaCriada', 'true');
        }
    }

    tornarArrastavel(elemento) {
        let posicaoAtual = { x: 0, y: 0 };
        let posicaoInicial = { x: 0, y: 0 };

        elemento.style.cursor = 'grab'; // Cursor indicando que pode arrastar

        elemento.addEventListener('mousedown', iniciarArrasto);
        
        function iniciarArrasto(e) {
            e.preventDefault();
            
            // Atualiza o estilo do cursor
            elemento.style.cursor = 'grabbing';
            
            // Pega a posição inicial do mouse
            posicaoInicial.x = e.clientX - posicaoAtual.x;
            posicaoInicial.y = e.clientY - posicaoAtual.y;
            
            // Adiciona os listeners de movimento e soltura
            document.addEventListener('mousemove', arrastar);
            document.addEventListener('mouseup', pararArrasto);
            
            // Aumenta o z-index durante o arrasto
            elemento.style.zIndex = '1000';
        }
        
        function arrastar(e) {
            e.preventDefault();
            
            // Calcula a nova posição
            posicaoAtual.x = e.clientX - posicaoInicial.x;
            posicaoAtual.y = e.clientY - posicaoInicial.y;
            
            // Aplica a nova posição
            elemento.style.left = posicaoAtual.x + 'px';
            elemento.style.top = posicaoAtual.y + 'px';
        }
        
        function pararArrasto() {
            // Restaura o cursor
            elemento.style.cursor = 'grab';
            
            // Remove os listeners
            document.removeEventListener('mousemove', arrastar);
            document.removeEventListener('mouseup', pararArrasto);
            
            // Restaura o z-index original
            elemento.style.zIndex = '1';
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
            diaElemento.className = 'dia marcado';
            this.diasMarcados.add(dataFormatada);
            this.salvarDiasMarcados();

            // Adicionar evento de clique
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
            nota.classList.remove('saltando'); // Remove primeiro para poder adicionar novamente
            void nota.offsetWidth; // Força um reflow
            nota.classList.add('saltando');
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
        this.diasMarcados.clear();
        localStorage.removeItem('diasMarcados');
        localStorage.removeItem('ultimaNota');
        
        document.querySelectorAll('.nota').forEach(nota => nota.remove());
        
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
        });
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