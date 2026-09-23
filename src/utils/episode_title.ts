import { CATEGORY_IDS } from '../constants/categories'

export type EpisodeCategory = 'zatsu' | 'gijutsu'

export type CategoryInfo = {
  category: EpisodeCategory
  categoryLabel: '雑談' | '技術'
}

export type ParsedTitle = {
  number: number | null
  cleanTitle: string
}

export function getCategoryInfo(categoryId: number): CategoryInfo {
  if (categoryId === CATEGORY_IDS.ZATSUDAN) {
    return { category: 'zatsu', categoryLabel: '雑談' }
  }
  return { category: 'gijutsu', categoryLabel: '技術' }
}

const ZATSU_PREFIX = '雑談：'
const ZATSU_SUFFIX = '【雑談】'

export function parseTitle(title: string): ParsedTitle {
  const numMatch = title.match(/\s*#(\d+)\s*$/)
  const number = numMatch ? Number(numMatch[1]) : null
  const stripped = numMatch
    ? title.slice(0, numMatch.index ?? title.length).trim()
    : title

  const withoutSuffix = stripped.endsWith(ZATSU_SUFFIX)
    ? stripped.slice(0, stripped.length - ZATSU_SUFFIX.length).trim()
    : stripped

  const cleanTitle = withoutSuffix.startsWith(ZATSU_PREFIX)
    ? withoutSuffix.slice(ZATSU_PREFIX.length).trim()
    : withoutSuffix

  return { number, cleanTitle }
}

export function formatDate(iso: string): string {
  return iso.replaceAll('-', '.')
}

export function formatDuration(d: string): string {
  return d.replace(/^00:/, '')
}

export function formatEpisodeNumber(n: number): string {
  return n.toString().padStart(2, '0')
}