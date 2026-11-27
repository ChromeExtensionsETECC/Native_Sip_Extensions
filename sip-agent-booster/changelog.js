// Histórico de versões mostrado na tela de login. Mais novo primeiro.
// Ao lançar uma versão nova: acrescente uma entrada no topo e suba "version" no manifest.json.
window.SIPB_CHANGELOG = [
  { v: "0.7.4", items: [
    "Mini-telefone: o número do visor agora pode ser selecionado e copiado",
    "Novo botão (e Alt+C) copia o número já formatado, ex.: (13) 98821-1137; Shift copia só os dígitos",
  ] },
  { v: "0.7.3", items: [
    "Histórico: ligações perdidas em vermelho suave, atendidas em verde suave, com faixa lateral",
    "Fila e histórico: coluna da fila em destaque e linhas mais espaçadas",
  ] },
  { v: "0.7.2", items: [
    "Corrigido: o indicador de qualidade cobria o telefone da barra inferior; agora fica acima da barra",
  ] },
  { v: "0.7.1", items: [
    "O indicador de qualidade pode ser arrastado para qualquer parte da tela (duplo clique volta ao canto)",
  ] },
  { v: "0.7.0", items: [
    "Fila e histórico de chamadas renovados: tabelas mais limpas e aviso quando a lista está vazia",
    "Na fila, chamadas esperando 1 min ficam amarelas e a partir de 3 min ficam vermelhas",
  ] },
  { v: "0.6.0", items: [
    "Modal de seleção de filas renovado, com busca, contadores e filas ativas em destaque",
  ] },
  { v: "0.5.0", items: [
    "Tela de login renovada: fundo com a marca, painel moderno e esta lista de novidades",
  ] },
  { v: "0.4.0", items: [
    "Atendimento automático (opcional, desligado por padrão) com tempo ajustável nas opções",
    "O mini-telefone mostra a contagem “Atende sozinho em N s”",
  ] },
  { v: "0.3.4", items: [
    "Botões de atender e desligar sempre visíveis no mini-telefone",
  ] },
  { v: "0.3.3", items: [
    "Corrigido o botão de atender que sumia com o discador aberto",
  ] },
  { v: "0.3.2", items: [
    "Detecção de chamada tocando mais confiável",
  ] },
  { v: "0.3.1", items: [
    "O mini-telefone escala com o tamanho da janela, com novo modo micro",
  ] },
  { v: "0.3.0", items: [
    "Temas de cor no mini-telefone, visor de vidro e campo só numérico",
  ] },
  { v: "0.2.1", items: [
    "Três visualizações do teclado: completo, só * e #, só visor e botões",
  ] },
  { v: "0.2.0", items: [
    "Barra de captação do microfone, para saber se está mudo ou pegando ruído",
  ] },
  { v: "0.1.0", items: [
    "Primeira versão: indicador de qualidade, alertas, atalhos e mini-telefone flutuante",
    "Pausa com motivo e tempo, transferências e canais 1 a 4 no mini-telefone",
  ] },
];
