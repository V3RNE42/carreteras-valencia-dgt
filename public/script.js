// Ignorar errores de LaunchDarkly
window.addEventListener('error', function(e) {
    if (e.filename?.includes('launchdarkly')) {
        e.preventDefault();
        return false;
    }
});

// Colores actualizados con un esquema más vibrante
const tipoColores = {
    'OBSTÁCULO FIJO': '#FF4500',                   // Rojo-naranja brillante
    'RESTRICCIONES EN ACCESOS': '#4169E1',         // Azul real
    'INUNDACIÓN': '#000',                          // Negro
    'DESVÍO OPERATIVO': '#FFD700',                 // Dorado
    'RETENCIÓN / CONGESTIÓN': '#FF1493',           // Rosa profundo
    'OTROS': '#32CD32',                            // Lima verde
    'CARRIL DE ALTA OCUPACIÓN ABIERTO': '#00CED1', // Turquesa medio
    'OBRA / MANTENIMIENTO VIA': '#FFA500'          // Naranja
};

/** Función auxiliar para log de tipos no encontrados  */
function getColorForTipo(tipo) {
    if (!tipoColores[tipo]) {
        console.log('Tipo no encontrado en colores:', tipo);
        return '#808080'; // Color por defecto
    }
    return tipoColores[tipo];
}

const END_DATE = new Date('2023-12-01T23:59:59');
let map;

function toTitleCase(str) {
    return str.toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function isWithinValenciaRadius(lat, lon) {
    const valenciaLat = 39.47391;
    const valenciaLon = -0.37966;
    return calculateDistance(valenciaLat, valenciaLon, lat, lon) <= 300;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function getCoordinates(carretera, kilometro) {
    try {
        const response = await fetch(`/api/coordinates?carretera=${encodeURIComponent(carretera)}&kilometro=${encodeURIComponent(kilometro)}`);
        if (!response.ok) throw new Error('Coordinate fetch failed');
        return await response.json();
    } catch (error) {
        console.error('Error getting coordinates:', error);
        return null;
    }
}

async function fetchDGTData() {
    try {
        console.log('Fetching DGT data...');
        const response = await fetch('/api/dgt');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('DGT data received:', {
            count: data.length,
            tipos: [...new Set(data.map(i => i.tipo))]
        });
        return data;
    } catch (error) {
        console.error('Error fetching DGT data:', error);
        return null;
    }
}

function updateLegend(tiposActivos) {
    // Remove existing legend
    const existingLegend = document.querySelector('.legend');
    if (existingLegend) {
        existingLegend.remove();
    }

    // Add new legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'legend');
        let content = '<h4>Tipos de Incidentes</h4>';
        
        for (const tipo of tiposActivos) {
            const color = tipoColores[tipo];
            const displayText = toTitleCase(tipo);
            content += `<div style="padding: 4px 0;">
                <i style="background: ${color}; opacity: 0.8;"></i>
                ${displayText}
            </div>`;
        }
        
        div.innerHTML = content;
        return div;
    };
    legend.addTo(map);
}

let updateTimeout;

async function updateMap() {
    try {
        console.log('Updating map...');
        const incidents = await fetchDGTData();
        
        if (!incidents) return;

        // Limpiar marcadores existentes
        map.eachLayer((layer) => {
            if (layer instanceof L.CircleMarker) {
                map.removeLayer(layer);
            }
        });

        const validPoints = [];
        const tiposActivos = new Set();

        for (const incident of incidents) {
            const coords = await getCoordinates(incident.carretera, incident.km_inicio);
            if (!coords || !isWithinValenciaRadius(coords.lat, coords.lon)) continue;

            tiposActivos.add(incident.tipo);
            validPoints.push([coords.lat, coords.lon]);

            const color = getColorForTipo(incident.tipo);

            L.circleMarker(
                [coords.lat, coords.lon],
                {
                    color: 'white',
                    fillColor: color,
                    fillOpacity: 1,
                    radius: 10,
                    weight: 3
                }
            ).addTo(map)
            .bindPopup(`
                <strong>${incident.carretera}</strong><br>
                <strong>${incident.tipo}</strong><br>
                ${incident.ubicacion}<br>
                ${incident.km_fin ?
                    `PKs: ${incident.km_inicio} - ${incident.km_fin}` :
                    `PK: ${incident.km_inicio}`}
            `);
        }

        updateLegend(tiposActivos);

        // Programar siguiente actualización
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updateMap, 5 * 60 * 1000);

    } catch (error) {
        console.error('Error updating map:', error);
        // Reintentar en caso de error
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updateMap, 30 * 1000);
    }
}

// Limpieza al desmontar
window.addEventListener('beforeunload', () => {
    clearTimeout(updateTimeout);
});

// Exportar la función init
export default function init() {
    if (typeof window !== 'undefined') {
        // Inicializar mapa
        map = L.map('map').setView([39.47391, -0.37966], 9);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Primera actualización
        updateMap();

        // Actualizaciones programadas
        const updateInterval = setInterval(() => {
            const now = new Date();
            if (now >= END_DATE) {
                clearInterval(updateInterval);
                return;
            }
            updateMap();
        }, 5 * 60 * 1000);
    }
}

