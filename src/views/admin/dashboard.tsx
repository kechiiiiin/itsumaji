import type { FC } from 'hono/jsx'
import { raw } from 'hono/html'
import { AdminLayout } from './layout'
import type { Episode } from '../../models/db/episode'
import { CATEGORY_IDS } from '../../constants/categories'
import { PLATFORM_INFO } from '../../constants/platforms'
import { episodePathOf } from '../../utils/episode_path'

type Props = {
    episodes: Episode[]
    platformsByGuid: Map<string, Set<number>>
    message?: string
    error?: string
}

const pillStyles = `
  .platform-pills { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .p-pill {
    display:inline-flex; align-items:center; gap:7px;
    background:var(--surface); border:1px solid var(--border);
    border-radius:var(--radius-pill); padding:5px 12px;
    font-size:11px; font-weight:500; color:var(--ink-subtle);
    transition:border-color .15s, transform .1s;
    text-decoration:none; cursor:pointer;
  }
  .p-pill:hover { border-color:var(--ink-subtle); transform:translateY(-1px); }
  .p-pill img { width:14px; height:14px; object-fit:contain; display:block; }
  .p-pill--inactive { opacity:0.35; filter:grayscale(0.5); }
  .p-pill--inactive:hover { border-color:var(--accent); opacity:0.75; filter:none; transform:translateY(-1px); }
`

export const Dashboard: FC<Props> = ({ episodes, platformsByGuid, message, error }) => (
    <AdminLayout title="Dashboard">
        <style>{raw(pillStyles)}</style>
        {message && <div class="alert alert--success">{message}</div>}
        {error && <div class="alert alert--error">{error}</div>}

        <div class="admin-card">
            <p class="admin-card__title">同期</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <form method="post" action="/admin/sync/rss">
                    <button type="submit" class="btn btn--secondary btn--sm">RSS 同期</button>
                </form>
                <form method="post" action="/admin/sync/spotify">
                    <button type="submit" class="btn btn--secondary btn--sm">Spotify 同期</button>
                </form>
                <form method="post" action="/admin/sync/apple-podcasts">
                    <button type="submit" class="btn btn--secondary btn--sm">Apple Podcasts 同期</button>
                </form>
            </div>
        </div>

        <div class="admin-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                <p class="admin-card__title" style="margin-bottom:0;">エピソード一覧</p>
                <a href="/admin/episodes/new" class="btn btn--primary btn--sm">＋ 事前登録</a>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead>
                    <tr style="border-bottom:1px solid var(--border);">
                        <th style="text-align:left;padding:8px 10px;color:var(--ink-faint);font-weight:600;font-size:12px;width:52px;">EP</th>
                        <th style="text-align:left;padding:8px 10px;color:var(--ink-faint);font-weight:600;font-size:12px;">タイトル</th>
                        <th style="text-align:left;padding:8px 10px;color:var(--ink-faint);font-weight:600;font-size:12px;width:60px;">カテゴリ</th>
                        <th style="text-align:left;padding:8px 10px;color:var(--ink-faint);font-weight:600;font-size:12px;width:95px;">日付</th>
                        <th style="text-align:left;padding:8px 10px;color:var(--ink-faint);font-weight:600;font-size:12px;">プラットフォーム</th>
                    </tr>
                </thead>
                <tbody>
                    {episodes.map((ep) => {
                        const registered = platformsByGuid.get(ep.guid) ?? new Set<number>()
                        return (
                            <tr key={ep.guid} style="border-bottom:1px solid var(--border-soft);">
                                <td style="padding:14px 10px;font-family:var(--font-mono);font-size:13px;color:var(--ink-faint);">
                                    #{ep.episode_number}
                                </td>
                                <td style="padding:14px 10px;">
                                    <a href={episodePathOf(ep)} target="_blank" style="color:var(--ink);">{ep.title || '—'}</a>
                                </td>
                                <td style="padding:14px 10px;font-size:13px;color:var(--ink-subtle);">
                                    {ep.category_id === CATEGORY_IDS.ZATSUDAN ? '雑談' : '技術'}
                                </td>
                                <td style="padding:14px 10px;font-size:13px;color:var(--ink-subtle);">
                                    {ep.published_at ? ep.published_at.slice(0, 10) : '未公開'}
                                </td>
                                <td style="padding:14px 10px;">
                                    <div class="platform-pills">
                                        {Object.entries(PLATFORM_INFO).map(([id, info]) => {
                                            const platformId = Number(id)
                                            const isRegistered = registered.has(platformId)
                                            return (
                                                <a
                                                    key={id}
                                                    href={`/admin/episodes/${ep.guid}/platforms/${platformId}`}
                                                    class={`p-pill${isRegistered ? '' : ' p-pill--inactive'}`}
                                                    title={isRegistered ? `${info.name}（登録済み・クリックで編集）` : `${info.name}（未登録・クリックで登録）`}
                                                >
                                                    <img src={info.icon_url} alt="" />
                                                    {info.name}
                                                </a>
                                            )
                                        })}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    </AdminLayout>
)
