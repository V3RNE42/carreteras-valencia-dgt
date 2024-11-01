import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'cache', 'coordinates.json');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Asegurar que el directorio cache existe
if (!fs.existsSync(path.join(process.cwd(), 'cache'))) {
    fs.mkdirSync(path.join(process.cwd(), 'cache'));
}

// Cargar caché
function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading cache:', error);
    }
    return {};
}

// Guardar caché
function saveCache(cache) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (error) {
        console.error('Error saving cache:', error);
    }
}

export default async function handler(req, res) {
    const { carretera, kilometro } = req.query;

    if (!carretera || !kilometro) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    const cache = loadCache();
    const cacheKey = `${carretera}-${kilometro}`;

    // Check cache
    if (cache[cacheKey]) {
        return res.json(cache[cacheKey]);
    }

    // If not in cache, query Google
    try {
        const query = `Kilómetro ${kilometro} ${carretera}, Valencia, Comunidad Valenciana, España`;
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&region=es&components=administrative_area:Valencia|country:ES`
        );

        if (!response.ok) {
            throw new Error(`Google API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const coords = {
                lat: data.results[0].geometry.location.lat,
                lon: data.results[0].geometry.location.lng
            };

            // Save to cache
            cache[cacheKey] = coords;
            saveCache(cache);

            return res.json(coords);
        }

        return res.status(404).json({ error: 'Coordinates not found' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
