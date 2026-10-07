#!/bin/sh
set -e

# Las migraciones se aplican en el servicio `migrate` (docker-compose.yml)
# antes de arrancar la app; aquí solo se levanta el servidor standalone.
exec node server.js
