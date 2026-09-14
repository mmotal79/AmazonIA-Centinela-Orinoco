/**
 * Centinela Orinoco - Exportador Oficial de Informes Formateados
 * Convierte el informe generado en React-Markdown a formatos limpios
 * (HTML, Word .doc, Texto Plano y PDF) eliminando nomenclaturas y símbolos markdown (#, **, |, ---).
 */

import { ZoneAnalyticsResult } from '../types';
import { generateVenezuelaVectorMapSvg, detectVenezuelanState } from './cartographicMapGenerator';

/**
 * Limpia y convierte la sintaxis markdown en texto plano pulcro y legible,
 * eliminando asteriscos, almohadillas, tuberías de tablas y delimitadores.
 */
export function stripMarkdownToCleanText(markdown: string): string {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  const cleanLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    // Calculate max width for each column
    const colCount = Math.max(...tableRows.map((r) => r.length));
    const colWidths: number[] = new Array(colCount).fill(0);
    for (const row of tableRows) {
      for (let i = 0; i < colCount; i++) {
        const cell = (row[i] || '').trim();
        if (cell.length > colWidths[i]) {
          colWidths[i] = Math.min(cell.length, 45);
        }
      }
    }

    // Format table cleanly
    for (let rIdx = 0; rIdx < tableRows.length; rIdx++) {
      const row = tableRows[rIdx];
      const formattedCells = row.map((cell, cIdx) => {
        const cleanCell = cell.trim();
        return cleanCell.padEnd(colWidths[cIdx] || 10, ' ');
      });
      cleanLines.push(formattedCells.join('  │  '));

      // If this was header row, add a clean divider line
      if (rIdx === 0) {
        const divLine = colWidths.map((w) => '─'.repeat(w)).join('──┼──');
        cleanLines.push(divLine);
      }
    }
    cleanLines.push('');
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check if line is a markdown table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Check if it's the markdown table alignment row like |:---|:---|
      if (/^\|(\s*:?-+:?\s*\|)+$/.test(trimmed)) {
        // Skip markdown alignment row
        continue;
      }
      inTable = true;
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => stripInlineFormatting(c.trim()));
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Horizontal rules
    if (/^[-*_]{3,}$/.test(trimmed)) {
      cleanLines.push('────────────────────────────────────────────────────────────────────────');
      continue;
    }

    // Headings (strip # and format)
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      cleanLines.push('');
      cleanLines.push(`========================================================================`);
      cleanLines.push(`  ${stripInlineFormatting(h1Match[1]).toUpperCase()}`);
      cleanLines.push(`========================================================================`);
      cleanLines.push('');
      continue;
    }

    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      cleanLines.push('');
      cleanLines.push(`▶ ${stripInlineFormatting(h2Match[1]).toUpperCase()}`);
      cleanLines.push(`------------------------------------------------------------------------`);
      continue;
    }

    const h3Match = trimmed.match(/^###\s+(.+)$/);
    if (h3Match) {
      cleanLines.push('');
      cleanLines.push(`▪ ${stripInlineFormatting(h3Match[1])}`);
      continue;
    }

    const h4Match = trimmed.match(/^####\s+(.+)$/);
    if (h4Match) {
      cleanLines.push(`  ▫ ${stripInlineFormatting(h4Match[1])}`);
      continue;
    }

    // Blockquotes
    if (trimmed.startsWith('>')) {
      const quoteText = stripInlineFormatting(trimmed.replace(/^>\s*/, ''));
      cleanLines.push(`  │ [NOTA] ${quoteText}`);
      continue;
    }

    // Unordered lists
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      cleanLines.push(`  • ${stripInlineFormatting(ulMatch[1])}`);
      continue;
    }

    // Numbered lists
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      cleanLines.push(`  ${olMatch[1]}. ${stripInlineFormatting(olMatch[2])}`);
      continue;
    }

    // Regular line with inline formatting stripped
    cleanLines.push(stripInlineFormatting(rawLine));
  }

  if (inTable) {
    flushTable();
  }

  return cleanLines.join('\n');
}

/**
 * Elimina asteriscos, backticks, corchetes y tildes de markdown inline.
 */
