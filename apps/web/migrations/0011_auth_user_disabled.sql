-- Better Auth user disable flag used by session create hooks.
-- Applied via pnpm migrate:ops; do not ALTER on the hot login path.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false;
