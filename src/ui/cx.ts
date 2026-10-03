/** Joins class names, skipping falsy entries: `cx(a, open && b)`. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
