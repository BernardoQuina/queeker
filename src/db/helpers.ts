import { sql } from 'drizzle-orm'

export const countWithColumn = (column: string) => {
  // its return type is string although it's a number that will need to be parsed
  return sql<string>`COUNT(${column})`
}
