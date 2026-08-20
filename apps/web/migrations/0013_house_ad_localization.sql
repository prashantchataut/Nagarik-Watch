-- Localized direct-sale creative fields for reader-facing house ads.

ALTER TABLE nw_house_ads ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE nw_house_ads ADD COLUMN IF NOT EXISTS body_en text;
ALTER TABLE nw_house_ads ADD COLUMN IF NOT EXISTS cta_en text;
ALTER TABLE nw_house_ads ADD COLUMN IF NOT EXISTS ab_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE nw_house_ads ADD COLUMN IF NOT EXISTS challenger_json text;
