import { describe, it, expect } from 'vitest'
import { extractListenEpisodeId } from '../../src/rss/listen_episode_id'

describe('extractListenEpisodeId', () => {
  it('LISTEN のページ HTML から episodeId を取り出す', () => {
    const html = `<html><body><script>
      window.__data = { podcastId: 'xxx', episodeId: '01m2t9fmmhkgxnf5f4tgbdanvq', foo: 1 }
    </script></body></html>`

    expect(extractListenEpisodeId(html)).toBe('01m2t9fmmhkgxnf5f4tgbdanvq')
  })

  it('空白の有無にかかわらず取り出せる', () => {
    expect(extractListenEpisodeId("episodeId:'01kfsmmcf9wd076ntj5jqrrvev'"))
      .toBe('01kfsmmcf9wd076ntj5jqrrvev')
  })

  it('episodeId が無ければ null を返す', () => {
    expect(extractListenEpisodeId('<html><body>no id here</body></html>')).toBeNull()
  })

  it('26文字の ULID でなければ null を返す', () => {
    expect(extractListenEpisodeId("episodeId: 'too-short'")).toBeNull()
  })
})
