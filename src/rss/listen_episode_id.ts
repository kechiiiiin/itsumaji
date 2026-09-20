/** LISTEN のエピソードページ HTML から内部エピソード ID（26文字の ULID）を取り出す */
export function extractListenEpisodeId(html: string): string | null {
    const matched = html.match(/episodeId:\s*'([0-9a-z]{26})'/)
    return matched?.[1] ?? null
}
