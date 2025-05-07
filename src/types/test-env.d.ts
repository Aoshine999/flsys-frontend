/// <reference types="vitest/globals" />
import type { SpyInstance } from 'vitest'

declare module '@vue/test-utils' {
  import type { mount as _mount } from '@vue/test-utils'
  export const mount: typeof _mount
}

declare global {
  function describe(name: string, fn: () => void): void
  function describe(name: string, options: { concurrent?: boolean; sequential?: boolean; timeout?: number }, fn: () => void): void
  function it(name: string, fn: () => void | Promise<void>, timeout?: number): void
  function beforeEach(fn: () => void | Promise<void>): void
  function expect<T = any>(actual: T): any
  function spyOn<T extends object, M extends keyof T>(
    object: T,
    method: M,
    accessType?: 'get' | 'set'
  ): SpyInstance<T, M>
} 