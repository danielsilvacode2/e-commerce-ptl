# Diretrizes de Front-end

Stack: Next.js 15+ (App Router), React 19, TypeScript strict, Tailwind CSS v4.
Se o projeto usar versões anteriores, adapte e avise sobre as diferenças.

## Idioma
Responda e comente o código em português do Brasil. Nomes de variáveis, funções e componentes em inglês.

## Estrutura
- `app/` rotas; `app/<rota>/_components/` componentes específicos da rota
- `components/ui/` componentes genéricos
- `lib/` utils e cliente de API; `types/` tipos compartilhados
- Helper `cn()` com `clsx` + `tailwind-merge`
- Variantes de componentes com `class-variance-authority`
- Validação com Zod; tipos com `z.infer`
- Ícones com `lucide-react`; imagens com `next/image`; fontes com `next/font`

## Next.js e React
- Server Component por padrão. Use `"use client"` só com hooks, event handlers ou APIs do navegador, sempre nos componentes mais baixos da árvore.
- Props de Server para Client devem ser serializáveis.
- Next 15: `params` e `searchParams` são `Promise` (use `await`); `fetch` não é cacheado por padrão.
- Busque dados em Server Components. Use TanStack Query/SWR só para dados dependentes de interação. Não use `useEffect` para buscar dados que o servidor poderia fornecer.
- Use `loading.tsx`, `error.tsx`, `not-found.tsx` e `<Suspense>` para estados de carregamento e erro.
- Formulários: Server Actions + `useActionState`, validação Zod no servidor, erros por campo com `aria-invalid` e `aria-describedby`, botão desabilitado durante o envio.
- Use `metadata`/`generateMetadata` nas páginas e `next/link` na navegação interna.

## TypeScript
- Sempre `interface` ou `type` explícitos para props, payloads e respostas de API.
- Nunca `any`; use `unknown` com narrowing.
- `key` estável em listas, nunca o índice em listas dinâmicas.

## Tailwind
- Mobile-first (`sm:`, `md:`, `lg:`, `xl:`).
- Classes utilitárias no JSX; evite `@apply`.
- Sempre inclua `hover:`, `focus-visible:`, `active:` e `disabled:`.
- Dark mode com `dark:` seguindo `prefers-color-scheme`. Toggle manual: `next-themes` + `@custom-variant dark (&:where(.dark, .dark *));`.
- Nunca monte classes dinamicamente (`bg-${cor}-500`); use mapas de classes completas.

## Acessibilidade e UX
- HTML semântico (`<header>`, `<main>`, `<nav>`, `<button>`, `<label>`). Nunca `<div>` ou `<span>` clicável.
- Todo input com `<label htmlFor>` ou `aria-label`; foco visível; navegação por teclado.
- Modais e menus: gerencie foco, feche com `Esc` (ou use Radix/Headless UI).
- Todo fluxo assíncrono tem loading, empty state e erro com opção de tentar novamente.
- Respeite `prefers-reduced-motion`.

## Como trabalhar
1. Se faltar informação crítica (formato da API, design, regras), pergunte em vez de inventar.
2. Defina os tipos antes do JSX.
3. Entregue código completo, sem `// ... resto do código`, indicando o caminho de cada arquivo.
4. Após o código, no máximo 5 bullets com as decisões principais e as dependências a instalar.
5. Em revisões, priorize: bugs, acessibilidade, tipagem, performance, estilo.

## Evite
- Esquecer `"use client"` ao usar hooks; usar `"use client"` em páginas ou layouts inteiros sem necessidade.
- Importar Server Component dentro de Client Component (passe como `children`).
- Hydration mismatch: `window`, `localStorage`, `Date.now()` ou `Math.random()` durante a renderização.
- Esquecer `await` em `params`/`searchParams`.