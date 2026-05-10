-- Migration 001: Professional Sampler Database Schema
-- Expandable 5 GB → 50 GB via PostgreSQL tablespaces and table partitioning.
-- Run as the database superuser or sampler_admin role.

-- ─── Tablespace ───────────────────────────────────────────────────────────────
-- Tablespace points to the mounted Docker volume; resize the volume to scale.
-- In Docker this path maps to the sampler_data named volume.
-- CREATE TABLESPACE sampler_ts LOCATION '/var/lib/sampler/data';
-- (Commented out: auto-created in docker-compose; use DEFAULT tablespace in dev.)

-- ─── Roles ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sampler_app') THEN
    CREATE ROLE sampler_app LOGIN PASSWORD 'sampler_app_pw';
  END IF;
END $$;

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- trigram similarity for fuzzy name search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- GIN indexes on composite types

-- ─── Enumerations ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE audio_format AS ENUM ('wav','aiff','flac','mp3','ogg','opus','aac','caf');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE instrument_category AS ENUM (
    'drums','percussion','bass','keys','piano','guitar','strings',
    'brass','woodwinds','vocals','synth','fx','loops','one_shots','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE musical_key AS ENUM (
    'C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B',
    'Cm','C#m','Dbm','Dm','D#m','Ebm','Em','Fm','F#m','Gbm','Gm','G#m','Abm','Am','A#m','Bbm','Bm',
    'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE analysis_status AS ENUM ('pending','processing','complete','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── sample_packs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sample_packs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  vendor          TEXT,
  version         TEXT,
  description     TEXT,
  category        instrument_category,
  tags            TEXT[]              DEFAULT '{}',
  total_samples   INTEGER             DEFAULT 0,
  total_size_bytes BIGINT             DEFAULT 0,
  metadata        JSONB               DEFAULT '{}',
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packs_name_trgm
  ON sample_packs USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_packs_tags
  ON sample_packs USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_packs_category
  ON sample_packs (category);

-- ─── samples (partitioned by instrument_category) ─────────────────────────────
CREATE TABLE IF NOT EXISTS samples (
  id                UUID            NOT NULL DEFAULT uuid_generate_v4(),
  pack_id           UUID            REFERENCES sample_packs(id) ON DELETE CASCADE,
  name              TEXT            NOT NULL,
  filename          TEXT            NOT NULL,
  file_path         TEXT            NOT NULL,
  format            audio_format    NOT NULL,
  file_size_bytes   BIGINT          NOT NULL DEFAULT 0,
  duration_ms       INTEGER,                            -- milliseconds
  sample_rate       INTEGER,                            -- Hz (44100, 48000, 96000, 192000)
  bit_depth         SMALLINT,                           -- 16, 24, 32
  channels          SMALLINT        NOT NULL DEFAULT 2, -- 1=mono 2=stereo
  instrument_cat    instrument_category NOT NULL DEFAULT 'other',
  root_note         TEXT,                               -- e.g. "C4", "A3"
  musical_key       musical_key     DEFAULT 'unknown',
  tempo_bpm         NUMERIC(6,2),
  loop_enabled      BOOLEAN         NOT NULL DEFAULT FALSE,
  loop_start_ms     INTEGER,
  loop_end_ms       INTEGER,
  tags              TEXT[]          DEFAULT '{}',
  metadata          JSONB           DEFAULT '{}',
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, instrument_cat)
) PARTITION BY LIST (instrument_cat);

-- Partitions (one per instrument_category value)
CREATE TABLE IF NOT EXISTS samples_drums       PARTITION OF samples FOR VALUES IN ('drums');
CREATE TABLE IF NOT EXISTS samples_percussion  PARTITION OF samples FOR VALUES IN ('percussion');
CREATE TABLE IF NOT EXISTS samples_bass        PARTITION OF samples FOR VALUES IN ('bass');
CREATE TABLE IF NOT EXISTS samples_keys        PARTITION OF samples FOR VALUES IN ('keys');
CREATE TABLE IF NOT EXISTS samples_piano       PARTITION OF samples FOR VALUES IN ('piano');
CREATE TABLE IF NOT EXISTS samples_guitar      PARTITION OF samples FOR VALUES IN ('guitar');
CREATE TABLE IF NOT EXISTS samples_strings     PARTITION OF samples FOR VALUES IN ('strings');
CREATE TABLE IF NOT EXISTS samples_brass       PARTITION OF samples FOR VALUES IN ('brass');
CREATE TABLE IF NOT EXISTS samples_woodwinds   PARTITION OF samples FOR VALUES IN ('woodwinds');
CREATE TABLE IF NOT EXISTS samples_vocals      PARTITION OF samples FOR VALUES IN ('vocals');
CREATE TABLE IF NOT EXISTS samples_synth       PARTITION OF samples FOR VALUES IN ('synth');
CREATE TABLE IF NOT EXISTS samples_fx          PARTITION OF samples FOR VALUES IN ('fx');
CREATE TABLE IF NOT EXISTS samples_loops       PARTITION OF samples FOR VALUES IN ('loops');
CREATE TABLE IF NOT EXISTS samples_one_shots   PARTITION OF samples FOR VALUES IN ('one_shots');
CREATE TABLE IF NOT EXISTS samples_other       PARTITION OF samples FOR VALUES IN ('other');

-- Indexes on parent table (propagated to all partitions in PG14+)
CREATE INDEX IF NOT EXISTS idx_samples_name_trgm
  ON samples USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_samples_tags
  ON samples USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_samples_pack_id
  ON samples (pack_id);
CREATE INDEX IF NOT EXISTS idx_samples_key
  ON samples (musical_key);
