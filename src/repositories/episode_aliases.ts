export async function findEpisodeNumberByAlias(db: D1Database, alias: string): Promise<number | null> {
    const row = await db.prepare(
        'SELECT episode_number FROM episode_aliases WHERE alias = ?'
    ).bind(alias).first<{ episode_number: number }>()
    return row?.episode_number ?? null
}

export async function insertEpisodeAlias(
    db: D1Database,
    alias: string,
    episodeNumber: number,
): Promise<void> {
    await db.prepare(
        'INSERT OR IGNORE INTO episode_aliases (alias, episode_number) VALUES (?, ?)'
    ).bind(alias, episodeNumber).run()
}
