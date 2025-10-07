USE hub_catalogo;

-- Tenant demo
INSERT INTO tenants (ragione_sociale, slug, stato)
VALUES ('Tenant Demo', 'tenant-demo', 'ATTIVO')
ON DUPLICATE KEY UPDATE stato = VALUES(stato);

SET @tenant_id = (
  SELECT id FROM tenants WHERE slug = 'tenant-demo' ORDER BY id LIMIT 1
);

-- Set attributi per servizi di noleggio (idempotente anche senza unique su nome)
INSERT INTO set_attributi (nome, descrizione, tipologia_destinazione)
SELECT 'SERVIZI_NOLEGGIO', 'Attributi standard per servizi di noleggio', 'SERVIZIO'
WHERE NOT EXISTS (
  SELECT 1 FROM set_attributi WHERE nome = 'SERVIZI_NOLEGGIO'
);

SET @set_id = (
  SELECT id FROM set_attributi WHERE nome = 'SERVIZI_NOLEGGIO' ORDER BY id LIMIT 1
);

INSERT INTO attributi (set_attributi_id, nome_tecnico, etichetta, tipo_dato, obbligatorio)
VALUES
  (@set_id, 'categoria_vehicle', 'Categoria veicolo', 'TESTO', 1),
  (@set_id, 'conducente_incluso', 'Conducente incluso', 'BOOLEANO', 0),
  (@set_id, 'chilometri_inclusi', 'Chilometri inclusi', 'NUMERO', 0)
ON DUPLICATE KEY UPDATE etichetta = VALUES(etichetta);

-- Tassonomia base
INSERT INTO categorie (nome, slug)
VALUES
  ('Automotive', 'automotive'),
  ('Noleggio', 'noleggio'),
  ('Servizi ausiliari', 'servizi-ausiliari')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

SET @cat_auto = (SELECT id FROM categorie WHERE slug = 'automotive');
SET @cat_noleggio = (SELECT id FROM categorie WHERE slug = 'noleggio');
SET @cat_servizi = (SELECT id FROM categorie WHERE slug = 'servizi-ausiliari');

-- Articolo principale
INSERT INTO articoli (tenant_id, sku_globale, tipologia, titolo, sottotitolo, descrizione, stato_pubblicazione, visibilita, set_attributi_id)
VALUES
  (@tenant_id, 'TENANTDEMO-0001', 'SERVIZIO', 'Noleggio auto berlina', 'Auto 5 posti', 'Servizio di noleggio con chilometraggio base', 'PUBBLICATO', 'MARKETPLACE', @set_id)
ON DUPLICATE KEY UPDATE titolo = VALUES(titolo);

SET @articolo_id = (
  SELECT id FROM articoli WHERE sku_globale = 'TENANTDEMO-0001' ORDER BY id LIMIT 1
);

INSERT IGNORE INTO articoli_categorie (articolo_id, categoria_id)
VALUES (@articolo_id, @cat_auto), (@articolo_id, @cat_noleggio);

INSERT INTO valori_attributi (articolo_id, variante_id, attributo_id, valore_testo, valore_booleano)
SELECT @articolo_id, NULL, a.id,
       CASE a.nome_tecnico WHEN 'categoria_vehicle' THEN 'BERLINA' END,
       CASE a.nome_tecnico WHEN 'conducente_incluso' THEN 0 END
FROM attributi a
WHERE a.set_attributi_id = @set_id
ON DUPLICATE KEY UPDATE valore_testo = VALUES(valore_testo), valore_booleano = VALUES(valore_booleano);

-- Variante principale
INSERT INTO articoli_varianti (articolo_id, sku, nome, stato)
VALUES (@articolo_id, 'TENANTDEMO-0001-A', 'Noleggio giornaliero', 'ATTIVO')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

SET @variante_id = (
  SELECT id FROM articoli_varianti WHERE sku = 'TENANTDEMO-0001-A' ORDER BY id LIMIT 1
);

-- Scorte e disponibilità
INSERT INTO scorte (variante_id, tenant_id, magazzino_id, quantita_totale, quantita_disponibile, versione_sync)
VALUES (@variante_id, @tenant_id, 'HUB', 10, 10, 1)
ON DUPLICATE KEY UPDATE quantita_totale = VALUES(quantita_totale), quantita_disponibile = VALUES(quantita_disponibile);

