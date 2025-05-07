declare module 'vitest' {
  import { expect as baseExpect } from 'vitest'
  
  export * from 'vitest'
  export const expect: typeof baseExpect
} 