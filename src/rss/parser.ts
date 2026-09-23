import {Episode} from "../models/db/episode";
import {XMLParser} from "fast-xml-parser";
import {CATEGORY_IDS} from "../constants/categories";

type RssItem = {
    guid: { "#text": string, isPermalink: "false" }
    title: string
    description: string
    pubDate: string
    link: string
    "itunes:duration": string
    "itunes:image": { href: string }
    "itunes:season"?: number
    "itunes:episode"?: number
}

export type RssEpisode = {
    episode: Episode
    url: string
}

const jstDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
})

function toJstDate(rfc822: string): string {
    return jstDateFormatter.format(new Date(rfc822))
}

export function parseRss(xml: string): RssEpisode[] {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        isArray: (tagName) => tagName === 'item',
    })

    const parsed = parser.parse(xml)
    const items: RssItem[] = parsed.rss.channel.item ?? []

    return items.map((item: RssItem): RssEpisode => {
        const isZatsudan = item.title.startsWith('雑談：') || /【雑談】\s*(#\d+)?\s*$/.test(item.title)
        return {
            episode: {
                guid: item.guid["#text"],
                title: item.title,
                description: item.description.split('<p>---</p>')[0].trim(),
                published_at: toJstDate(item.pubDate),
                duration: item["itunes:duration"],
                thumbnail_url: item["itunes:image"].href,
                category_id: isZatsudan ? CATEGORY_IDS.ZATSUDAN : CATEGORY_IDS.TECH,
                season: item["itunes:season"] ?? null,
                episode_number: item["itunes:episode"] ?? 0,
            },
            url: item.link,
        }
    })
}