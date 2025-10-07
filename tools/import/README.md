# Import Toolkit (Legacy → LpWF)

This folder contains a thin, configurable ETL (extract–transform–load) to migrate data from the legacy platform into the new LpWF tenant DB, explicitly ignoring the workflow area (already reimplemented).

What this gives you
- A single PHP CLI (`import_cli.php`) that connects to a legacy MySQL database and to the target LpWF DB.
- A JSON mapping file (`mapping.json`) you can edit to tailor tables/fields to migrate and the transformations to apply.
- Dry-run mode, batching and idempotent upserts to validate before committing.

Quick start
1) Restore the provided dump into a local MySQL (read‑only user is fine):
   - mysql -uroot -p -e 'CREATE DATABASE legacy;'
   - mysql -uroot -p legacy < "uploads/vecchia_piattaforma/crm_lprent (2).sql"

2) Identify your target DB (the current tenant DB used by this repo). For local testing you can point to the same DB you run the app against.

2.1) Recommended: create a VIEW in legacy DB to expose "clienti" consistently (join persona/cliente)

Run in legacy DB (adjust table/column names if needed):

```
CREATE OR REPLACE VIEW vw_clienti_lp AS
SELECT 
  p.ID            AS src_id,
  p.azienda       AS ragione_sociale,
  p.partitaiva    AS partita_iva,
  p.email         AS email,
  p.formagiuridica AS tipo_cliente
FROM persona p
JOIN cliente c ON c.id_persona = p.ID;
```

Then, the mapping uses `vw_clienti_lp` as source for the `clienti` entity.

3) Edit `tools/import/mapping.json` to confirm source tables/columns:
   - By default it proposes: anagrafiche → clienti, documenti → documenti, pagamenti → pagamenti.
   - If the real tables differ (e.g. `persona`/`cliente`), adjust `source.table` and `fields[*].source`.

4) Dry run (no writes):
   - php tools/import/import_cli.php \
     --source-dsn="mysql:host=127.0.0.1;dbname=legacy;charset=utf8mb4" \
     --source-user=legacy_user --source-pass=secret \
     --target-dsn="mysql:host=127.0.0.1;dbname=tenant;charset=utf8mb4" \
     --target-user=tenant_user --target-pass=secret \
     --mapping=tools/import/mapping.json --entity=clienti --dry-run --limit=100

5) Apply (writes enabled): remove `--dry-run`. Always start with small `--limit` and ramp up.

Notes & conventions
- Workflow ignores: this importer never touches any table that matches `workflow*` patterns.
- Idempotency: inserts use `INSERT ... ON DUPLICATE KEY UPDATE` when a `unique_key` is defined in mapping. Otherwise, the importer will probe target by a `match_on` set of fields.
- Transforms: lightweight transforms are embedded (normalize email/vat, enum mappings, date parsing). Adjust as needed in mapping or in code.

Mapping file (mapping.json)
- Top-level `entities`: list of entities to import.
- Each entity:
  - `source.table`: name of legacy table.
  - `target.table`: LpWF target table.
  - `where` (optional): additional SQL filter on source (e.g. `deleted IS NULL`).
  - `unique_key` (optional): target unique key/constraint name to enable upsert.
  - `match_on` (optional): fields to match existing rows when upsert is not available.
  - `fields`: array of field mappings with `target`, `source`, and optional `transform`.

Examples are in `tools/import/mapping.json`.

Operational tips
- Start with `clienti` then related tables (documenti/pagamenti) in a second pass.
- Keep batch size conservative (e.g. `--batch=500`).
- After each run, validate counts and spot‑check samples.

Troubleshooting
- Large tables: use `--offset/--limit` windows.
- Schema mismatches: adjust mapping or add a tiny SQL view in legacy DB to flatten joins before import.
- Encoding: both DSNs default to `charset=utf8mb4`.
