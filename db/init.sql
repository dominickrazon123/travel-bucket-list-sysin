CREATE TABLE IF NOT EXISTS destinations (
    id            SERIAL PRIMARY KEY,
    country       VARCHAR(100) NOT NULL,
    capital       VARCHAR(255) NOT NULL DEFAULT '',
    note          TEXT         NOT NULL DEFAULT '',
    region        VARCHAR(100) NOT NULL DEFAULT '',
    population    VARCHAR(50)  NOT NULL DEFAULT '',
    languages     VARCHAR(500) NOT NULL DEFAULT '',
    currencies    VARCHAR(500) NOT NULL DEFAULT '',
    currency_code VARCHAR(10)  NOT NULL DEFAULT '',
    visit_date    DATE,
    days          INTEGER CHECK (days BETWEEN 1 AND 365),
    tier          VARCHAR(10)  NOT NULL DEFAULT 'mid' CHECK (tier IN ('low', 'mid', 'high')),
    status        VARCHAR(10)  NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'visited')),
    favorite      BOOLEAN      NOT NULL DEFAULT FALSE,
    position      INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_destinations_position ON destinations (position, id);

INSERT INTO destinations (country, capital, position)
SELECT 'France', 'Paris', 1
WHERE NOT EXISTS (SELECT 1 FROM destinations);
