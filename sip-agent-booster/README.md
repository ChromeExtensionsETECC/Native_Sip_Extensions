# SIP Agent Booster

Extensão Chrome/Edge (Manifest V3) para o softphone SIP do agente em `eteccnet.native-infinity.com.br`.

## Instalar
1. Abra `chrome://extensions` (ou `edge://extensions`) e ative o **Modo do desenvolvedor**.
2. **Carregar sem compactação** e escolha esta pasta.
3. Recarregue a página do agente.

## Instalar e atualizar
O passo a passo (ZIP ou Git), a atualização e as notas para quem mantém ficam no [README da raiz do repositório](../README.md).
Com Git, carregue **esta pasta** (`sip-agent-booster`, a que tem o `manifest.json`) em `chrome://extensions`.

## Recursos
- **HUD de qualidade**: RTT, jitter, perda de pacotes, MOS estimado e duração, lidos do WebRTC (`getStats`). Clique no HUD para ver detalhes.
- **Alertas**: bipe, título piscando e notificação do sistema com chamada entrando. Também avisa quando a qualidade cai ou o áudio some.
- **Atalhos** (configuráveis): Alt+A atender, Alt+H desligar, Alt+M mudo, Alt+D foco no discador.
- **Mini-telefone flutuante (PiP)**: botão ⧉ no indicador ou Alt+P abre uma janela sempre visível, por cima de qualquer guia ou aplicativo, com discador, Ligar, Atender, Desligar, Mudo, status e qualidade. Exige Chrome/Edge 116+ e que a guia do agente continue aberta (pode ficar em segundo plano).
- **Click-to-call**: duplo clique em um número copia os dígitos para o campo de discagem.

## Ajuste fino
Os botões são achados pelo texto, title ou aria-label (atender, desligar, mudo…). Se algum não for achado, informe o seletor CSS nas opções da extensão.

## Validado na página real
Indicador de qualidade, alerta de chamada entrando (bipe, título e notificação), Alt+A e Alt+H.

## Pendente
- Testar Alt+M (mudo via WebRTC), Alt+D, Alt+Enter e o duplo clique em número.
