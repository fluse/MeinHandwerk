/** Referenziert ein `--color-*`-Design-Token aus index.css, für Fälle mit dynamischem Suffix
 *  (z. B. Gewerk/Status-Enums), bei denen Tailwinds Klassen-Scanner keine Utility generieren kann. */
export function colorVar(token: string): string {
  return `var(--color-${token})`
}
