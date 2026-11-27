# SIP Agent Booster — instalação

Extensão para o Chrome e o Edge que melhora o softphone do agente no Native Infinity.
Ela só funciona em `eteccnet.native-infinity.com.br` e não envia nenhum dado para fora.

## Requisitos
- Google Chrome ou Microsoft Edge, versão **116 ou mais nova** (o mini-telefone flutuante depende disso).
- Para ver a versão: abra `chrome://settings/help` (ou `edge://settings/help`).

## Instalar

1. **Extraia o ZIP** `sip-agent-booster-0.7.4.zip` para uma pasta que você não vai apagar, por exemplo `C:\Extensoes\sip-agent-booster`.
   Não apague nem mova essa pasta depois: o navegador lê a extensão dela.
2. Abra `chrome://extensions` (no Edge: `edge://extensions`).
3. Ligue o **Modo do desenvolvedor** (canto superior direito no Chrome, menu à esquerda no Edge).
4. Clique em **Carregar sem compactação** e escolha a pasta extraída (a que tem o arquivo `manifest.json` dentro).
5. A extensão **SIP Agent Booster** aparece na lista. Para deixá-la à mão, clique no ícone de quebra-cabeça da barra e no alfinete ao lado dela.
6. **Recarregue** a página do agente (F5) e faça login normalmente.

Se aparecer o aviso "Desative as extensões do modo de desenvolvedor", clique em **Cancelar** ou no X. É normal nesse tipo de instalação.

## Como usar

**Indicador de qualidade** (canto inferior direito da página): mostra a qualidade da chamada em tempo real (RTT, jitter, perda e nota MOS). Verde é boa, amarelo é regular e vermelho é ruim. Clique nele para ver os detalhes.

**Mini-telefone flutuante:** clique no botão **⧉** do indicador, ou aperte **Alt+P**, para abrir uma janela pequena que fica por cima de qualquer guia ou programa. Nela você pode:
- discar (digite o número e aperte Enter) e trocar de canal 1 a 4;
- atender, desligar, mutar e transferir (escolha o contato e confirme);
- ver o status, o cronômetro e a qualidade da chamada;
- pausar escolhendo o motivo, e encerrar a pausa com **▶ Encerrar pausa**. Em pausa, o visor mostra o motivo e o tempo restante.

A janela fica meio transparente e só fica nítida quando o mouse passa por cima.
Mantenha **a guia do agente aberta** (pode ficar em segundo plano): se ela for fechada, a janela flutuante fecha junto.

**Atalhos de teclado** (na página do agente):

| Atalho | Ação |
|---|---|
| Alt+P | Abrir o mini-telefone |
| Alt+A | Atender chamada que está tocando |
| Alt+H | Desligar |
| Alt+M | Mutar / ativar microfone |
| Alt+D | Ir para o campo de discagem |
| Alt+Enter | Ligar |

**Alertas:** quando uma chamada entra, a extensão toca um bipe, faz o título da aba piscar com "CHAMADA!" e mostra uma notificação do sistema. Clicar na notificação volta para a aba. Ela também avisa quando a qualidade cai ou o áudio some.

## Opções
Clique no ícone da extensão. Lá dá para ligar ou desligar cada recurso, trocar os atalhos e ajustar os limites de alerta de qualidade.

**Atendimento automático** (vem desligado): se ativar, a chamada que tocar por 10 segundos (o tempo é ajustável) é atendida sozinha no seguinte. Cada pessoa liga ou desliga o seu.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| Não aparece o indicador na página | Recarregue a página (F5). Confirme em `chrome://extensions` que a extensão está ligada. |
| O botão ⧉ diz que o mini-telefone está indisponível | O navegador está desatualizado: precisa ser a versão 116 ou mais nova. |
| Não aparecem notificações | Veja se as notificações do Chrome estão liberadas no Windows (Configurações, Sistema, Notificações). |
| A janela flutuante some | A guia do agente foi fechada ou recarregada. Abra de novo com Alt+P. |
| Algo parou de funcionar depois de uma atualização do Native | A extensão depende do desenho da tela do Native. Avise o responsável pela extensão, informando o que falhou. |
| O navegador pede para desativar a extensão ao abrir | Veja a observação do passo 6 acima. |

## Atualizar para uma versão nova
1. Feche a página do agente.
2. Apague o conteúdo da pasta antiga e extraia o novo ZIP **na mesma pasta**.
3. Em `chrome://extensions`, clique no botão de recarregar (seta circular) no cartão da extensão.
4. Recarregue a página do agente.

## Desinstalar
Em `chrome://extensions`, clique em **Remover** no cartão da extensão.
