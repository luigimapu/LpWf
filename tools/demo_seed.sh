#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-https://95.110.227.54/LpWF_refactor/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASS="${ADMIN_PASS:-Admin!2024}"

login() {
  curl -sk -X POST -H 'Content-Type: application/json' \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
    "$API_BASE/auth/login" | php -r 'echo json_decode(stream_get_contents(STDIN))->access_token ?? "";'
}

TOKEN=$(login)
if [ -z "$TOKEN" ]; then echo "Login fallito"; exit 1; fi

# Crea N istanze con un sottoworkflow ciascuna e completa i task del sottoworkflow
N=${1:-3}
echo "Creo $N istanze demo..."
for i in $(seq 1 "$N"); do
  curl -sk -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
    -X POST "$API_BASE/workflows/3/start" \
    -d "{\"entita_collegata_tipo\": \"DEMO\", \"entita_collegata_id\": \"SEED-$i\"}" >/dev/null

  PARENT_ID=$(curl -sk -H "Authorization: Bearer $TOKEN" "$API_BASE/workflowistanze" | php -r '$d=json_decode(stream_get_contents(STDIN),true); usort($d,function($a,$b){return $b["id"]<=>$a["id"];}); echo $d[0]["id"] ?? "";')
  [ -n "$PARENT_ID" ] || continue

  TASKS_JSON=$(curl -sk -H "Authorization: Bearer $TOKEN" "$API_BASE/tasks?workflow_istanza_id=$PARENT_ID")
  PARENT_TASK_ID=$(echo "$TASKS_JSON" | php -r '$d=json_decode(stream_get_contents(STDIN),true); if($d && count($d)) echo $d[0]["id"];')
  [ -n "$PARENT_TASK_ID" ] || continue

  NEW_SUBFLOW_JSON=$(curl -sk -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
    -X POST "$API_BASE/tasks/$PARENT_TASK_ID/start_subflow/3" \
    -d '{"id_utente_avvio":1, "assegna_a_utente_id":2}')
  SUB_ID=$(echo "$NEW_SUBFLOW_JSON" | php -r 'echo json_decode(stream_get_contents(STDIN))->id_nuova_istanza ?? "";')
  [ -n "$SUB_ID" ] || continue

  SUB_TASKS=$(curl -sk -H "Authorization: Bearer $TOKEN" "$API_BASE/tasks?workflow_istanza_id=$SUB_ID")
  php -r '
  $in=json_decode(stream_get_contents(STDIN),true);
  foreach($in as $t){
    if(($t["stato"]??$t["stato_nome"]??"")==="IN_LAVORAZIONE"){ echo $t["id"]."\n"; }
  }
  ' <<< "$SUB_TASKS" | while read -r TID; do
    curl -sk -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -X PUT "$API_BASE/tasks/$TID/complete" -d '{}' >/dev/null || true
  done
  echo "Creata istanza $PARENT_ID con sottoworkflow $SUB_ID"
done

echo "Fatto. Reload dashboard per vedere i badge."

