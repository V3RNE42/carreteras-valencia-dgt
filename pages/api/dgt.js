import { JSDOM } from 'jsdom';
const DGT_URL = 'https://infocar.dgt.es/etraffic/Incidencias?ca=10&provIci=&caracter=acontecimiento&accion_consultar=Consultar&IncidenciasRETENCION=IncidenciasRETENCION&IncidenciasOBRAS=IncidenciasOBRAS&IncidenciasPUERTOS=IncidenciasPUERTOS&IncidenciasMETEOROLOGICA=IncidenciasMETEOROLOGICA&IncidenciasEVENTOS=IncidenciasEVENTOS&IncidenciasOTROS=IncidenciasOTROS&IncidenciasRESTRICCIONES=IncidenciasRESTRICCIONES&ordenacion=fechahora_ini-DESC';

export default async function handler(req, res) {
    try {
        const response = await fetch(DGT_URL);
        
        const html = await response.text();
        const dom = new JSDOM(html);
        const table = dom.window.document.querySelector("#tablaincidencias");
        
        if (!table) {
            return res.status(404).json({ error: "Table not found" });
        }
        
        const incidents = [];
        const rows = table.querySelectorAll("tbody tr");
        
        rows.forEach(row => {
            // Extract carretera
            const carretera = row.querySelector("td:nth-child(5)")?.textContent?.trim();
            
            // Extract location and description
            const descripcionEl = row.querySelector(".nombreIncidencia");
            if (!descripcionEl) return;
            
            const descripcion = descripcionEl.textContent;
            const tipo = descripcionEl.querySelector('b')?.textContent?.trim();
            
            // Parse kilómetros using regex
            const kmMatch = descripcion.match(/(?:desde el\s+km\s+|en el\s+km\s+)(\d+\.?\d*)/);
            const kmFinMatch = descripcion.match(/al\s+km\s+(\d+\.?\d*)/);
            
            if (!kmMatch || !tipo || !carretera) return;
            
            const incident = {
                carretera,
                km_inicio: parseFloat(kmMatch[1]),
                ubicacion: row.querySelector("td:nth-child(4) .p2TablaIncidencias")?.textContent?.trim(),
                tipo
            };

            if (kmFinMatch) {
                incident.km_fin = parseFloat(kmFinMatch[1]);
            }

            incidents.push(incident);
        });

        console.log('Total incidents:', incidents.length);
        console.log('Tipos:', [...new Set(incidents.map(i => i.tipo))]);

        return res.status(200).json(incidents);
    } catch (error) {
        console.error('Error in API:', error);
        return res.status(500).json({ error: error.message });
    }
}
