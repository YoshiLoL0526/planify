#!/usr/bin/env bash
# Backup diario de Planify: base de datos + volumen de subidas (docs/10).
# Retención: 7 diarios y, además, las copias de los domingos durante 4 semanas
# (RNF-06). Programar con cron:
#   0 3 * * * /srv/planify/scripts/backup.sh >> /var/log/planify-backup.log 2>&1
set -euo pipefail

STACK_DIR="${PLANIFY_DIR:-/srv/planify}"
DIR="$STACK_DIR/backups"
STAMP="$(date +%F-%H%M)"
mkdir -p "$DIR"

cd "$STACK_DIR"

# 1. Base de datos
docker compose exec -T db pg_dump -U planify planify | gzip > "$DIR/db-$STAMP.sql.gz"

# 2. Volumen de subidas (nombre por defecto del proyecto compose: planify_uploads)
docker run --rm \
  -v planify_uploads:/data:ro \
  -v "$DIR":/backup \
  alpine tar czf "/backup/uploads-$STAMP.tar.gz" -C /data .

# 3. Retención
find "$DIR" -type f -mtime +7 | while read -r file; do
  base="$(basename "$file")"
  filedate="$(printf '%s' "$base" | sed -E 's/^(db|uploads)-([0-9]{4}-[0-9]{2}-[0-9]{2}).*/\2/')"
  # Conserva las copias de los domingos durante 4 semanas
  if [ -n "$filedate" ] \
    && [ "$(date -d "$filedate" +%u 2>/dev/null || echo 0)" = "7" ] \
    && [ "$(date -d "$filedate" +%s 2>/dev/null || echo 0)" -ge "$(date -d '28 days ago' +%s)" ]; then
    continue
  fi
  rm -f "$file"
done

echo "Backup completado: $STAMP"
