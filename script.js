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
    }

    tornarArrastavel(elemento) {
        let offsetX, offsetY;
        let isDragging = false;
        let ultimasBolinhasAfetadas = new Set();

        elemento.addEventListener('mousedown', (e) => {
            isDragging = true;
            elemento.classList.add('dragging');
            
            const rect = elemento.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            e.preventDefault();
            
            const pratoRect = this.btnPrato.getBoundingClientRect();
            const notaRect = elemento.getBoundingClientRect();
            
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;

            if (this.verificarSobreposicao(
                {x, y, width: notaRect.width, height: notaRect.height},
                pratoRect
            )) {
                return;
            }

            elemento.style.left = `${x}px`;
            elemento.style.top = `${y}px`;

            // Efeito líquido nas bolinhas
            const bolinhasAtuais = new Set();
            document.querySelectorAll('.dia').forEach(bolinha => {
                const bolinhaRect = bolinha.getBoundingClientRect();
                const centro = {
                    x: bolinhaRect.left + bolinhaRect.width / 2,
                    y: bolinhaRect.top + bolinhaRect.height / 2
                };

                const distancia = Math.hypot(
                    centro.x - (x + notaRect.width / 2),
                    centro.y - (y + notaRect.height / 2)
                );

                if (distancia < 100) { // Área de influência
                    bolinhasAtuais.add(bolinha);
                    
                    // Calcular direção do efeito
                    const angulo = Math.atan2(
                        centro.y - (y + notaRect.height / 2),
                        centro.x - (x + notaRect.width / 2)
                    ) * 180 / Math.PI;

                    // Remover classes anteriores
                    bolinha.classList.remove(
                        'liquido-top', 'liquido-bottom', 
                        'liquido-left', 'liquido-right',
                        'liquido-top-left', 'liquido-top-right',
                        'liquido-bottom-left', 'liquido-bottom-right'
                    );

                    // Adicionar classe baseada na direção
                    if (angulo > -22.5 && angulo <= 22.5) bolinha.classList.add('liquido-right');
                    else if (angulo > 22.5 && angulo <= 67.5) bolinha.classList.add('liquido-bottom-right');
                    else if (angulo > 67.5 && angulo <= 112.5) bolinha.classList.add('liquido-bottom');
                    else if (angulo > 112.5 && angulo <= 157.5) bolinha.classList.add('liquido-bottom-left');
                    else if (angulo > 157.5 || angulo <= -157.5) bolinha.classList.add('liquido-left');
                    else if (angulo > -157.5 && angulo <= -112.5) bolinha.classList.add('liquido-top-left');
                    else if (angulo > -112.5 && angulo <= -67.5) bolinha.classList.add('liquido-top');
                    else if (angulo > -67.5 && angulo <= -22.5) bolinha.classList.add('liquido-top-right');

                    bolinha.classList.add('liquido');
                }
            });

            // Restaurar bolinhas que não estão mais sob influência
            ultimasBolinhasAfetadas.forEach(bolinha => {
                if (!bolinhasAtuais.has(bolinha)) {
                    bolinha.classList.remove(
                        'liquido',
                        'liquido-top', 'liquido-bottom', 
                        'liquido-left', 'liquido-right',
                        'liquido-top-left', 'liquido-top-right',
                        'liquido-bottom-left', 'liquido-bottom-right'
                    );
                }
            });

            ultimasBolinhasAfetadas = bolinhasAtuais;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            elemento.classList.remove('dragging');
            
            // Restaurar todas as bolinhas
            ultimasBolinhasAfetadas.forEach(bolinha => {
                bolinha.classList.remove(
                    'liquido',
                    'liquido-top', 'liquido-bottom', 
                    'liquido-left', 'liquido-right',
                    'liquido-top-left', 'liquido-top-right',
                    'liquido-bottom-left', 'liquido-bottom-right'
                );
            });
            ultimasBolinhasAfetadas.clear();
        });
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
        if (confirm('Tem certeza que deseja resetar o calendário? Todas as marcações serão perdidas.')) {
            this.diasMarcados.clear();
            localStorage.removeItem('diasMarcados');
            localStorage.removeItem('ultimaNota');
            
            document.querySelectorAll('.nota').forEach(nota => nota.remove());
            
            document.querySelectorAll('.dia').forEach(dia => {
                dia.className = 'dia';
                dia.textContent = '';
            });
        }
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
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new FureiADieta();
});