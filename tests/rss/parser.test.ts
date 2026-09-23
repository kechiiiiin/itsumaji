import { describe, it, expect } from 'vitest'
import { parseRss } from '../../src/rss/parser'

describe('parseRss', () => {
  it('正常系：xmlの中身をEpisode型に変換できること', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>いつまじラジオ</title>
    <item>
      <title><![CDATA[雑談：最近ハマってること #11]]></title>
      <description><![CDATA[説明テキスト]]></description>
      <link>https://listen.style/p/itsumaji-radio/tstkdxyx</link>
      <guid isPermaLink="false">01kpf8d7sgm2q6byyxf2q2r6ap</guid>
      <pubDate>Sat, 18 Apr 2026 23:08:46 +0000</pubDate>
      <itunes:duration>00:53:51</itunes:duration>
      <itunes:image href="https://example.com/image.jpg"/>
    </item>
  </channel>
</rss>`

    const results = parseRss(xml)
    expect(results).toEqual([
      {
        episode: {
          guid: "01kpf8d7sgm2q6byyxf2q2r6ap",
          title: "雑談：最近ハマってること #11",
          description: "説明テキスト",
          published_at: "2026-04-19",
          duration: "00:53:51",
          thumbnail_url: "https://example.com/image.jpg",
          category_id: 1,
          season: null,
          episode_number: 0,
        },
        url: "https://listen.style/p/itsumaji-radio/tstkdxyx",
      }
    ])
  })

  it('正常系：「雑談：」で始まらないタイトルは tech カテゴリになる', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>いつまじラジオ</title>
    <item>
      <title><![CDATA[TypeScript の型システムを深掘り #5]]></title>
      <description><![CDATA[説明テキスト]]></description>
      <link>https://listen.style/p/itsumaji-radio/tech1</link>
      <guid isPermaLink="false">tech-guid-1</guid>
      <pubDate>Sat, 18 Apr 2026 23:08:46 +0000</pubDate>
      <itunes:duration>00:40:00</itunes:duration>
      <itunes:image href="https://example.com/tech.jpg"/>
    </item>
  </channel>
</rss>`

    const results = parseRss(xml)
    expect(results[0].episode.title).toBe('TypeScript の型システムを深掘り #5')
    expect(results[0].episode.category_id).toBe(2)
  })

  it('正常系：雑談と技術が混在しても正しく分類される', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
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

    const results = parseRss(xml)
    expect(results[0].episode.title).toBe('雑談：近況報告')
    expect(results[0].episode.category_id).toBe(1)
    expect(results[1].episode.title).toBe('Hono 入門')
    expect(results[1].episode.category_id).toBe(2)
  })

  it('正常系：複数の item を配列として返す', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>いつまじラジオ</title>
    <item>
      <title><![CDATA[エピソード1]]></title>
      <description><![CDATA[説明1]]></description>
      <link>https://listen.style/p/itsumaji-radio/ep1</link>
      <guid isPermaLink="false">guid-1</guid>
      <pubDate>Sat, 18 Apr 2026 23:08:46 +0000</pubDate>
      <itunes:duration>00:10:00</itunes:duration>
      <itunes:image href="https://example.com/image1.jpg"/>
    </item>
    <item>
      <title><![CDATA[エピソード2]]></title>
      <description><![CDATA[説明2]]></description>
      <link>https://listen.style/p/itsumaji-radio/ep2</link>
      <guid isPermaLink="false">guid-2</guid>
      <pubDate>Sat, 11 Apr 2026 23:08:46 +0000</pubDate>
      <itunes:duration>00:20:00</itunes:duration>
      <itunes:image href="https://example.com/image2.jpg"/>
    </item>
  </channel>
</rss>`

    const results = parseRss(xml)
    expect(results).toHaveLength(2)
    expect(results[0].episode.guid).toBe('guid-1')
    expect(results[0].episode.title).toBe('エピソード1')
    expect(results[1].episode.guid).toBe('guid-2')
    expect(results[1].episode.title).toBe('エピソード2')
  })

  it('正常系：item が 0 件の場合は空配列を返す', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>いつまじラジオ</title>
  </channel>
</rss>`

    const results = parseRss(xml)
    expect(results).toEqual([])
  })

  it('正常系：末尾【雑談】（番号なし）は雑談カテゴリになる', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>いつまじラジオ</title>
    <item>
      <title><![CDATA[ドーパミンデトックスをやってみた｜…【雑談】]]></title>
      <description><![CDATA[説明テキスト]]></description>
      <link>https://listen.style/p/itsumaji-radio/dopamine</link>
      <guid isPermaLink="false">dopamine-guid</guid>
      <pubDate>Sat, 18 Apr 2026 23:08:46 +0000</pubDate>
      <itunes:duration>00:30:00</itunes:duration>
      <itunes:image href="https://example.com/dopamine.jpg"/>
    </item>
  </channel>
</rss>`

    const results = parseRss(xml)
    expect(results[0].episode.category_id).toBe(1)
  })

  it('正常系：末尾【雑談】＋番号は雑談カテゴリになる', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>いつまじラジオ</title>
    <item>
      <title><![CDATA[ドーパミンデトックスをやってみた｜…【雑談】 #31]]></title>
      <description><![CDATA[説明テキスト]]></description>
      <link>https://listen.style/p/itsumaji-radio/dopamine31</link>
      <guid isPermaLink="false">dopamine31-guid</guid>
      <pubDate>Sat, 18 Apr 2026 23:08:46 +0000</pubDate>
      <itunes:duration>00:30:00</itunes:duration>
      <itunes:image href="https://example.com/dopamine31.jpg"/>
    </item>
  </channel>
</rss>`

    const results = parseRss(xml)
    expect(results[0].episode.category_id).toBe(1)
  })

  it('正常系：どちらの雑談マーカーも無いタイトル（番号あり）は技術カテゴリになる', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>いつまじラジオ</title>
    <item>
      <title><![CDATA[戦略の要諦について #30]]></title>
      <description><![CDATA[説明テキスト]]></description>
      <link>https://listen.style/p/itsumaji-radio/strategy30</link>
      <guid isPermaLink="false">strategy30-guid</guid>
      <pubDate>Sat, 18 Apr 2026 23:08:46 +0000</pubDate>
      <itunes:duration>00:30:00</itunes:duration>
      <itunes:image href="https://example.com/strategy30.jpg"/>
    </item>
  </channel>
</rss>`

    const results = parseRss(xml)
    expect(results[0].episode.category_id).toBe(2)
  })

  it('正常系：CDATA なしの title/description もパースできる', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>いつまじラジオ</title>
    <item>
      <title>プレーンなタイトル</title>
      <description>プレーンな説明</description>
      <link>https://listen.style/p/itsumaji-radio/plain</link>
      <guid isPermaLink="false">plain-guid</guid>
      <pubDate>Sat, 18 Apr 2026 23:08:46 +0000</pubDate>
      <itunes:duration>00:05:00</itunes:duration>
      <itunes:image href="https://example.com/plain.jpg"/>
    </item>
  </channel>
</rss>`

    const results = parseRss(xml)
    expect(results[0].episode.title).toBe('プレーンなタイトル')
    expect(results[0].episode.description).toBe('プレーンな説明')
  })
})