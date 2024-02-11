/// <reference types="cfg-test/globals" />

declare module globalThis {
  interface ArrayConstructor {
    isArray(arg: readonly any[] | any): arg is readonly any[]
  }
}
