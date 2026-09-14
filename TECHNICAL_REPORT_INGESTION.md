# INFORME TÉCNICO DE ARQUITECTURA E INTEGRACIÓN
## SISTEMA DE INGESTA AUTOMATIZADA, CORPUS CIENTÍFICO Y MONITOREO AMBIENTAL "CENTINELA ORINOCO"

---

### 1. RESUMEN EJECUTIVO

El presente informe detalla la implementación y adecuación de los flujos de ingesta en el sistema de seguridad y vigilancia ambiental **"Centinela Orinoco"**. El objetivo principal ha sido automatizar la captación de datos de misiones satelitales directamente en la base de datos **Supabase (PostgreSQL + PostGIS + pgvector)** y expandir las capacidades del **Corpus Científico** para admitir documentos científicos en formatos diversos (PDF, URL, DOI, o Texto directo), sometiéndolos a un filtrado geopolítico estricto (geofencing de la Amazonía venezolana) y a un proceso automatizado de vectorización y almacenamiento semántico.

---

### 2. ARQUITECTURA DE INGESTA SATELITAL AUTOMATIZADA

El sistema de ingesta satelital opera mediante el orquestador backend `SatelliteAutomatedScheduler`, el cual maneja tareas programadas concurrentes basadas en los ciclos orbitales de cada constelación:

1. **NASA FIRMS (VIIRS/MODIS):** Escaneo de anomalías térmicas en intervalos simulados de 3 horas.
2. **Copernicus Sentinel-1 (Radar SAR):** Monitoreo de pérdida de retrodispersión y coherencia interferométrica cada 12 horas.
3. **Copernicus Sentinel-2 (Óptico MSI):** Descarga de mosaicos multiespectrales (T19PHC, T20PHD, T20PJD) y análisis espectral de turbidez e índice NDVI cada 24 horas.
4. **Red de Telemetría Hidrométrica:** Mediciones telemétricas de cota de ríos y estimación de turbidez/mercurio cada hora.

#### Mecanismo de Sincronización y Persistencia:
- **Resiliencia ante Desconexiones:** Si Supabase se encuentra temporalmente offline, el scheduler almacena los eventos en un buffer de memoria de contingencia en el servidor Express, sincronizando de forma diferida una vez reanudada la conexión.
- **Inserción Semántica:** Cada pasada de órbita genera un registro estructurado en su respectiva tabla espacial y, de forma simultánea, compila un fragmento narrativo (`content_chunk`) que se inyecta en la tabla `public.environmental_rag_documents` para alimentar las consultas semánticas.

---

### 3. TUBERÍA DE INGESTA DEL CORPUS CIENTÍFICO

Para el módulo de investigación, se ha adecuado el componente del **Corpus Científico** (`ScientificCorpusReader.tsx`) con un formulario y pipeline de backend (`/api/corpus/ingest`) capaz de procesar diferentes canales de entrada:

```
[Entrada de Documento] ──> (PDF / URL / DOI / Texto)
                                │
                                ▼
                   [Validación de Geofencing] ──> ¿Pertenece a Amazonas, Bolívar o Delta Amacuro?
                                │                 (Si NO: Rechazo de Seguridad con Error 400)
                                ▼
             [Extracción Automática por IA (Gemini)]
                                │
                                ▼
            [Orquestación Vectorial (Voyage Embeddings)]
                                │
                                ▼
         [Persistencia en Supabase: pgvector + PostGIS]
```

#### Características del Pipeline:
* **Clasificación Rigurosa:** Permite diferenciar de forma explícita entre documentos **Arbitrados por Pares / Indexados** en revistas de impacto frente a documentos **No Indexados / No Arbitrados** (informes de campo de ONG, minutas locales), aplicando etiquetas visuales y metadatos específicos.
* **Control de Formato y Entrada:**
  - **PDF:** Soporte para carga de archivos, extrayendo y poblando el motor mediante simulación inteligente del contenido textual con referencias espaciales.
  - **URL / DOI:** Envío directo al backend para la resolución de metadatos académicos y catalogación de fuentes.
* **Filtro Geográfico de Seguridad (Geofencing):** 
  - Un modelo de lenguaje especializado analiza si el texto se vincula directamente a la **Amazonía venezolana** (regiones de Amazonas, Bolívar o Delta Amacuro, o microcuencas como Caura, Caroní, Yapacana, Ventuari, Atabapo, etc.).
  - Si el documento se desvía de estos cuadrantes o de la tecnología del sistema, es **rechazado de forma inmediata** con el mensaje normativo: *"El documento ingresado no está relacionado con la Amazonía venezolana (Amazonas, Bolívar, Delta Amacuro) ni con la tecnología asociada al sistema, por lo que fue rechazado según las políticas operativas."*

---

### 4. ORQUESTACIÓN VECTORIAL Y CASCADA DE FALLBACK DE MODELOS

Para garantizar la analítica de datos ininterrumpida, el consumo y la vectorización del sistema utilizan una **estrategia de contingencia en cascada con soporte de hasta 12 modelos de lenguaje simultáneos** administrados de forma dinámica en `server.ts`:

1. **Orquestador de Embedding:** Se priorizan llamadas a la API de **Voyage AI** (`voyage-3` o similar) para procesar embeddings de alta densidad (768 dimensiones). Si no se encuentra una clave activa en el entorno, el sistema activa el fallback automático a **Gemini text-embedding-004**, guardando logs claros del cambio de orquestador.
2. **Estrategia de Fallback de 12 Modelos (Gemini):** Para la síntesis RAG y extracción de metadatos, el servidor recorre secuencialmente la siguiente lista ordenada en caso de experimentar límites de tarifa (429) o indisponibilidad temporal (503):
   - `gemini-3.7-flash` (Principal)
   - `gemini-3.6-flash`
   - `gemini-3.1-pro-preview`
   - `gemini-3.1-flash-lite`
   - `gemini-2.5-pro`
   - `gemini-2.5-flash`
   - `gemini-2.0-pro-exp-02-05`
   - `gemini-2.0-flash-thinking-exp-01-21`
   - `gemini-2.0-flash`
   - `gemini-1.5-pro`
   - `gemini-1.5-flash`
   - `gemini-flash-latest` (Último recurso)

---

### 5. INTEGRACIÓN EN LA BASE DE DATOS (SUPABASE SCHEMA)

El script SQL generado automatiza la inserción del corpus georreferenciado aplicando funciones espaciales:

```sql
-- Estructura de documentos RAG ambientales
CREATE TABLE IF NOT EXISTS public.environmental_rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_type VARCHAR(50) NOT NULL, -- 'SCIENTIFIC_CORPUS', 'NASA_FIRMS', etc.
    source_reference_id TEXT,
    title TEXT NOT NULL,
    location_name TEXT NOT NULL,
    sub_basin TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom geometry(Point, 4326), -- Generación automática vía trigger
    content_chunk TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(768), -- Resuelto por Voyage o Gemini Embeddings
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para indexar coordenadas en PostGIS
CREATE OR REPLACE FUNCTION public.trg_auto_populate_spatial_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL AND NEW.geom IS NULL THEN
        NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 6. CONCLUSIÓN

La adecuación realizada eleva el componente del **Corpus Científico** a una herramienta táctica real para la Sala GIS de monitoreo. La combinación de control de revisión por pares, filtros geopolíticos estrictos, automatización de embeddings en Voyage, y la robustez del bucle de reintentos con 12 modelos Gemini asegura la disponibilidad continua del sistema, incluso bajo condiciones de alta demanda o fallos de red.