INSERT INTO disponibilita_slot (variante_id, inizio, fine, capacita_totale, capacita_prenotata)
VALUES (@variante_id, DATE_ADD(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 10 HOUR, 3, 0)
ON DUPLICATE KEY UPDATE capacita_totale = VALUES(capacita_totale);

-- Listino e prezzo
INSERT INTO listini (tenant_id, codice, nome, valuta, valido_dal)
VALUES (@tenant_id, 'DEFAULT', 'Listino base', 'EUR', CURDATE())
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

SET @listino_id = (
  SELECT id FROM listini WHERE tenant_id = @tenant_id AND codice = 'DEFAULT' ORDER BY id LIMIT 1
);

INSERT INTO prezzi_articoli (listino_id, variante_id, prezzo, prezzo_confronto, quantita_minima)
VALUES (@listino_id, @variante_id, 65.00, 80.00, 1)
ON DUPLICATE KEY UPDATE prezzo = VALUES(prezzo), prezzo_confronto = VALUES(prezzo_confronto);

-- Risorsa multimediale
INSERT INTO risorse_multimediali (tenant_id, articolo_id, tipologia, url, testo_alternativo, posizione)
VALUES (@tenant_id, @articolo_id, 'IMMAGINE', 'https://example.com/images/noleggio-berlina.jpg', 'Auto berlina', 1)
ON DUPLICATE KEY UPDATE url = VALUES(url);

-- Servizio ausiliario correlato
INSERT INTO articoli (tenant_id, sku_globale, tipologia, titolo, sottotitolo, descrizione, stato_pubblicazione, visibilita)
VALUES (@tenant_id, 'TENANTDEMO-0002', 'SERVIZIO', 'Servizio auto sostitutiva', 'Veicolo sostitutivo', 'Servizio complementare per clienti in attesa di riparazione', 'PUBBLICATO', 'MARKETPLACE')
ON DUPLICATE KEY UPDATE titolo = VALUES(titolo);

SET @ausiliario_id = (
  SELECT id FROM articoli WHERE sku_globale = 'TENANTDEMO-0002' ORDER BY id LIMIT 1
);

INSERT INTO articoli_relazioni (articolo_sorgente_id, articolo_correlato_id, tipo_relazione, priorita)
VALUES (@articolo_id, @ausiliario_id, 'SERVIZIO_AUSILIARIO', 10)
ON DUPLICATE KEY UPDATE priorita = VALUES(priorita);

-- ==============================
-- Prodotti aggiuntivi di esempio
-- ==============================

-- Noleggio SUV
INSERT INTO articoli (tenant_id, sku_globale, tipologia, titolo, sottotitolo, descrizione, stato_pubblicazione, visibilita, set_attributi_id)
VALUES
  (@tenant_id, 'TENANTDEMO-0003', 'SERVIZIO', 'Noleggio SUV', 'SUV 5 posti', 'Servizio di noleggio SUV con chilometraggio base', 'PUBBLICATO', 'MARKETPLACE', @set_id)
ON DUPLICATE KEY UPDATE titolo = VALUES(titolo);

SET @articolo3_id = (
  SELECT id FROM articoli WHERE sku_globale = 'TENANTDEMO-0003' ORDER BY id LIMIT 1
);

INSERT IGNORE INTO articoli_categorie (articolo_id, categoria_id)
VALUES (@articolo3_id, @cat_auto), (@articolo3_id, @cat_noleggio);

INSERT INTO valori_attributi (articolo_id, variante_id, attributo_id, valore_testo, valore_booleano)
SELECT @articolo3_id, NULL, a.id,
       CASE a.nome_tecnico WHEN 'categoria_vehicle' THEN 'SUV' END,
       CASE a.nome_tecnico WHEN 'conducente_incluso' THEN 0 END
FROM attributi a
WHERE a.set_attributi_id = @set_id
ON DUPLICATE KEY UPDATE valore_testo = VALUES(valore_testo), valore_booleano = VALUES(valore_booleano);

-- Varianti SUV
INSERT INTO articoli_varianti (articolo_id, sku, nome, stato)
VALUES
  (@articolo3_id, 'TENANTDEMO-0003-A', 'Noleggio giornaliero', 'ATTIVO'),
  (@articolo3_id, 'TENANTDEMO-0003-B', 'Noleggio weekend', 'ATTIVO')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

SET @var3a_id = (
  SELECT id FROM articoli_varianti WHERE sku = 'TENANTDEMO-0003-A' ORDER BY id LIMIT 1
);
SET @var3b_id = (
  SELECT id FROM articoli_varianti WHERE sku = 'TENANTDEMO-0003-B' ORDER BY id LIMIT 1
);

-- Scorte e slot SUV
INSERT INTO scorte (variante_id, tenant_id, magazzino_id, quantita_totale, quantita_disponibile, versione_sync)
VALUES
  (@var3a_id, @tenant_id, 'HUB', 5, 5, 1),
  (@var3b_id, @tenant_id, 'HUB', 5, 5, 1)
ON DUPLICATE KEY UPDATE quantita_totale = VALUES(quantita_totale), quantita_disponibile = VALUES(quantita_disponibile);

INSERT INTO disponibilita_slot (variante_id, inizio, fine, capacita_totale, capacita_prenotata)
VALUES
  (@var3a_id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 10 HOUR, 3, 0),
  (@var3b_id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY) + INTERVAL 48 HOUR, 2, 0)
