# Oficina da Borracha - Project Memory

## Design System
- Theme: ODB Playbook industrial (red/black/gold/chrome)
- Background: #090909 (pure black)
- Cards: hsl(0 0% 7%) with backdrop-blur
- Primary: #D20A0A (red) — borders, active states, CTAs
- Accent/Gold: #C9A84C — financial values, highlights, premium badges
- Chrome: #BEBEBE — secondary text, neutral badges
- Border radius: 0px (sharp/industrial)
- No emojis - use Lucide icons only
- Fonts: Inter (kept from before)

## Architecture
- Auth: Supabase auth with auto-confirm enabled
- Auth guard in AppLayout via useAuth hook
- Profile auto-created via trigger on signup (role: 'operador')
- Filiais seeded: Centro, Norte, Sul

## Database Tables
- filiais, profiles, clientes, veiculos
- lancamentos (realtime), lancamento_items
- despesas (realtime), socios, socio_filiais, retiradas
- odb_conhecimento_pecas, odb_conhecimento_servicos
- Storage bucket: 'uploads' (public)

## Edge Functions
- analyze-photo, analyze-audio, ai-insights
- odb-processar: populates knowledge tables automatically

## Key Files
- src/hooks/useAuth.tsx - Auth context
- src/hooks/useDashboardData.ts - Dashboard queries
- src/pages/PlaybookPage.tsx - Full 8-section business playbook
- src/pages/PecasPage.tsx - Smart catalog with 5 tabs
