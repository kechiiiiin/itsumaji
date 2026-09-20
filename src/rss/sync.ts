import {parseRss} from "./parser";
import {PLATFORM_IDS} from "../constants/platforms";
import {bulkInsertEpisodes} from "../repositories/episodes";
import {bulkInsertEpisodePlatforms} from "../repositories/episode_platforms";
import {insertEpisodeAlias, listAliasEpisodeNumbers} from "../repositories/episode_aliases";
import {extractListenEpisodeId} from "./listen_episode_id";
import type {RssEpisode} from "./parser";

export async function syncRss(env: CloudflareBindings) {
    const response = await fetch("https://rss.listen.style/p/itsumaji-radio/rss")

    if (!response.ok) {
        throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`)
    }

    const xml = await response.text()
    const rssEpisodes = parseRss(xml)

    if (rssEpisodes.length === 0) {
        return
    }

    await bulkInsertEpisodes(env.DB, rssEpisodes.map((rssEpisode) => rssEpisode.episode))
    await bulkInsertEpisodePlatforms(env.DB, rssEpisodes.map((rssEpisode) => ({
        episodeId: rssEpisode.episode.guid,
        platformId: PLATFORM_IDS.LISTEN,
        url: rssEpisode.url,
    })))

    await syncEpisodeAliases(env.DB, rssEpisodes)
}

/**
 * 別名（LISTEN 内部の episodeId）が未登録のエピソードだけ、LISTEN のページから採取して登録する。
 * ここでの失敗は RSS 同期本体を巻き込まない（次回の実行でまた試す）。
 */
async function syncEpisodeAliases(db: D1Database, rssEpisodes: RssEpisode[]): Promise<void> {
    try {
        const registered = await listAliasEpisodeNumbers(db)
        const targets = rssEpisodes.filter(
            (rssEpisode) => !registered.has(rssEpisode.episode.episode_number)
        )

        for (const target of targets) {
            const alias = await fetchListenEpisodeId(target.url)
            if (alias === null) {
                continue
            }
            await insertEpisodeAlias(db, alias, target.episode.episode_number)
        }
    } catch (error) {
        console.error(`episode alias sync failed: ${error}`)
    }
}

async function fetchListenEpisodeId(url: string): Promise<string | null> {
    try {
        const response = await fetch(url)
        if (!response.ok) {
            console.error(`LISTEN page fetch failed: ${response.status} ${url}`)
            return null
        }
        const alias = extractListenEpisodeId(await response.text())
        if (alias === null) {
            console.error(`episodeId not found in LISTEN page: ${url}`)
        }
        return alias
    } catch (error) {
        console.error(`LISTEN page fetch failed: ${url} ${error}`)
        return null
    }
}
