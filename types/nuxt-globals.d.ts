// Ambient type declarations for Nuxt / Nitro globals used in this project.
// These are provided at runtime by Nuxt / Nitro / H3, so we only need
// TypeScript to know their shapes.

declare const definePageMeta: (meta: any) => void
declare function $fetch<T = any>(input: any, init?: any): Promise<T>

// Client-side router (Nuxt auto-imports this at runtime)
declare function useRouter(): any

// Server-side / Nitro utilities
declare function defineEventHandler(handler: any): any
declare function readBody<T = any>(event: any): Promise<T>
declare function useRuntimeConfig(): any
declare function getHeader(event: any, name: string): string | null
declare function createError(input: any): any

// Cloudflare D1 (minimal shape for typing)
type D1Database = any