ON DUPLICATE KEY UPDATE capacita_totale = VALUES(capacita_totale);

-- Prezzi SUV
INSERT INTO prezzi_articoli (listino_id, variante_id, prezzo, prezzo_confronto, quantita_minima)
VALUES
  (@listino_id, @var3a_id, 85.00, 99.00, 1),
  (@listino_id, @var3b_id, 200.00, 230.00, 1)
ON DUPLICATE KEY UPDATE prezzo = VALUES(prezzo), prezzo_confronto = VALUES(prezzo_confronto);

-- Immagine SUV (idempotente)
INSERT INTO risorse_multimediali (tenant_id, articolo_id, tipologia, url, testo_alternativo, posizione)
SELECT @tenant_id, @articolo3_id, 'IMMAGINE', 'https://example.com/images/noleggio-suv.jpg', 'SUV 5 posti', 1
WHERE NOT EXISTS (
  SELECT 1 FROM risorse_multimediali WHERE articolo_id = @articolo3_id AND url = 'https://example.com/images/noleggio-suv.jpg'
);

-- Noleggio furgone
INSERT INTO articoli (tenant_id, sku_globale, tipologia, titolo, sottotitolo, descrizione, stato_pubblicazione, visibilita, set_attributi_id)
VALUES
  (@tenant_id, 'TENANTDEMO-0004', 'SERVIZIO', 'Noleggio furgone', 'Furgone 2 posti', 'Noleggio furgone per trasporto merci', 'PUBBLICATO', 'MARKETPLACE', @set_id)
ON DUPLICATE KEY UPDATE titolo = VALUES(titolo);

SET @articolo4_id = (
  SELECT id FROM articoli WHERE sku_globale = 'TENANTDEMO-0004' ORDER BY id LIMIT 1
);

INSERT IGNORE INTO articoli_categorie (articolo_id, categoria_id)
VALUES (@articolo4_id, @cat_auto), (@articolo4_id, @cat_noleggio);

INSERT INTO valori_attributi (articolo_id, variante_id, attributo_id, valore_testo, valore_booleano)
SELECT @articolo4_id, NULL, a.id,
       CASE a.nome_tecnico WHEN 'categoria_vehicle' THEN 'FURGONE' END,
       CASE a.nome_tecnico WHEN 'conducente_incluso' THEN 0 END
FROM attributi a
WHERE a.set_attributi_id = @set_id
ON DUPLICATE KEY UPDATE valore_testo = VALUES(valore_testo), valore_booleano = VALUES(valore_booleano);

-- Variante furgone
INSERT INTO articoli_varianti (articolo_id, sku, nome, stato)
VALUES (@articolo4_id, 'TENANTDEMO-0004-A', 'Noleggio giornaliero', 'ATTIVO')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

