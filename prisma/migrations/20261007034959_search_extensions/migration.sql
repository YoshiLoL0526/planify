-- Búsqueda global (RF-303, RF-304): unaccent para ignorar acentos y pg_trgm
-- para futuras optimizaciones de búsqueda difusa con índices GIN.
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
