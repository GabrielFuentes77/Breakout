# Breakout 2.0

Projeto acadêmico desenvolvido com HTML5, CSS3, Canvas e JavaScript puro.

## Recursos do jogo

- Cinco níveis progressivos e seleção de fases desbloqueadas
- Nome do jogador e recordes separados por dificuldade
- Multiplicadores de pontuação: Fácil ×1, Normal ×1,5 e Difícil ×2
- Dificuldades Fácil, Normal e Difícil
- Controles independentes por teclado ou mouse
- Lançamento manual da bola após cada vida
- Blocos normais, resistentes, explosivos, bônus e indestrutíveis
- Power-ups de vida, multibola, bola lenta, bola perfurante e alteração da plataforma
- Sistema de combo e multiplicador de pontos
- Recorde e progresso salvos no navegador com `localStorage`
- Partículas, efeitos de impacto, som, pausa e tela cheia
- Configurações de volume, sensibilidade, velocidade e efeitos visuais
- Vidas representadas por corações
- Tela principal simplificada, mantendo os recordes em destaque
- Identificação do jogador, dificuldade e fase solicitadas após clicar em Iniciar
- Escolha entre teclado e mouse localizada nas Configurações

## Estrutura

```text
Breakout/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── storage.js   # recorde, progresso e configurações
    ├── levels.js    # níveis, formatos e tipos de blocos
    ├── audio.js     # efeitos sonoros
    ├── controls.js  # teclado, mouse e lançamento
    └── game.js      # regras, física, colisões e renderização
```

## Controles

- `←` e `→` ou `A` e `D`: mover a plataforma
- `Espaço`, `Enter` ou clique: lançar a bola
- `P` ou `Esc`: pausar e continuar

## Executar

Abra `index.html` diretamente ou dê dois cliques em `INICIAR-JOGO.cmd`.

No VS Code, abra a pasta `C:\Projetos\Breakout`.
