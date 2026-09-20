import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import { env, fetchMock } from 'cloudflare:test'
import { syncRss } from '../../src/rss/sync'
import { PLATFORM_IDS } from '../../src/constants/platforms'
import { CATEGORY_IDS } from '../../src/constants/categories'

const RSS_URL_ORIGIN = 'https://rss.listen.style'
const RSS_URL_PATH = '/p/itsumaji-radio/rss'

const RSS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>いつまじラジオ</title>
    <item>
      <title><![CDATA[雑談：近況報告]]></title>
      <description><![CDATA[説明1]]></description>
      <link>https://listen.style/p/itsumaji-radio/ep1</link>
      <guid isPermaLink="false">guid-1</guid>
      <pubDate>Sat, 18 Apr 2026 23:08:46 +0000</pubDate>
      <itunes:duration>00:10:00</itunes:duration>
      <itunes:image href="https://example.com/image1.jpg"/>
    </item>
    <item>
      <title><![CDATA[Hono 入門]]></title>
      <description><![CDATA[説明2]]></description>
      <link>https://listen.style/p/itsumaji-radio/ep2</link>
      <guid isPermaLink="false">guid-2</guid>
      <pubDate>Sat, 11 Apr 2026 23:08:46 +0000</pubDate>
      <itunes:duration>00:20:00</itunes:duration>
      <itunes:image href="https://example.com/image2.jpg"/>
    </item>
  </channel>
</rss>`

const EMPTY_RSS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>いつまじラジオ</title>
  </channel>
</rss>`

beforeAll(() => {
  fetchMock.activate()
  fetchMock.disableNetConnect()
})

afterEach(() => {
  fetchMock.assertNoPendingInterceptors()
})

beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM episode_platforms'),
    env.DB.prepare('DELETE FROM episodes'),
  ])
})

function interceptRss(xml: string, times = 1) {
  fetchMock
    .get(RSS_URL_ORIGIN)
    .intercept({ path: RSS_URL_PATH })
    .reply(200, xml, { headers: { 'Content-Type': 'application/xml' } })
    .times(times)
}

describe('syncRss', () => {
  it('初回は RSS のエピソードを全件 episodes / episode_platforms に保存する', async () => {
    interceptRss(RSS_XML)

    await syncRss(env)

    const episodes = await env.DB
      .prepare('SELECT guid, title, category_id FROM episodes ORDER BY guid')
      .all<{ guid: string; title: string; category_id: number }>()
    expect(episodes.results).toEqual([
      { guid: 'guid-1', title: '雑談：近況報告', category_id: CATEGORY_IDS.ZATSUDAN },
      { guid: 'guid-2', title: 'Hono 入門', category_id: CATEGORY_IDS.TECH },
    ])

    const platforms = await env.DB
      .prepare('SELECT episode_id, platform_id, url FROM episode_platforms ORDER BY episode_id')
      .all<{ episode_id: string; platform_id: number; url: string }>()
    expect(platforms.results).toEqual([
      {
        episode_id: 'guid-1',
        platform_id: PLATFORM_IDS.LISTEN,
        url: 'https://listen.style/p/itsumaji-radio/ep1',
      },
      {
        episode_id: 'guid-2',
        platform_id: PLATFORM_IDS.LISTEN,
        url: 'https://listen.style/p/itsumaji-radio/ep2',
      },
    ])
  })

  it('同じエピソードが再取得されると RSS の内容で上書きされる（事前登録を実データで置き換える）', async () => {
    interceptRss(RSS_XML, 2)

    await syncRss(env)

    await env.DB
      .prepare('UPDATE episodes SET title = ? WHERE guid = ?')
      .bind('手動で書き換えたタイトル', 'guid-1')
      .run()

    await syncRss(env)

    const episode = await env.DB
      .prepare('SELECT title, category_id FROM episodes WHERE guid = ?')
      .bind('guid-1')
      .first<{ title: string; category_id: number }>()
    expect(episode?.title).toBe('雑談：近況報告')
    expect(episode?.category_id).toBe(CATEGORY_IDS.ZATSUDAN)

    const count = await env.DB
      .prepare('SELECT COUNT(*) as c FROM episodes')
      .first<{ c: number }>()
    expect(count?.c).toBe(2)

    const platformCount = await env.DB
      .prepare('SELECT COUNT(*) as c FROM episode_platforms')
      .first<{ c: number }>()
    expect(platformCount?.c).toBe(2)
  })

  it('RSS が 0 件のときは DB への書き込みを行わない', async () => {
    interceptRss(EMPTY_RSS_XML)

    await syncRss(env)

    const count = await env.DB
      .prepare('SELECT COUNT(*) as c FROM episodes')
      .first<{ c: number }>()
    expect(count?.c).toBe(0)
  })
})