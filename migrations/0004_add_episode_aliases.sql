CREATE TABLE IF NOT EXISTS episode_aliases (
    alias          TEXT PRIMARY KEY,
    episode_number INTEGER NOT NULL
);

INSERT OR IGNORE INTO episode_aliases (alias, episode_number) VALUES
    ('01m023va4d3pbq7v4gfvet5pdg', 28),
    ('01m0kz9n3wvtkvw8hmh6ravfmw', 29),
    ('01m16xj1q59b46r16byshz4zf5', 30),
    ('01m1rb7yxvygg9c5be3sp77h84', 31),
    ('01m29w8ssh9nm5jarjk4cq8qxh', 32);