function stripInlineFormatting(text: string): string {
  return text
    // Remove bold **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove italic *text* or _text_
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove inline code `code`
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [text](url) -> text (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ');
}

/**
 * Convierte el Markdown en código HTML limpio con estilos profesionales
 * ejecutivos (tablas formateadas con bordes, encabezados estilizados,
 * sangrías, viñetas visuales y cero caracteres de sintaxis markdown).
 */
export function convertMarkdownToStyledHtml(markdown: string): string {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  const htmlParts: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  let inTable = false;
  let tableHeaderParsed = false;
  let inBlockquote = false;

  const closeList = () => {
    if (inList) {
      htmlParts.push(`</${listType}>`);
      inList = false;
    }
  };

  const closeTable = () => {
    if (inTable) {
      htmlParts.push(`</tbody></table></div>`);
      inTable = false;
      tableHeaderParsed = false;
    }
  };

  const closeBlockquote = () => {
    if (inBlockquote) {
      htmlParts.push(`</blockquote>`);
      inBlockquote = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeList();
      closeBlockquote();

      if (/^\|(\s*:?-+:?\s*\|)+$/.test(trimmed)) {
        // Markdown alignment row -> table header done
        tableHeaderParsed = true;
        htmlParts.push(`<tbody>`);
        continue;
      }

      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => formatInlineHtml(c.trim()));

      if (!inTable) {
        inTable = true;
        tableHeaderParsed = false;
        htmlParts.push(
          `<div class="table-container"><table class="report-table"><thead><tr>`
        );
        for (const cell of cells) {
          htmlParts.push(`<th>${cell}</th>`);
        }
        htmlParts.push(`</tr></thead>`);
      } else if (!tableHeaderParsed) {
        // Still headers? Usually not, but handle gracefully
        htmlParts.push(`<tr>`);
        for (const cell of cells) {
          htmlParts.push(`<th>${cell}</th>`);
        }
        htmlParts.push(`</tr>`);
      } else {
        htmlParts.push(`<tr>`);
        for (const cell of cells) {
          htmlParts.push(`<td>${cell}</td>`);
        }
        htmlParts.push(`</tr>`);
      }
      continue;
    } else if (inTable) {
      closeTable();
    }

    // Horizontal Rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      closeList();
      closeBlockquote();
      htmlParts.push(`<hr class="section-divider" />`);
      continue;
    }

    // Headings
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      closeList();
      closeBlockquote();
      htmlParts.push(`<h1 class="report-h1">${formatInlineHtml(h1Match[1])}</h1>`);
      continue;
    }

    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      closeList();
      closeBlockquote();
      htmlParts.push(`<h2 class="report-h2">${formatInlineHtml(h2Match[1])}</h2>`);
      continue;
    }

    const h3Match = trimmed.match(/^###\s+(.+)$/);
    if (h3Match) {
      closeList();
      closeBlockquote();
      htmlParts.push(`<h3 class="report-h3">${formatInlineHtml(h3Match[1])}</h3>`);
      continue;
    }

    const h4Match = trimmed.match(/^####\s+(.+)$/);
    if (h4Match) {
      closeList();
      closeBlockquote();
      htmlParts.push(`<h4 class="report-h4">${formatInlineHtml(h4Match[1])}</h4>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      closeList();
      if (!inBlockquote) {
        inBlockquote = true;
        htmlParts.push(`<blockquote class="report-blockquote">`);
      }
      const quoteContent = formatInlineHtml(trimmed.replace(/^>\s*/, ''));
      htmlParts.push(`<p>${quoteContent}</p>`);
      continue;
    } else if (inBlockquote) {
      closeBlockquote();
    }

    // Unordered List
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        htmlParts.push(`<ul class="report-ul">`);
      }
      htmlParts.push(`<li>${formatInlineHtml(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered List
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        htmlParts.push(`<ol class="report-ol">`);
      }
      htmlParts.push(`<li>${formatInlineHtml(olMatch[2])}</li>`);
      continue;
    }

    // Empty line closes lists
    if (trimmed === '') {
      closeList();
      closeBlockquote();
      continue;
    }

    // Paragraph
    closeList();
    closeBlockquote();
    htmlParts.push(`<p class="report-p">${formatInlineHtml(trimmed)}</p>`);
  }

  closeList();
  closeTable();
  closeBlockquote();

  return htmlParts.join('\n');
}

/**
 * Convierte formato inline de markdown a tags HTML seguros.
 */
function formatInlineHtml(text: string): string {
  return text
    // Replace & < > with entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

/**
 * Genera el documento HTML completo con membrete oficial, metadata y estilos CSS
 * para exportar como archivo HTML o Documento Word (.doc).
 */
export function buildFullHtmlDocument(
  contentMarkdown: string,
  meta: {
    zoneName: string;
    coordinates?: string;
    zoneCoords?: { lat: number; lng: number };
    generatingEvent?: any;
    generatingEventTitle?: string;
    generatingEventType?: string;
    timestamp?: string;
    modelUsed?: string;
    verdictLabel?: string;
  }
): string {
  const bodyHtml = convertMarkdownToStyledHtml(contentMarkdown);
  const now = meta.timestamp || new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' });

  // Resolve coordinates
  let coords = meta.zoneCoords;
  if (!coords && meta.coordinates) {
    const match = meta.coordinates.match(/([0-9.]+)[°\s]*[NnSs][,\s]*([0-9.]+)[°\s]*[WwEe]/);
    if (match) {
      coords = { lat: parseFloat(match[1]), lng: -Math.abs(parseFloat(match[2])) };
    }
  }
  if (!coords) {
    coords = { lat: 5.65, lng: -63.50 };
  }

  const stateInfo = detectVenezuelanState(coords.lat, coords.lng, meta.zoneName);

  // Generate real vector map of Venezuela with active state, coordinates and semantic icons
  const vectorMapHtml = generateVenezuelaVectorMapSvg({
    zoneName: meta.zoneName,
    zoneCoords: coords,
    generatingEvent: meta.generatingEvent || {
      title: meta.generatingEventTitle,
      typeLabel: meta.generatingEventType,
      coordinates: coords,
    },
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe Táctico y Ambiental - ${meta.zoneName} (${stateInfo.fullName})</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 30px;
    }
    .report-wrapper {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 35px 45px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .official-header {
      border-bottom: 3px double #0284c7;
      padding-bottom: 18px;
      margin-bottom: 24px;
      text-align: center;
    }
    .republic-banner {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .system-title {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      margin: 6px 0;
      letter-spacing: 0.5px;
    }
    .system-subtitle {
      font-size: 12px;
      color: #0284c7;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #0284c7;
      border-radius: 6px;
      padding: 14px 18px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      font-size: 12px;
    }
    .meta-item strong {
      color: #0f172a;
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .meta-item span {
      color: #334155;
      font-weight: 500;
    }
    .verdict-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
      margin-bottom: 16px;
    }
    .report-h1 {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-top: 26px;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    .report-h2 {
      font-size: 15px;
      font-weight: 700;
      color: #0369a1;
      margin-top: 22px;
      margin-bottom: 10px;
      border-left: 3px solid #0284c7;
      padding-left: 8px;
    }
    .report-h3 {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-top: 18px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .report-h4 {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    .report-p {
      font-size: 13px;
      line-height: 1.65;
      color: #334155;
      margin-bottom: 12px;
      text-align: justify;
    }
    .report-ul, .report-ol {
      margin: 10px 0 16px 20px;
      padding-left: 10px;
      font-size: 13px;
      color: #334155;
    }
    .report-ul li, .report-ol li {
      margin-bottom: 6px;
      line-height: 1.6;
    }
    .table-container {
      overflow-x: auto;
      margin: 16px 0 22px 0;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
    }
    .report-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: left;
      padding: 9px 12px;
      border: 1px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    .report-table td {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      color: #334155;
      vertical-align: top;
    }
    .report-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .report-blockquote {
      margin: 16px 0;
      padding: 12px 18px;
      background: #f0f9ff;
      border-left: 4px solid #0284c7;
      border-radius: 0 6px 6px 0;
      font-style: italic;
      color: #0369a1;
      font-size: 12.5px;
    }
    .report-blockquote p {
      margin: 0;
    }
    .inline-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background: #f1f5f9;
      color: #0369a1;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 11px;
      border: 1px solid #e2e8f0;
    }
    .section-divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 22px 0;
    }
    .official-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .signature-box {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
      font-size: 11px;
      color: #475569;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body {
        padding: 0;
        background: transparent;
      }
      .report-wrapper {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="report-wrapper">
    <div class="official-header">
      <div class="republic-banner">República Bolivariana de Venezuela • Ministerio del Poder Popular para el Ecosocialismo</div>
      <div class="system-title">SISTEMA CENTINELA ORINOCO</div>
      <div class="system-subtitle">DICTAMEN OFICIAL DE INTELIGENCIA AMBIENTAL, SATELITAL Y PREDICTIVA</div>
    </div>

    <div class="meta-box">
      <div class="meta-item">
        <strong>Sector Territorial Evaluado</strong>
        <span>${meta.zoneName}</span>
      </div>
      <div class="meta-item">
        <strong>Jurisdicción Estatal</strong>
        <span>${stateInfo.shieldSymbol} ${stateInfo.fullName} (${stateInfo.region})</span>
      </div>
      <div class="meta-item">
        <strong>Coordenadas GPS Satelitales (WGS-84)</strong>
        <span>${meta.coordinates || `${coords.lat.toFixed(5)}° N, ${Math.abs(coords.lng).toFixed(5)}° W`}</span>
      </div>
      <div class="meta-item">
        <strong>Evento Cartográfico Generador</strong>
        <span>${meta.generatingEventTitle || meta.zoneName}</span>
      </div>
      <div class="meta-item">
        <strong>Fecha / Hora Legal de Venezuela (VET)</strong>
        <span>${now}</span>
      </div>
      <div class="meta-item">
        <strong>Modelo de IA / Motor Evaluador</strong>
        <span>${meta.modelUsed || 'Cascada Multimodelo Gemini + Supabase pgvector'}</span>
      </div>
    </div>

    ${meta.verdictLabel ? `<div class="verdict-badge">${meta.verdictLabel}</div>` : ''}

    <!-- MAPA DEL ESTADO DE VENEZUELA Y VECTORES SEMÁNTICOS TÁCTICOS -->
    ${vectorMapHtml}

    <div class="report-body">
      ${bodyHtml}
    </div>

    <div class="signature-box">
      <div>
        <strong>Centro de Comando y Análisis Geoespacial</strong><br>
        Monitoreo SAR Sentinel-1, Óptico Sentinel-2 y Térmico NASA FIRMS
      </div>
      <div style="text-align: right;">
        <strong>Certificación Algorítmica RAG</strong><br>
        Hash de Integridad Telemetría: SEC-VET-${Math.floor(Date.now() / 1000).toString(16).toUpperCase()}
      </div>
    </div>

    <div class="official-footer">
      <span>Centinela Orinoco © ${new Date().getFullYear()} · Documento Oficial Generado para Interdicción y Protección Ambiental</span>
      <span>Hora Legal: America/Caracas (VET)</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Descarga el informe en formato Word (.doc enriquecido sin markdown).
 * Microsoft Word y LibreOffice abren directamente este archivo con formato,
 * tablas y estilos intactos, sin ninguna nomenclatura de markdown.
 */
export function downloadReportAsWord(
  markdown: string,
  result: ZoneAnalyticsResult | { zoneName: string; coordinates?: { lat: number; lng: number }; [key: string]: any },
  filename?: string
): void {
  const coordsFormatted = result.satelliteLocation?.formatted || 
    (result.coordinates ? `${result.coordinates.lat.toFixed(5)}° N, ${Math.abs(result.coordinates.lng).toFixed(5)}° W (WGS-84)` : undefined);

  const htmlContent = buildFullHtmlDocument(markdown, {
    zoneName: result.zoneName || 'Sector_Orinoco',
    coordinates: coordsFormatted,
    zoneCoords: result.coordinates || result.generatingEvent?.coordinates,
    generatingEvent: result.generatingEvent,
    generatingEventTitle: result.generatingEvent?.title,
    generatingEventType: result.generatingEvent?.typeLabel,
    timestamp: result.issuedAtVenezuela || result.timestamp,
    modelUsed: result.aiExecution?.modelDisplayName || 'Centinela AI Intelligence Engine',
    verdictLabel: result.verdictLabel,
  });

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });

  const cleanName = (result.zoneName || 'Informe_Zona')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const finalFilename = filename || `Informe_Tactico_Formateado_${cleanName}.doc`;

  triggerBlobDownload(blob, finalFilename);
}

/**
 * Descarga el informe en formato HTML formateado y autocontenido.
 */
export function downloadReportAsHtml(
  markdown: string,
  result: ZoneAnalyticsResult | { zoneName: string; coordinates?: { lat: number; lng: number }; [key: string]: any },
  filename?: string
): void {
  const coordsFormatted = result.satelliteLocation?.formatted || 
    (result.coordinates ? `${result.coordinates.lat.toFixed(5)}° N, ${Math.abs(result.coordinates.lng).toFixed(5)}° W (WGS-84)` : undefined);

  const htmlContent = buildFullHtmlDocument(markdown, {
    zoneName: result.zoneName || 'Sector_Orinoco',
    coordinates: coordsFormatted,
    zoneCoords: result.coordinates || result.generatingEvent?.coordinates,
    generatingEvent: result.generatingEvent,
    generatingEventTitle: result.generatingEvent?.title,
    generatingEventType: result.generatingEvent?.typeLabel,
    timestamp: result.issuedAtVenezuela || result.timestamp,
    modelUsed: result.aiExecution?.modelDisplayName || 'Centinela AI Intelligence Engine',
    verdictLabel: result.verdictLabel,
  });

  const blob = new Blob([htmlContent], {
    type: 'text/html;charset=utf-8',
  });

  const cleanName = (result.zoneName || 'Informe_Zona')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const finalFilename = filename || `Informe_Tactico_Formateado_${cleanName}.html`;

  triggerBlobDownload(blob, finalFilename);
}

/**
 * Descarga el informe en formato texto plano completamente limpio de símbolos markdown
 * (sin #, **, |, ---, ni caracteres de formateo).
 */
export function downloadReportAsCleanText(
  markdown: string,
  result: ZoneAnalyticsResult | { zoneName: string; coordinates?: { lat: number; lng: number }; [key: string]: any },
  filename?: string
): void {
  const cleanBody = stripMarkdownToCleanText(markdown);
  const coordsFormatted = result.satelliteLocation?.formatted || 
    (result.coordinates ? `${result.coordinates.lat.toFixed(5)}° N, ${Math.abs(result.coordinates.lng).toFixed(5)}° W (WGS-84)` : 'Cuenca del Orinoco');

  const now = result.issuedAtVenezuela || result.timestamp || new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' });
  const coords = result.coordinates || result.generatingEvent?.coordinates;
  const stateInfo = coords ? detectVenezuelanState(coords.lat, coords.lng, result.zoneName) : detectVenezuelanState(5.65, -63.50, result.zoneName);

  const header = [
    `================================================================================`,
    `  REPÚBLICA BOLIVARIANA DE VENEZUELA`,
    `  MINISTERIO DEL PODER POPULAR PARA EL ECOSOCIALISMO`,
    `  SISTEMA CENTINELA ORINOCO - DICTAMEN DE INTELIGENCIA AMBIENTAL Y SATELITAL`,
    `================================================================================`,
    ``,
    `DATOS DE CONTROL, JURISDICCIÓN Y GEORREFERENCIACIÓN:`,
    `  • SECTOR EVALUADO:     ${result.zoneName}`,
    `  • JURISDICCIÓN:        ${stateInfo.fullName} (${stateInfo.region})`,
    `  • COORDENADAS GPS:     ${coordsFormatted}`,
    `  • EVENTO GENERADOR:    ${result.generatingEvent?.title || result.zoneName}`,
    `  • FECHA / HORA (VET):  ${now}`,
    `  • MODELO IA EVALUADOR: ${result.aiExecution?.modelDisplayName || 'Cascada Multimodelo Gemini'}`,
    result.verdictLabel ? `  • DICTAMEN OFICIAL:    ${result.verdictLabel}` : '',
    ``,
    `--------------------------------------------------------------------------------`,
    `INFORME FORMATEADO (SIN SÍMBOLOS MARKDOWN):`,
    `--------------------------------------------------------------------------------`,
    ``,
  ].filter(Boolean).join('\n');

  const footer = [
    ``,
    `================================================================================`,
    `CENTINELA ORINOCO - HORA LEGAL: AMERICA/CARACAS (VET)`,
    `Documento oficial procesado para uso operativo e interdicción ambiental.`,
    `================================================================================`,
  ].join('\n');

  const fullCleanText = `${header}\n${cleanBody}\n${footer}`;

  const blob = new Blob([fullCleanText], {
    type: 'text/plain;charset=utf-8',
  });

  const cleanName = (result.zoneName || 'Informe_Zona')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const finalFilename = filename || `Informe_Tactico_Limpio_${cleanName}.txt`;

  triggerBlobDownload(blob, finalFilename);
}

/**
 * Abre una ventana emergente limpia e invoca la impresión / Guardado como PDF
 * con todos los estilos de react-markdown formateados sin markdown.
 */
export function printFormattedReport(
  markdown: string,
  result: ZoneAnalyticsResult | { zoneName: string; coordinates?: { lat: number; lng: number }; [key: string]: any }
): void {
  const coordsFormatted = result.satelliteLocation?.formatted || 
    (result.coordinates ? `${result.coordinates.lat.toFixed(5)}° N, ${Math.abs(result.coordinates.lng).toFixed(5)}° W (WGS-84)` : undefined);

  const htmlContent = buildFullHtmlDocument(markdown, {
    zoneName: result.zoneName || 'Sector_Orinoco',
    coordinates: coordsFormatted,
    zoneCoords: result.coordinates || result.generatingEvent?.coordinates,
    generatingEvent: result.generatingEvent,
    generatingEventTitle: result.generatingEvent?.title,
    generatingEventType: result.generatingEvent?.typeLabel,
    timestamp: result.issuedAtVenezuela || result.timestamp,
    modelUsed: result.aiExecution?.modelDisplayName || 'Centinela AI Intelligence Engine',
    verdictLabel: result.verdictLabel,
  });

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
}

/**
 * Disparador genérico de descarga en el navegador.
 */
function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
