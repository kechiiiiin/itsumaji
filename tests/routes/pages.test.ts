import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import pages from '../../src/routes/pages'
import { PLATFORM_IDS } from '../../src/constants/platforms'
import { CATEGORY_IDS } from '../../src/constants/categories'

beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM episode_platforms'),
    env.DB.prepare('DELETE FROM episodes'),
  ])
})

async function insertEpisode(guid: string, title: string, episodeNumber: number) {
  await env.DB.prepare(
    `INSERT INTO episodes (guid, title, description, published_at, duration, thumbnail_url, category_id, season, episode_number)
     VALUES (?, ?, '', '2026-04-01', '00:10:00', '', ?, NULL, ?)`
  ).bind(guid, title, CATEGORY_IDS.TECH, episodeNumber).run()
  await env.DB.prepare(
    'INSERT INTO episode_platforms (episode_id, platform_id, url) VALUES (?, ?, ?)'
  ).bind(guid, PLATFORM_IDS.LISTEN, `https://listen.style/p/itsumaji-radio/${guid}`).run()
}

async function seedThree() {
  await insertEpisode('uuid-zero', 'はじまりの回 #0', 0)
  await insertEpisode('01ULIDMIDDLE', '真ん中の回 #1', 1)
  await insertEpisode('uuid-latest', '最新の回 #2', 2)
}

function get(path: string) {
  return pages.request(path, { redirect: 'manual' }, env)
}

describe('GET /episodes/:param', () => {
  it('エピソード番号の URL は 200 を返す', async () => {
    await seedThree()

    const res = await get('/episodes/2')

    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('最新の回')
  })

  it('#0 のエピソード番号でも 200 を返す', async () => {
    await seedThree()

    const res = await get('/episodes/0')

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('はじまりの回')
  })

  it('旧 guid の URL は正規 URL へ 301 リダイレクトする', async () => {
    await seedThree()

    const res = await get('/episodes/01ULIDMIDDLE')

    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('http://localhost/episodes/1')
  })

  it('別名 ID の URL は対応するエピソード番号へ 301 リダイレクトする', async () => {
    await seedThree()
    await env.DB.prepare(
      'INSERT OR IGNORE INTO episode_aliases (alias, episode_number) VALUES (?, ?)'
    ).bind('alias-for-one', 1).run()

    const res = await get('/episodes/alias-for-one')

    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('http://localhost/episodes/1')
  })

  it('マイグレーションで投入済みの別名 ID も 301 リダイレクトする', async () => {
    await seedThree()

    const res = await get('/episodes/01m023va4d3pbq7v4gfvet5pdg')

    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('http://localhost/episodes/28')
  })

  it('シード済みの別名 ID（最新回）は該当番号へ 301 リダイレクトする', async () => {
    await seedThree()

    const res = await get('/episodes/01m2t9fmmhkgxnf5f4tgbdanvq')

    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('http://localhost/episodes/33')
  })

  it('シード済みの別名 ID（#0 の自己紹介回）は /episodes/0 へ 301 リダイレクトする', async () => {
    await seedThree()

    const res = await get('/episodes/01kfsmmcf9wd076ntj5jqrrvev')

    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('http://localhost/episodes/0')
  })

  it('存在しない guid は 404 を返す', async () => {
    await seedThree()

    const res = await get('/episodes/unknown-guid')

    expect(res.status).toBe(404)
  })

  it('存在しないエピソード番号は 404 を返す', async () => {
    await seedThree()

    const res = await get('/episodes/99')

    expect(res.status).toBe(404)
  })

  it('canonical / og:url が番号ベースの正規 URL になる', async () => {
    await seedThree()

    const html = await (await get('/episodes/1?utm_source=x')).text()

    expect(html).toContain('<link rel="canonical" href="http://localhost/episodes/1"/>')
    expect(html).toContain('<meta property="og:url" content="http://localhost/episodes/1"/>')
  })

  it('前後リンクの href が番号形式になる', async () => {
    await seedThree()

    const html = await (await get('/episodes/1')).text()

    expect(html).toContain('href="/episodes/0"')
    expect(html).toContain('href="/episodes/2"')
    expect(html).not.toContain('/episodes/uuid-zero')
    expect(html).not.toContain('/episodes/uuid-latest')
  })
})

describe('GET /', () => {
  it('一覧のリンクが番号形式になる', async () => {
    await seedThree()

    const html = await (await get('/')).text()

    expect(html).toContain('href="/episodes/2"')
    expect(html).toContain('href="/episodes/1"')
    expect(html).toContain('href="/episodes/0"')
    expect(html).not.toContain('/episodes/01ULIDMIDDLE')
  })
})
