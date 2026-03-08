

## Plan: Catálogo Inteligente de Peças e Serviços

### Situação Atual
A página `/pecas` existe mas foca apenas em notas fiscais, carros na oficina e solicitações. Não existe um **catálogo de peças com preços** nem uma seção de **serviços com tempo médio de mão de obra**. A tabela `odb_conhecimento_pecas` e `odb_conhecimento_servicos` já existem no banco e são alimentadas automaticamente pelo ODB, mas não há UI para consultar esses dados.

### O Que Será Feito

Refatorar `PecasPage.tsx` adicionando 2 novas abas ao sistema de tabs existente:

**1. Aba "Catálogo de Peças"** (nova)
- Lista todas as peças da tabela `odb_conhecimento_pecas` agrupadas por tipo (fabricada/comprada/recuperação)
- Cada card mostra: nome normalizado, veículo (marca/modelo), valor médio cobrado, custo médio, margem média, total de lançamentos
- Badges visuais: verde "Fabricada", azul "Comprada", amarelo "Recuperação"
- Busca por nome da peça ou veículo
- Filtros por tipo (chips: Todas | Fabricadas | Compradas)
- Se a lista estiver vazia, mostra mensagem explicando que os dados são preenchidos automaticamente pelo ODB a cada lançamento

**2. Aba "Serviços & Mão de Obra"** (nova)
- Lista da tabela `odb_conhecimento_servicos` com: descrição do serviço, veículo, valor médio total, tempo médio em minutos, itens comuns (JSON)
- Card mostra: ganho/hora estimado (valor_medio / tempo_medio * 60)
- Ordenação por total de lançamentos (mais comuns primeiro)
- Seção "Dica IA" no topo: com base nos serviços mais frequentes, mostra sugestão de preço e tempo para o operador consultar rapidamente

**3. Reorganizar tabs existentes**
- Tabs: `📦 Catálogo` | `⏱ Serviços` | `📋 Notas Fiscais` | `🔧 Na Oficina` | `📩 Solicitações`
- Tabs com scroll horizontal no mobile

### Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/pages/PecasPage.tsx` | Adicionar 2 novas abas (Catálogo e Serviços), reorganizar tabs, queries para `odb_conhecimento_pecas` e `odb_conhecimento_servicos` |

### Sem mudanças de banco
Todas as tabelas necessárias já existem (`odb_conhecimento_pecas`, `odb_conhecimento_servicos`). Os dados são preenchidos automaticamente pelo edge function `odb-processar` a cada lançamento confirmado.

