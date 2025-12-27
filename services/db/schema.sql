CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  file_size BIGINT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  hash TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  hash TEXT
);

CREATE TABLE IF NOT EXISTS vaes (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  hash TEXT
);

CREATE TABLE IF NOT EXISTS samplers (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS schedulers (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS image_metadata (
  image_id UUID PRIMARY KEY REFERENCES images(id) ON DELETE CASCADE,
  raw_prompt TEXT NOT NULL,
  prompt TEXT,
  raw_negative_prompt TEXT,
  negative_prompt TEXT,
  model_id UUID REFERENCES models(id),
  sampler_id UUID REFERENCES samplers(id),
  scheduler_id UUID REFERENCES schedulers(id),
  vae_id UUID REFERENCES vaes(id),
  steps INT,
  cfg_scale NUMERIC,
  seed BIGINT,
  sharpness NUMERIC,
  adm_guidance TEXT,
  performance TEXT,
  clip_skip INT,
  version TEXT
);

CREATE TABLE IF NOT EXISTS loras (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  hash TEXT,
  UNIQUE(name, hash)
);

CREATE TABLE IF NOT EXISTS image_loras (
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  lora_id UUID REFERENCES loras(id) ON DELETE CASCADE,
  weight NUMERIC,
  PRIMARY KEY (image_id, lora_id)
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS image_tags (
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (image_id, tag_id)
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'user',
  source_tag TEXT
);

CREATE TABLE IF NOT EXISTS image_categories (
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (image_id, category_id)
);

CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  label TEXT,
  last_scanned_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS image_folders (
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  PRIMARY KEY (image_id, folder_id)
);

CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
CREATE INDEX IF NOT EXISTS idx_images_file_size ON images(file_size);
CREATE INDEX IF NOT EXISTS idx_images_dimensions ON images(width, height);
CREATE INDEX IF NOT EXISTS idx_metadata_seed ON image_metadata(seed);
CREATE INDEX IF NOT EXISTS idx_metadata_steps ON image_metadata(steps);
CREATE INDEX IF NOT EXISTS idx_metadata_cfg ON image_metadata(cfg_scale);
CREATE INDEX IF NOT EXISTS idx_model_name ON models(name);
CREATE INDEX IF NOT EXISTS idx_sampler_name ON samplers(name);
CREATE INDEX IF NOT EXISTS idx_scheduler_name ON schedulers(name);
CREATE INDEX IF NOT EXISTS idx_vae_name ON vaes(name);
CREATE INDEX IF NOT EXISTS idx_tags_name_kind ON tags(name, kind);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_kind ON categories(kind);
CREATE INDEX IF NOT EXISTS idx_image_tags_tag ON image_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_image_categories_category ON image_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_image_loras_lora ON image_loras(lora_id);
