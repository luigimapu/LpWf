# Schedulazione job di sincronizzazione

Per automatizzare il ciclo tenant ↔ hub sono necessari due task pianificati (cron o Scheduled Task di Plesk).

## 1. Push eventi dal tenant all'hub
```
/opt/plesk/php/8.2/bin/php /var/www/vhosts/lprent.it/httpdocs/LpWF_refactor/tools/sync_push.php 100 >> /var/log/lpwf_sync_push.log 2>&1
```
- Parametro opzionale (`100`): numero massimo di eventi gestiti per esecuzione.
- Frequenza consigliata: ogni 5 minuti.

## 2. Elaborazione eventi lato hub
```
/opt/plesk/php/8.2/bin/php /var/www/vhosts/lprent.it/httpdocs/LpWF_refactor/tools/hub_process_events.php 100 >> /var/log/lpwf_hub_process.log 2>&1
```
- Frequenza consigliata: stessa cadenza del push, sfalsata di qualche minuto per evitare overlap (es. push ai minuti 0/5/10…, processor ai minuti 2/7/12…).

## Considerazioni operative
- Eseguire i task con l'utente del dominio in Plesk per garantire permessi sui file.
- Controllare che `.env` sia coerente (DB, HUB_API_BASE, shared secret). In ambienti di test è possibile mantenere `HUB_API_VERIFY_SSL=0`; in produzione impostarlo a `1` e utilizzare certificati validi.
- I log indicati (`/var/log/...`) sono suggerimenti: crearli o adattarli in base alla policy del server.
- Aggiungere eventuali alert (es. `MAILTO=...` nella crontab) per notificare errori.
- Se il volume cresce, valutare intervalli più ravvicinati o un worker dedicato.

