import type { Episode } from '../models/db/episode'

/**
 * エピソードの正規 URL パス。
 * LISTEN 由来の guid は形式が変わりうるため、自前のエピソード番号を正とする。
 */
export function episodePath(episodeNumber: number): string {
  return `/episodes/${episodeNumber}`
}

export function episodePathOf(episode: Pick<Episode, 'episode_number'>): string {
  return episodePath(episode.episode_number)
}
