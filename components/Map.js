import { useEffect } from 'react'

export default function Map() {
    useEffect(() => {
        const loadLeaflet = async () => {
            try {
                console.log('Loading map component...');
                const script = await import('../public/script.js');
                console.log('Script loaded, initializing...');
                script.default();
                console.log('Map initialized');
            } catch (error) {
                console.error('Error in Map component:', error);
            }
        };
        
        loadLeaflet();
    }, []);

    return <div id="map" style={{ height: '100vh', width: '100%' }} />;
}
