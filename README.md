# FrameFamily

A modular AI ecosystem focused on frame-based image generation, training, and visualization.

## Components

- **Training**  
  [FrameForge](https://github.com/MythosMachina/FrameForge)  
  AI training, dataset preparation, and orchestration within the Frame ecosystem.

- **Viewing**  
  [FrameView](https://github.com/MythosMachina/FrameView)  
  Visualization, inspection, and analysis of generated frames and training results.

- **Generating**  
  [FrameCreate](https://github.com/MythosMachina/FrameCreate)  
  Generative image AI of the Frame ecosystem.  
  _Work in Progress_

# FrameView

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node.js-required-green.svg)](https://nodejs.org/)

FrameView is a focused, high‑volume gallery for AI images.  
Drop your folders, reindex, and browse with clean tags, categories, and full metadata.

> FrameView is designed for fictional, stylized, and synthetic content.  
> Use on real individuals without consent is explicitly discouraged.

## Features
- Local‑first gallery: scans folders recursively and builds a fast index
- Metadata aware: reads prompts and generation settings from PNG text chunks
- Auto categories: the first prompt tag becomes a category
- Filters: tags, categories, model, LoRA, and search
- Detail view: large preview + full metadata
- Reindex on demand from the Settings screen

## Quick Start
1) Put images into:
   - `images/` (subfolders are supported)

2) Open the UI:
   - `http://<your-host>:4173`

3) Click **Settings → Reindex** after adding new images

## Installation
1) Install dependencies:
   - `npm install`

2) Edit environment values:
   - `.env.example` → `.env`

3) Set up database (Postgres):
   - `sudo ./scripts/setup_db.sh`

4) Build services:
   - `npm run build`

5) Start services (systemd):
   - `sudo ./scripts/setup_systemd.sh`
   Services created:
   - `frameview-api.service`
   - `frameview-ui.service`
   - `frameview-indexer.service`
   - `frameview-indexer.path`

6) Open the UI:
   - `http://<your-host>:4173`

## Usage Notes
- Tags are derived from `raw_prompt` (score tokens are ignored).
- Categories are auto‑generated from the first prompt tag.
- Use the top navigation to switch between Gallery, Tags & Categories, and Settings.
- **Side note:** FrameView currently reads prompt tags only. Flux‑style prompts are not parsed.

## Services
- `services/indexer` → scans and ingests metadata
- `services/api` → search/filter API
- `services/ui` → React gallery

## License
MIT
