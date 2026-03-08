

## Plan: Agente ODB -- Overhaul Completo

Este plano cobre a refatoracao completa do Agente ODB em 2 arquivos principais + melhorias no modelo de IA.

### 1. Edge Function `odb-processar` -- Prompt e Modelo

**Mudancas:**
- Trocar modelo de `google/gemini-2.5-flash` para `google/gemini-2.5-pro` (melhor para visao/imagens e raciocinio complexo)
- Reescrever o SYSTEM_PROMPT completo com foco em:
  - Personalidade conversacional real (como colega de oficina)
  - Instrucoes especificas para OCR de orçamentos manuscritos (abreviacoes de mecanico)
  - Classificacao automatica de pecas (fabricada vs comprada vs recuperada) sem perguntar
  - Cruzamento ativo com dados do banco (clientes, veiculos, precos historicos)
  - Regra: mostrar o que entendeu ANTES de pedir confirmacao
  - Regra: perguntar APENAS o que falta, nunca tudo de uma vez
  - Deteccao de padroes (retrabalho <30 dias, preco abaixo custo, atraso)
  - Sugestao de servicos complementares baseado no historico
  - Formato de resposta com campo `loading_steps` para etapas visuais
- Adicionar mais contexto ao prompt dinamico:
  - Incluir lancamentos dos ultimos 30 dias (nao so em_andamento) para detectar retrabalho
  - Incluir veiculos com cliente_id vinculado para match mais inteligente

### 2. Frontend `ODBPage.tsx` -- Refatoracao Completa

**Welcome message inteligente:**
- Ao abrir, buscar lancamentos `em_andamento` do banco
- Mostrar banner com carros na oficina (com dias de permanencia, badges de alerta)
- Se nenhum carro: mensagem simples

**Loading states visuais (etapas):**
- Ao processar foto/audio, mostrar progresso em etapas animadas:
  1. "Recebendo imagem..." (icone camera)
  2. "Analisando conteudo..." (icone lupa com animacao)
  3. "Identificando pecas e valores..." (icone engrenagem)
  4. "Cruzando com banco de dados..." (icone database)
  5. "Pronto!" (icone check)
- Cada etapa com crossfade suave usando framer-motion

**Melhorias visuais no chat:**
- Bolhas do ODB com borda amber sutil
- Cards estruturados com melhor formatacao (resumo financeiro com box visual)
- Chips de resposta rapida com scroll horizontal
- Fotos clicaveis para fullscreen (dialog)
- Melhor tipografia e espacamento

**Fluxo de pagamento visual:**
- Quando ODB retorna botoes de pagamento, renderizar como chips visuais (PIX, Dinheiro, Debito, Credito)
- Para credito: chips de parcelas
- Para misto: campos de valor split

**Botoes de acao rapida no input:**
- 4 botoes: Foto | Audio | Nota de pecas | Despesa
- Visualmente distintos com icones

### 3. Banco de Dados -- Sem mudancas de schema

O schema atual ja suporta tudo necessario:
- `lancamentos.status` ja aceita valores como `em_andamento`, `finalizado`
- `odb_conhecimento_pecas` ja existe para aprendizado
- `odb_sinonimos` ja existe para correcao ortografica

### Arquivos a Modificar

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/odb-processar/index.ts` | Reescrever prompt, trocar modelo para gemini-2.5-pro, adicionar mais contexto, melhorar parsing |
| `src/pages/ODBPage.tsx` | Welcome inteligente com carros em andamento, loading states animados, UI premium, chips de pagamento, fullscreen foto |

### Escopo Nao Incluido (para proximo ciclo)
- Tela de servicos pendentes separada (nova pagina)
- Popup de detalhe do cliente com historico completo
- Streaming de resposta

