import { Hono } from 'hono'
import type { Context } from 'hono'
import {
  findAdjacentEpisodesByNumber,
  findEpisodeByGuid,
  findEpisodeWithPlatformsByNumber,
  listEpisodes,
} from '../repositories/episodes'
import { findEpisodeNumberByAlias } from '../repositories/episode_aliases'
import { episodePath } from '../utils/episode_path'
import { Home } from '../views/home'
import { EpisodeDetail } from '../views/episode_detail'
import { About } from '../views/about'

const pages = new Hono<{ Bindings: CloudflareBindings }>()

/** リクエスト URL のオリジンを保ったまま、クエリ等を落とした正規 URL を組み立てる */
function canonicalUrlFor(c: Context, path: string): string {
  const url = new URL(c.req.url)
  url.pathname = path
  url.search = ''
  url.hash = ''
  return url.toString()
}

pages.get('/', async (c) => {
  const episodes = await listEpisodes(c.env.DB)
  return c.html(<Home episodes={episodes} canonicalUrl={canonicalUrlFor(c, '/')} />)
})

pages.get('/about', async (c) => {
  const episodes = await listEpisodes(c.env.DB)
  return c.html(<About episodes={episodes} canonicalUrl={canonicalUrlFor(c, '/about')} />)
})

// 数字だけのパスは正規 URL（エピソード番号）、それ以外は旧 URL（LISTEN の guid）として扱う
pages.get('/episodes/:param', async (c) => {
  const param = c.req.param('param')

  if (!/^\d+$/.test(param)) {
    // guid で引けなければ、既知の別名 ID（X 投稿済みの LISTEN 側の別系統 ID）も見る
    const episode = await findEpisodeByGuid(c.env.DB, param)
    const redirectTo =
      episode?.episode_number ?? (await findEpisodeNumberByAlias(c.env.DB, param))
    if (redirectTo === null) {
      return c.notFound()
    }
    return c.redirect(canonicalUrlFor(c, episodePath(redirectTo)), 301)
  }

  const episodeNumber = Number(param)
  const [episode, neighbors] = await Promise.all([
    findEpisodeWithPlatformsByNumber(c.env.DB, episodeNumber),
    findAdjacentEpisodesByNumber(c.env.DB, episodeNumber),
  ])
  if (episode === null) {
    return c.notFound()
  }
  return c.html(
    <EpisodeDetail
      data={episode}
      neighbors={neighbors}
      canonicalUrl={canonicalUrlFor(c, episodePath(episodeNumber))}
    />,
  )
})

export default pages
