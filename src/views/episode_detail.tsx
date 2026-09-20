import type { FC } from 'hono/jsx'
import { raw } from 'hono/html'
import type { PlatformEpisode } from '../models/api/platform_episode'
import type { Episode } from '../models/db/episode'
import type { AdjacentEpisodes } from '../repositories/episodes'
import { Layout } from './layout'
import { formatDate, getCategoryInfo, parseTitle } from '../utils/episode_title'
import { episodePathOf } from '../utils/episode_path'

type Props = {
  data: PlatformEpisode
  neighbors: AdjacentEpisodes
  canonicalUrl?: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 150)
}

function toListenEmbedUrl(listenUrl: string): string {
  return `${listenUrl}/player?theme=auto`
}

const SectionHeader: FC<{ title: string }> = ({ title }) => (
  <div class="section__header">
    <div class="section__marker" aria-hidden="true">
      <span></span><span></span>
    </div>
    <h2 class="section__title">{title}</h2>
    <div class="section__rule" aria-hidden="true"></div>
  </div>
)

const NavItem: FC<{ ep: Episode | null; direction: 'prev' | 'next' }> = ({ ep, direction }) => {
  if (direction === 'prev') {
    if (!ep) {
      return (
        <span class="ep-nav__item ep-nav__item--prev ep-nav__item--disabled">
          <span class="ep-nav__direction">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
            前のエピソード
          </span>
          <span class="ep-nav__title">最初のエピソードです</span>
        </span>
      )
    }
    const parsed = parseTitle(ep.title)
    return (
      <a class="ep-nav__item ep-nav__item--prev" href={episodePathOf(ep)}>
        <span class="ep-nav__direction">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
          前のエピソード
        </span>
        <span class="ep-nav__title">
          {parsed.cleanTitle}
          {parsed.number !== null && <span class="ep-nav__number">#{parsed.number}</span>}
        </span>
      </a>
    )
  }

  if (!ep) {
    return (
      <span class="ep-nav__item ep-nav__item--next ep-nav__item--disabled">
        <span class="ep-nav__direction">
          最新エピソードです
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        </span>
        <span class="ep-nav__title">—</span>
      </span>
    )
  }
  const parsed = parseTitle(ep.title)
  return (
    <a class="ep-nav__item ep-nav__item--next" href={episodePathOf(ep)}>
      <span class="ep-nav__direction">
        次のエピソード
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
      </span>
      <span class="ep-nav__title">
        {parsed.cleanTitle}
        {parsed.number !== null && <span class="ep-nav__number">#{parsed.number}</span>}
      </span>
    </a>
  )
}

export const EpisodeDetail: FC<Props> = ({ data, neighbors, canonicalUrl }) => {
  const { episode, platforms } = data
  const listen = platforms.find((p) => p.name === 'LISTEN')
  const { cleanTitle, number } = parseTitle(episode.title)
  const { category, categoryLabel } = getCategoryInfo(episode.category_id)
  const description = episode.description ? stripHtml(episode.description) : undefined

  return (
    <Layout
      title={`${cleanTitle}${number !== null ? ` #${number}` : ''} — いつまじラジオ`}
      description={description}
      canonicalUrl={canonicalUrl}
      variant="detail"
      bodyThemeClass={`theme-${category}`}
    >
      <article>
        <header class="ep-header">
          <div class="ep-header__meta">
            <span class="ep-tag">{categoryLabel}</span>
            <time class="ep-header__date" dateTime={episode.published_at}>
              {formatDate(episode.published_at)}
            </time>
            <span class="ep-header__sep" aria-hidden="true"></span>
            <span class="ep-header__duration">{episode.duration}</span>
          </div>
          <h1 class="ep-header__title">
            {cleanTitle}
            {number !== null && <span class="ep-header__number">#{number}</span>}
          </h1>
        </header>

        {listen && (
          <iframe
            src={toListenEmbedUrl(listen.url)}
            width="100%"
            height="178"
            frameborder="0"
            scrolling="no"
            title="音声プレーヤー"
            style="display:block; margin-bottom:1.5rem; border-radius:var(--radius-md);"
          />
        )}

        {platforms.length > 0 && (
          <section class="section platform-links">
            <SectionHeader title="配信プラットフォーム" />
            <ul>
              {platforms.map((p) => (
                <li>
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    <img src={p.icon_url} alt={p.name} />
                    <span>{p.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section class="section show-notes">
          <SectionHeader title="このエピソードについて" />
          <div>{raw(episode.description)}</div>
        </section>

        <nav class="ep-nav" aria-label="エピソード間ナビゲーション">
          <NavItem ep={neighbors.prev} direction="prev" />
          <NavItem ep={neighbors.next} direction="next" />
        </nav>
      </article>
    </Layout>
  )
}