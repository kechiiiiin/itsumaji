import type { FC } from 'hono/jsx'
import type { Episode } from '../models/db/episode'
import { Layout } from './layout'
import { formatDate, formatEpisodeNumber, getCategoryInfo, parseTitle } from '../utils/episode_title'
import { episodePathOf } from '../utils/episode_path'

const RSS_URL = 'https://rss.listen.style/p/itsumaji-radio/rss'

function buildBadge(episodes: Episode[]): string | undefined {
  const numbers = episodes
    .map((ep) => parseTitle(ep.title).number)
    .filter((n): n is number => n !== null)
  if (numbers.length === 0) return undefined
  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  return `EP.${formatEpisodeNumber(min)} – EP.${formatEpisodeNumber(max)}`
}

export const Home: FC<{ episodes: Episode[]; canonicalUrl?: string }> = ({ episodes, canonicalUrl }) => (
  <Layout
    title="いつまじラジオ｜いつもの雑談、まじめな技術"
    description="福岡県で医療系ITエンジニアをしているJと上原が普段の学びを話したり、好きに雑談をするポッドキャスト。毎週日曜日更新。"
    canonicalUrl={canonicalUrl}
    badge={buildBadge(episodes)}
  >
    <div class="list-toolbar">
      <a class="rss-btn" href={RSS_URL} target="_blank" rel="noopener noreferrer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.18 15.64a2.18 2.18 0 012.18 2.18C8.36 19 7.38 20 6.18 20A2.18 2.18 0 014 17.82a2.18 2.18 0 012.18-2.18zM4 4.44A15.56 15.56 0 0119.56 20h-2.83A12.73 12.73 0 004 7.27V4.44zm0 5.66a9.9 9.9 0 019.9 9.9h-2.83A7.07 7.07 0 004 12.93V10.1z"/>
        </svg>
        RSS
      </a>
    </div>

    <div class="section-header">
      <div class="section-header__marker" aria-hidden="true">
        <span></span><span></span>
      </div>
      <h2 class="section-header__title">エピソード</h2>
      <span class="section-header__count">全 {episodes.length} 本</span>
      <div class="section-header__rule" aria-hidden="true"></div>
    </div>

    {episodes.length === 0 ? (
      <p class="episodes-empty">まだエピソードがありません</p>
    ) : (
      <ul class="episodes">
        {episodes.map((ep) => {
          const { cleanTitle, number } = parseTitle(ep.title)
          const { category, categoryLabel } = getCategoryInfo(ep.category_id)
          return (
            <li>
              <a
                class={`episode episode--${category}`}
                href={episodePathOf(ep)}
              >
                <div class="episode__meta">
                  <span class={`episode__tag episode__tag--${category}`}>
                    {categoryLabel}
                  </span>
                  <time class="episode__date" dateTime={ep.published_at}>
                    {formatDate(ep.published_at)}
                  </time>
                  <span class="episode__duration">{ep.duration}</span>
                </div>
                <p class="episode__title">
                  {cleanTitle}
                  {number !== null && (
                    <span class="episode__number">#{number}</span>
                  )}
                </p>
              </a>
            </li>
          )
        })}
      </ul>
    )}
  </Layout>
)