CREATE TABLE IF NOT EXISTS "site_settings" (
  "key" text PRIMARY KEY NOT NULL,
  "value" jsonb NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "updated_by" text
);

-- Seed default social links
INSERT INTO "site_settings" ("key", "value", "updated_at") VALUES
  ('social_links', '[
    {"platform": "twitter", "label": "Twitter / X", "href": "", "enabled": true},
    {"platform": "facebook", "label": "Facebook", "href": "", "enabled": false},
    {"platform": "instagram", "label": "Instagram", "href": "", "enabled": false},
    {"platform": "linkedin", "label": "LinkedIn", "href": "", "enabled": false},
    {"platform": "github", "label": "GitHub", "href": "", "enabled": true}
  ]', now())
ON CONFLICT ("key") DO NOTHING;
