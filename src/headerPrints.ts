export const headerPrints = [
  {
    id: 'fish',
    label: 'Fish',
    description: 'Paper-print fish illustration',
    src: '/art/header-fish-paper.png',
  },
  {
    id: 'cherry',
    label: 'Cherry',
    description: 'Paper-print cherry blossom illustration',
    src: '/art/header-cherry-paper.png',
  },
  {
    id: 'temple',
    label: 'Temple',
    description: 'Paper-print temple illustration',
    src: '/art/header-temple-paper.png',
  },
  {
    id: 'fuji',
    label: 'Fuji',
    description: 'Paper-print Mount Fuji illustration',
    src: '/art/header-fuji-paper.png',
  },
] as const

export type HeaderPrintId = (typeof headerPrints)[number]['id']

export const headerPrintRotationMs = 7000

export function nextHeaderPrintIndex(currentIndex: number) {
  return (currentIndex + 1) % headerPrints.length
}
