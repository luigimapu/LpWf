# Design System LpWF

Questo design system punta a coniugare autorevolezza "enterprise" e vivacità da marketplace, garantendo coerenza visiva e scalabilità per tutti i moduli (tenant e hub).

## Identità cromatica

| Ruolo            | Colore  | Uso principale |
|------------------|---------|----------------|
| Primario         | `#1E2A4A` (Navy) | Header, testi rilevanti, icone principali |
| Secondario       | `#2563EB` (Blu brillante) | Pulsanti primari, stati attivi, link |
| Accent marketplace | `#F6A609` (Giallo ambra) | Badge marketplace, CTA promozionali, highlight |
| Success          | `#16A34A` (Verde) | Esiti positivi, pill di stato |
| Warning          | `#F97316` (Arancione) | Avvisi, soglie in scadenza |
| Danger           | `#DC2626` (Rosso) | Errori, alert critici |
| Neutro 900       | `#111827` | Testi primari |
| Neutro 500       | `#6B7280` | Testi secondari, etichette |
| Neutro 50        | `#F9FAFB` | Background app, card, sezioni |

### Gradienti suggeriti
- Hero / header: `linear-gradient(135deg, #1E2A4A 0%, #2563EB 100%)`
- Banner marketplace: `linear-gradient(135deg, #F6A609 0%, #F97316 100%)`

## Tipografia
- **Font primario**: `Inter` (sans-serif versatile, leggibile in contesti enterprise)
- **Font secondario / display**: `Poppins` per titoli brevi o numeri KPI, per dare un tocco più "market".

| Elemento          | Font      | Peso | Dimensione | Spaziatura |
|-------------------|-----------|------|------------|------------|
| H1 dashboard      | Poppins   | 600  | 32px       | 1.2        |
| H2 sezione        | Inter     | 600  | 24px       | 1.3        |
| Titolo card       | Inter     | 600  | 18px       | 1.4        |
| Corpo testo       | Inter     | 400  | 16px       | 1.6        |
| Caption / tag     | Inter     | 500  | 13px       | 1.4        |

## Spaziatura & layout
- Griglia base 8px (`4px` per elementi compatti, `16px/24px` per sezioni).
- Container centrale max-width `1280px` con padding orizzontale `24px`.
- Card: padding interno `24px`, border-radius `12px`, box-shadow morbido `0 12px 24px rgba(17,24,39,0.08)`.

## Componenti chiave

### Pulsanti
- **Primario**: background `#2563EB`, testo bianco, hover `#1D4ED8`, shadow lieve.
- **Secondario**: bordo `#2563EB`, testo blu, hover con background `rgba(37,99,235,0.08)`.
- **Marketplace CTA**: background gradiente ambra → arancio, testo navy.

### Badge / pill
| Stato             | Colore sfondo      | Colore testo |
|-------------------|--------------------|--------------|
| Marketplace       | `rgba(246,166,9,0.12)` | `#B45309` |
| Sincronizzato     | `rgba(37,99,235,0.12)` | `#1E40AF` |
| Errore            | `rgba(220,38,38,0.12)` | `#B91C1C` |

### Tabelle gestionali
- Header con testo `Inter 600 14px`, background `#F3F4F6`.
- Righe alternate con `#F9FAFB`.
- Stati rappresentati da badge.

### Card KPI
- Background gradiente leggero (navy trasparente).
- Icona rotonda (48px) con background `rgba(37,99,235,0.12)`.
- Valore principale `Poppins 600 28px`, descrizione `Inter 400 14px`.

## Iconografia
- Set outline 1.5px/2px (es. Heroicons) per coerenza con stile moderno.
- Usa colori neutrali (`#6B7280`) per icone passive, blu `#2563EB` per attive.

## Motion & feedback
- Transizioni `150ms ease` su hover/focus.
- Skeleton loader per liste lunghe con background `#E5E7EB`.

## Accessibilità
- Contrasto minimo 4.5:1 per testo normale, 3:1 per titoli.
- Focus state ben visibile: outline `2px` blu + `shadow` interno.

## Implementazione tecnica
- File base: `assets/css/app.css` (in cui definire variabili CSS custom, utility e componenti).
- Possibile supporto SCSS: definire palette e mixin per gradienti.
- Per grafici/KPI valutare integrazione con `Chart.js` o `ECharts`, applicando palette primaria + accenti.

## Prossimi passi
1. Creare foglio stile con CSS custom properties (`:root`) per palette/tipografia.
2. Applicare layout + card styled alle pagine `dashboard.html` e `mia_dashboard.html`.
3. Aggiornare componenti login/gestione workflow con nuovi pulsanti e badge.
4. Documentare esempi di componenti UI in una mini pagina "UI Kit" per riuso rapido.
