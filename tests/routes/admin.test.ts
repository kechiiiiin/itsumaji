import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import admin from '../../src/routes/admin'
import { PLATFORM_IDS } from '../../src/constants/platforms'
import { CATEGORY_IDS } from '../../src/constants/categories'

beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM episode_platforms'),
    env.DB.prepare('DELETE FROM episodes'),
  ])
})

async function insertEpisode(guid: string, title: string) {
  await env.DB.prepare(
    `INSERT INTO episodes (guid, title, description, published_at, duration, thumbnail_url, category_id, season, episode_number)
     VALUES (?, ?, '', '2026-04-01', '00:10:00', '', ?, NULL, 0)`
  ).bind(guid, title, CATEGORY_IDS.TECH).run()
}

function postEpisodePlatforms(body: unknown) {
  return admin.request(
    '/episode-platforms',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify(body),
    },
    env,
  )
}

describe('POST /episode-platforms', () => {
  it('必須フィールドが欠けると 400 を返す', async () => {
    const res = await postEpisodePlatforms({ guid: 'guid-1', platform_id: PLATFORM_IDS.AMAZON_MUSIC })

    expect(res.status).toBe(400)
    const body = await res.json<{ ok: boolean; error: string }>()
    expect(body.ok).toBe(false)
  })

  it('該当 guid のエピソードが無いと 404 を返す', async () => {
    const res = await postEpisodePlatforms({
      guid: 'non-existent-guid',
      platform_id: PLATFORM_IDS.AMAZON_MUSIC,
      url: 'https://music.amazon.co.jp/podcasts/xxx',
    })

    expect(res.status).toBe(404)
    const body = await res.json<{ ok: boolean; error: string }>()
    expect(body.ok).toBe(false)
  })

  it('指定した guid に対して episode_platforms が登録される', async () => {
    await insertEpisode('guid-1', 'タイトル')

    const res = await postEpisodePlatforms({
      guid: 'guid-1',
      platform_id: PLATFORM_IDS.AMAZON_MUSIC,
      url: 'https://music.amazon.co.jp/podcasts/xxx',
    })

    expect(res.status).toBe(200)
    const body = await res.json<{ ok: boolean }>()
    expect(body.ok).toBe(true)

    const row = await env.DB
      .prepare('SELECT episode_id, platform_id, url FROM episode_platforms')
      .first<{ episode_id: string; platform_id: number; url: string }>()
    expect(row).toEqual({
      episode_id: 'guid-1',
      platform_id: PLATFORM_IDS.AMAZON_MUSIC,
      url: 'https://music.amazon.co.jp/podcasts/xxx',
    })
  })

  it('同じ (episode_id, platform_id) で複数回呼んでも重複しない', async () => {
    await insertEpisode('guid-1', 'タイトル')

    const body = {
      guid: 'guid-1',
      platform_id: PLATFORM_IDS.AMAZON_MUSIC,
      url: 'https://music.amazon.co.jp/podcasts/xxx',
    }
    await postEpisodePlatforms(body)
    await postEpisodePlatforms(body)

    const count = await env.DB
      .prepare('SELECT COUNT(*) as c FROM episode_platforms')
      .first<{ c: number }>()
    expect(count?.c).toBe(1)
  })
})