SET @var4a_id = (
  SELECT id FROM articoli_varianti WHERE sku = 'TENANTDEMO-0004-A' ORDER BY id LIMIT 1
);

INSERT INTO scorte (variante_id, tenant_id, magazzino_id, quantita_totale, quantita_disponibile, versione_sync)
VALUES (@var4a_id, @tenant_id, 'HUB', 4, 4, 1)
ON DUPLICATE KEY UPDATE quantita_totale = VALUES(quantita_totale), quantita_disponibile = VALUES(quantita_disponibile);

INSERT INTO disponibilita_slot (variante_id, inizio, fine, capacita_totale, capacita_prenotata)
VALUES (@var4a_id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY) + INTERVAL 8 HOUR, 2, 0)
ON DUPLICATE KEY UPDATE capacita_totale = VALUES(capacita_totale);

INSERT INTO prezzi_articoli (listino_id, variante_id, prezzo, prezzo_confronto, quantita_minima)
VALUES (@listino_id, @var4a_id, 90.00, 110.00, 1)
ON DUPLICATE KEY UPDATE prezzo = VALUES(prezzo), prezzo_confronto = VALUES(prezzo_confronto);

INSERT INTO risorse_multimediali (tenant_id, articolo_id, tipologia, url, testo_alternativo, posizione)
SELECT @tenant_id, @articolo4_id, 'IMMAGINE', 'https://example.com/images/noleggio-furgone.jpg', 'Furgone merci', 1
WHERE NOT EXISTS (
  SELECT 1 FROM risorse_multimediali WHERE articolo_id = @articolo4_id AND url = 'https://example.com/images/noleggio-furgone.jpg'
);

-- Prodotto fisico: Batteria auto 12V 60Ah
INSERT INTO articoli (tenant_id, sku_globale, tipologia, titolo, sottotitolo, descrizione, stato_pubblicazione, visibilita)
VALUES (@tenant_id, 'TENANTDEMO-P0001', 'FISICO', 'Batteria auto 12V 60Ah', 'Avviamento affidabile', 'Batteria per auto 12V 60Ah', 'PUBBLICATO', 'MARKETPLACE')
ON DUPLICATE KEY UPDATE titolo = VALUES(titolo);

SET @articoloP1_id = (
  SELECT id FROM articoli WHERE sku_globale = 'TENANTDEMO-P0001' ORDER BY id LIMIT 1
);

INSERT IGNORE INTO articoli_categorie (articolo_id, categoria_id)
VALUES (@articoloP1_id, @cat_auto);

INSERT INTO articoli_varianti (articolo_id, sku, nome, stato)
VALUES (@articoloP1_id, 'TENANTDEMO-P0001-A', '60Ah', 'ATTIVO')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

SET @varP1a_id = (
  SELECT id FROM articoli_varianti WHERE sku = 'TENANTDEMO-P0001-A' ORDER BY id LIMIT 1
);

INSERT INTO scorte (variante_id, tenant_id, magazzino_id, quantita_totale, quantita_disponibile, versione_sync)
VALUES (@varP1a_id, @tenant_id, 'HUB', 20, 20, 1)
ON DUPLICATE KEY UPDATE quantita_totale = VALUES(quantita_totale), quantita_disponibile = VALUES(quantita_disponibile);

INSERT INTO prezzi_articoli (listino_id, variante_id, prezzo, prezzo_confronto, quantita_minima)
VALUES (@listino_id, @varP1a_id, 120.00, 150.00, 1)
ON DUPLICATE KEY UPDATE prezzo = VALUES(prezzo), prezzo_confronto = VALUES(prezzo_confronto);

INSERT INTO risorse_multimediali (tenant_id, articolo_id, tipologia, url, testo_alternativo, posizione)
SELECT @tenant_id, @articoloP1_id, 'IMMAGINE', 'https://example.com/images/batteria-12v-60ah.jpg', 'Batteria auto 60Ah', 1
WHERE NOT EXISTS (
  SELECT 1 FROM risorse_multimediali WHERE articolo_id = @articoloP1_id AND url = 'https://example.com/images/batteria-12v-60ah.jpg'
);
