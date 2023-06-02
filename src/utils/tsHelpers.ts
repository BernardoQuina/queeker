/* eslint-disable @typescript-eslint/no-explicit-any */
export type ResolvedType<T extends Promise<any>> = T extends Promise<infer R> ? R : never
