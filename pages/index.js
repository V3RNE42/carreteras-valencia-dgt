import Head from 'next/head';
import Script from 'next/script';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('../components/Map'), {
    ssr: false,
    loading: () => <div style={{ height: '100vh', width: '100%' }}>Cargando mapa...</div>
});

export default function Home() {
    return (
        <>
            <Head>
                <title>Incidencias de Tráfico Valencia</title>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>{`
                    .legend {
                        padding: 16px 20px;
                        background: white;
                        background: rgba(255,255,255,0.98);
                        box-shadow: 0 2px 10px rgba(0,0,0,0.15);
                        border-radius: 8px;
                        line-height: 2;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                        min-width: 200px;
                    }

                    .legend h4 {
                        margin: 0 0 12px;
                        padding-bottom: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        color: #333;
                        border-bottom: 1px solid #eee;
                    }

                    .legend i {
                        width: 20px;
                        height: 20px;
                        float: left;
                        margin-right: 12px;
                        margin-top: 4px;
                        opacity: 0.9;
                        border-radius: 50%;
                        border: 2px solid rgba(255,255,255,0.8);
                        box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
                    }
                `}</style>
            </Head>
            <Script
                src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"
                strategy="beforeInteractive"
            />
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
            />
            <Map />
        </>
    );
}
