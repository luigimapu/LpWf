-- Idempotent-ish migration: add attivo to gruppi if missing
ALTER TABLE gruppi
  ADD COLUMN IF NOT EXISTS attivo TINYINT(1) NOT NULL DEFAULT 1 AFTER descrizione;

-- Backfill to ensure non-null/active
UPDATE gruppi SET attivo = 1 WHERE attivo IS NULL;

