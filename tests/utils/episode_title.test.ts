import { describe, it, expect } from 'vitest'
import { parseTitle } from '../../src/utils/episode_title'

describe('parseTitle', () => {
  it('旧形式：先頭「雑談：」・番号なしから主題だけを返す', () => {
    expect(parseTitle('雑談：近況報告')).toEqual({
      number: null,
      cleanTitle: '近況報告',
    })
  })

  it('旧形式：先頭「雑談：」・番号ありから番号を剥がし主題だけを返す', () => {
    expect(parseTitle('雑談：最近ハマってること #11')).toEqual({
      number: 11,
      cleanTitle: '最近ハマってること',
    })
  })

  it('新形式：末尾「【雑談】」・番号なしから【雑談】を剥がし主題だけを返す', () => {
    expect(parseTitle('ドーパミンデトックスをやってみた｜…【雑談】')).toEqual({
      number: null,
      cleanTitle: 'ドーパミンデトックスをやってみた｜…',
    })
  })

  it('新形式：末尾「【雑談】」＋番号から両方を剥がし主題だけを返す', () => {
    expect(parseTitle('ドーパミンデトックスをやってみた｜…【雑談】 #31')).toEqual({
      number: 31,
      cleanTitle: 'ドーパミンデトックスをやってみた｜…',
    })
  })

  it('雑談マーカーが無いタイトルはそのまま（番号だけ剥がす）', () => {
    expect(parseTitle('戦略の要諦について #30')).toEqual({
      number: 30,
      cleanTitle: '戦略の要諦について',
    })
  })
})
