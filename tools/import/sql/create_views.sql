-- Create helper views in legacy DB for a clean import surface

-- VIEW for clienti (persona + cliente)
CREATE OR REPLACE VIEW vw_clienti_lp AS
SELECT 
  p.ID             AS src_id,
  p.azienda        AS ragione_sociale,
  p.partitaiva     AS partita_iva,
  p.email          AS email,
  p.formagiuridica AS tipo_cliente
FROM persona p
JOIN cliente c ON c.id_persona = p.ID;

