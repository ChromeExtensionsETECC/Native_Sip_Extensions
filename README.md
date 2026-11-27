# Native SIP Extensions

Extensões do navegador (Chrome e Edge) da ETECC para o softphone do agente no Native Infinity.

| Extensão | O que faz | Versão |
|---|---|---|
| [SIP Agent Booster](sip-agent-booster/) | Indicador de qualidade, alertas de chamada, atalhos, mini-telefone flutuante (PiP) com temas, atendimento automático opcional, e visual renovado do login, das filas e do histórico | 0.7.4 |

## Baixar e instalar

### Opção 1: baixar o ZIP (mais simples)
1. Abra a pasta [`download/`](download/) e baixe o `sip-agent-booster-<versão>.zip` mais novo (botão **Download raw file**).
2. Extraia numa pasta fixa, por exemplo `C:\Extensoes\sip-agent-booster` (não apague nem mova depois).
3. Abra `chrome://extensions` (no Edge: `edge://extensions`), ligue o **Modo do desenvolvedor**, clique em **Carregar sem compactação** e escolha a pasta extraída.
4. Recarregue a página do agente (F5).

O passo a passo completo, com solução de problemas, está em [`download/INSTALACAO.md`](download/INSTALACAO.md) (ou `INSTALACAO.txt`, para o Bloco de Notas).

### Opção 2: pelo Git (atualiza com `git pull`)
Pré-requisito: [Git](https://git-scm.com) instalado e acesso a este repositório.

```powershell
git clone https://github.com/ChromeExtensionsETECC/Native_Sip_Extensions.git C:\Extensoes\Native_Sip_Extensions
```

Em `chrome://extensions`, **Carregar sem compactação** e escolha a subpasta `C:\Extensoes\Native_Sip_Extensions\sip-agent-booster` (a que tem o `manifest.json`).

## Atualizar para uma versão nova
- **Com Git:** feche a página do agente, rode `git pull` na pasta clonada, clique no botão de recarregar (seta circular) no cartão da extensão em `chrome://extensions` e dê F5 na página do agente.
- **Com ZIP:** apague o conteúdo da pasta antiga, extraia o ZIP novo **na mesma pasta**, recarregue a extensão e a página.

A versão instalada aparece no cartão da extensão. As novidades de cada versão aparecem na lateral da tela de login do Native.

## Para quem mantém
- Código em `sip-agent-booster/`. Antes de lançar: suba `version` no `manifest.json`, acrescente a entrada no topo de `changelog.js` e atualize o número nos manuais.
- Gere o ZIP com os arquivos da extensão (o `manifest.json` precisa ficar na raiz do ZIP) e coloque em `download/`, trocando o ZIP antigo pelo novo.
- Marque cada entrega com uma tag, por exemplo `git tag v0.7.4 && git push --tags`.
- A extensão depende do desenho atual da tela do Native. Se o Native for atualizado e algo deixar de funcionar, os ajustes costumam ser nos seletores e classes dos arquivos `*.js` e `*.css`.

## Observações
- Funciona só em `eteccnet.native-infinity.com.br` e não envia nenhum dado para fora.
- O mini-telefone flutuante exige Chrome ou Edge 116 ou mais novo.
- No Chrome, ao abrir, pode aparecer o aviso "Desative as extensões do modo de desenvolvedor". Clique em Cancelar: é normal nesse tipo de instalação.
