export function formatPrice(value: number) {
  return `${new Intl.NumberFormat("tr-TR").format(value)} TL`;
}
