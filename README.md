# Simcuit

> Este repositório é um projeto de portfólio e também um experimento de implementação de um editor e motor simples de circuitos digitais sem dependências externas de runtime.

**Simcuit** é um simulador visual de circuitos digitais executado no navegador. O projeto permite montar circuitos com portas lógicas, conectar sinais em um canvas 2D e observar a propagação dos valores em tempo real.

## Demonstração

```bash
npx serve index.html
```

## Funcionalidades

- Editor visual baseado em Canvas 2D.
- Criação e movimentação de componentes.
- Conexão de pinos por fios com segmentos ortogonais.
- Simulação de valores binários entre componentes.
- Modos de edição e interação.
- Zoom com a roda do mouse e navegação pelo canvas.
- Nomeação de componentes.
- Rotação de componentes.
- Exclusão de componentes, juntas e fios.
- Copiar, recortar e colar componentes.
- Salvamento automático do circuito e da posição da câmera no `localStorage`.
- Exportação e importação de circuitos em JSON.
- Circuitos integrados compostos por outros circuitos, permitindo reutilizar módulos.

## Componentes disponíveis

- `IN`, `OUT`, `BUF`, `NOT`, `AND`, `NAND`, `OR`, `NOR`, `XOR` e `XNOR`
- Versão de três entradas de `AND`, `NAND`, `OR` e `NOR`
- Display de sete segmentos
- Circuito integrado (`IC`) definido a partir de outro arquivo de circuito.

## Como usar

1. Use os botões do painel para adicionar componentes.
2. Arraste um componente para reposicioná-lo.
3. Clique e arraste a partir de um pino ou junta para criar um fio.
4. Use a roda do mouse para aproximar ou afastar a visualização.
5. Use **Interagir** para ocultar o painel e operar o circuito.
6. Clique em uma entrada para alternar seu valor lógico.
7. Use **Salvar arquivo** para exportar o circuito atual.
8. Use **Carregar arquivo** para importar um circuito.

### Atalhos

| Atalho | Ação |
| --- | --- |
| `Delete` ou `Backspace` | Excluir o elemento selecionado |
| `Esc` | Cancelar a criação de um fio |
| `Ctrl` + `Espaço` | Rotacionar o componente selecionado |
| `Ctrl` + `C` | Copiar o componente selecionado |
| `Ctrl` + `X` | Recortar o componente selecionado |
| `Ctrl` + `V` | Colar o componente copiado |

## O núcleo do projeto está organizado em algumas abstrações pequenas:

- [`engine.ts`](engine.ts): controla o canvas, entrada do usuário, seleção, edição, simulação e renderização.
- [`utils.ts`](utils.ts): define o modelo serializável de um circuito e funções geométricas auxiliares.
- [`io.ts`](io.ts): implementa juntas e pinos, incluindo conexões e propagação de valores.
- [`wire.ts`](wire.ts): representa uma conexão entre dois pontos do circuito.
- [`component.ts`](component.ts): define o comportamento visual e geométrico comum aos componentes.
- [`builtin`](builtin/): reúne as implementações das portas lógicas, entradas, saídas, display e circuitos integrados.
- [`index.ts`](index.ts): inicializa a aplicação, registra a interface e persiste o estado local.

A simulação usa componentes que leem e escrevem valores nos pinos. As juntas conectadas formam uma rede, e o valor observado na rede é atualizado quando os sinais mudam.

## Tecnologias

- TypeScript & JavaScript
- HTML5 Canvas 2D

## Estado do projeto

O simulador está funcional como protótipo exploratório e peça de portfólio. Algumas áreas ainda podem evoluir, como histórico desfazer/refazer, testes automatizados, uma pipeline de build reproduzível e uma interface de edição mais acessível, incluindo suporte mobile.
