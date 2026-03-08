

## Plan: Agente ODB Inteligente com Conversa Contínua

### Problema Atual
O agente ODB faz uma chamada de IA isolada por interação -- sem memória de conversa. Ele não consegue:
- Manter contexto entre mensagens
- Perguntar e seguir perguntando até ter dados completos
- Identificar cenários (entrada de carro, pagamento atrasado, peça comprada) de forma inteligente
- Confirmar associações com veículos existentes no sistema

### Solução: Conversa Multi-turno com Contexto do Sistema

#### 1. Edge Function `odb-processar` -- Reescrever com Histórico de Conversa

Mudar de single-shot para multi-turn:
- Receber array `history` (mensagens anteriores do chat) junto com a mensagem atual
- Enviar todo o histórico para a IA, para que ela tenha contexto completo
- Melhorar o system prompt para ser conversacional:
  - Identificar automaticamente qualquer tipo de documento/foto
  - Falar com o operador como um colega, pedindo o que falta
  - Classificar cenários: **entrada** (carro autorizado, aguardando), **saída** (pagamento feito), **peça avulsa** (nota de fornecedor para abater), **despesa**, **correção**
  - Quando a IA identificar algo mas faltar dados, ela RESPONDE COM TEXTO conversacional + JSON parcial (não só JSON)
- Novo formato de resposta: `{ "tipo": "mensagem"|"acao", "mensagem": "texto conversacional", "acao"?: { dados estruturados }, "precisa_confirmar": bool }`

#### 2. Frontend `ODBPage.tsx` -- Chat Inteligente de Verdade

- Enviar **todo o histórico de mensagens** na chamada ao edge function (últimas 20 mensagens)
- Suportar respostas mistas: texto conversacional da IA + cards de ação quando apropriado
- Quando a IA pedir confirmação, mostrar botões contextuais
- Quando a IA identificar um cenário (entrada, saída, peça), mostrar card adequado com status
- Permitir enviar foto/áudio a qualquer momento da conversa (não só no início)
- A IA pode dizer "Recebi a foto. Parece ser uma nota de peças do fornecedor X com 3 itens. Isso é para o Corolla do João que está na oficina?" -- conversa natural

#### 3. System Prompt Reformulado

O prompt será reescrito para instruir a IA a:
- Sempre responder de forma conversacional em português
- Identificar qualquer tipo de imagem (orçamento, NF, foto de peça, anotação, PDF, recibo)
- Perguntar o que falta de forma natural ("Vi que é uma nota de R$450. Essa peça é para qual carro?")
- Informar o que entendeu ("Entendi que o Gol do cliente Maria fez troca de buchas dianteiras por R$180")
- Usar dados do banco (veículos ativos, clientes recentes) para sugerir associações
- Retornar JSON estruturado APENAS quando tiver dados suficientes para salvar
- Manter duplo formato: `mensagem` (texto para o chat) + `dados` (JSON quando pronto para salvar)
- Gerenciar status: `entrada` (carro chegou), `em_andamento`, `finalizado` (pronto para pagamento)

#### 4. Fluxo de Status de Veículo

Adicionar ao `lancamentos` o conceito de status mais inteligente:
- A IA detecta se é entrada de carro ("autorizado", "vai fazer") → salva com status `em_andamento`
- Se é pagamento retroativo ("esqueceu de dar entrada") → salva como `finalizado` direto
- Se é peça de fornecedor → associa ao lançamento existente do veículo

### Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `supabase/functions/odb-processar/index.ts` | Reescrever para multi-turn, novo prompt conversacional, novo formato de resposta |
| `src/pages/ODBPage.tsx` | Enviar histórico, renderizar respostas conversacionais mistas (texto + cards), fluxo contínuo |

### Detalhes Técnicos

- O histórico enviado terá no máximo 20 mensagens para não exceder limites de token
- Cada mensagem com imagem terá apenas a referência (não reenvia base64 no histórico)
- A resposta da IA terá formato: `{ mensagem: string, dados?: object, botoes?: array, salvar?: boolean }`
- Quando `salvar: true`, o frontend mostra card de confirmação final
- Quando `salvar: false`, mostra apenas a mensagem e aguarda input