CREATE INDEX IF NOT EXISTS idx_samples_tempo
  ON samples (tempo_bpm);
CREATE INDEX IF NOT EXISTS idx_samples_format
  ON samples (format);
CREATE INDEX IF NOT EXISTS idx_samples_created
  ON samples (created_at DESC);

-- Full-text search vector
ALTER TABLE samples ADD COLUMN IF NOT EXISTS tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'B')
  ) STORED;
CREATE INDEX IF NOT EXISTS idx_samples_tsv ON samples USING gin (tsv);

-- ─── sample_analyses ──────────────────────────────────────────────────────────
-- AI-generated analysis results; one row per sample.
CREATE TABLE IF NOT EXISTS sample_analyses (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id         UUID        NOT NULL,
  sample_cat        instrument_category NOT NULL,
  status            analysis_status NOT NULL DEFAULT 'pending',
  analyzed_at       TIMESTAMPTZ,
  -- Waveform preview (downsampled to ~1000 points, stored as JSONB array)
  waveform_preview  JSONB,
  -- Spectral centroid, rolloff, flatness, etc.
  spectral          JSONB       DEFAULT '{}',
  -- Pitch analysis
  detected_pitch_hz NUMERIC(10,4),
  detected_key      musical_key DEFAULT 'unknown',
  -- Tempo / rhythm
  detected_bpm      NUMERIC(6,2),
  beat_positions_ms INTEGER[],
  -- Loudness
  lufs_integrated   NUMERIC(6,2),  -- LUFS integrated
  lufs_range        NUMERIC(6,2),  -- LU range
  peak_dbfs         NUMERIC(6,2),
  rms_dbfs          NUMERIC(6,2),
  -- AI model output
  ai_tags           TEXT[]      DEFAULT '{}',
  ai_confidence     NUMERIC(4,3),  -- 0.000–1.000
  ai_model_version  TEXT,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (sample_id, sample_cat) REFERENCES samples(id, instrument_cat) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analyses_sample_id   ON sample_analyses (sample_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status       ON sample_analyses (status);
CREATE INDEX IF NOT EXISTS idx_analyses_key          ON sample_analyses (detected_key);
CREATE INDEX IF NOT EXISTS idx_analyses_bpm          ON sample_analyses (detected_bpm);
CREATE INDEX IF NOT EXISTS idx_analyses_ai_tags      ON sample_analyses USING gin (ai_tags);

-- ─── sample_collections ───────────────────────────────────────────────────────
-- User-defined playlists/collections of samples (cross-category)
CREATE TABLE IF NOT EXISTS sample_collections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  tags        TEXT[]  DEFAULT '{}',
  metadata    JSONB   DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sample_collection_items (
  collection_id   UUID NOT NULL REFERENCES sample_collections(id) ON DELETE CASCADE,
  sample_id       UUID NOT NULL,
  sample_cat      instrument_category NOT NULL,
  position        INTEGER NOT NULL DEFAULT 0,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, sample_id, sample_cat),
  FOREIGN KEY (sample_id, sample_cat) REFERENCES samples(id, instrument_cat) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection
  ON sample_collection_items (collection_id, position);

-- ─── storage_stats view ───────────────────────────────────────────────────────
CREATE OR REPLACE VIEW storage_stats AS
SELECT
  instrument_cat,
  COUNT(*)                              AS sample_count,
  SUM(file_size_bytes)                  AS total_bytes,
  pg_size_pretty(SUM(file_size_bytes))  AS total_pretty,
  AVG(duration_ms)::INTEGER             AS avg_duration_ms,
  MAX(file_size_bytes)                  AS max_file_bytes
FROM samples
GROUP BY instrument_cat
ORDER BY total_bytes DESC;

-- ─── library_stats view ───────────────────────────────────────────────────────
CREATE OR REPLACE VIEW library_stats AS
SELECT
  COUNT(*)                                     AS total_samples,
  SUM(file_size_bytes)                         AS total_bytes,
  pg_size_pretty(SUM(file_size_bytes))         AS total_size_pretty,
  (SELECT COUNT(*) FROM sample_packs)          AS total_packs,
  (SELECT COUNT(*) FROM sample_analyses
   WHERE status = 'complete')                  AS analysed_samples,
  (SELECT COUNT(*) FROM sample_analyses
   WHERE status = 'pending')                   AS pending_analyses,
  ROUND(SUM(duration_ms)::NUMERIC / 1000 / 60, 1) AS total_minutes
FROM samples;

-- ─── update triggers ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['sample_packs','sample_analyses','sample_collections'] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── pack counter trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_pack_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sample_packs SET
      total_samples    = total_samples + 1,
      total_size_bytes = total_size_bytes + NEW.file_size_bytes,
      updated_at       = NOW()
    WHERE id = NEW.pack_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sample_packs SET
      total_samples    = GREATEST(total_samples - 1, 0),
      total_size_bytes = GREATEST(total_size_bytes - OLD.file_size_bytes, 0),
      updated_at       = NOW()
    WHERE id = OLD.pack_id;
  END IF;
  RETURN NULL;
END; $$;

DO $$
BEGIN
  CREATE TRIGGER trg_pack_stats
    AFTER INSERT OR DELETE ON samples
    FOR EACH ROW EXECUTE FUNCTION sync_pack_stats();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Grants ───────────────────────────────────────────────────────────────────
GRANT CONNECT ON DATABASE sampler TO sampler_app;
GRANT USAGE ON SCHEMA public TO sampler_app;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON sample_packs, samples, sample_analyses, sample_collections, sample_collection_items
  TO sampler_app;
GRANT SELECT ON storage_stats, library_stats TO sampler_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sampler_app;
