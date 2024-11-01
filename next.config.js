module.exports = {
    env: {
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    },
    webpack: (config) => {
        config.resolve.fallback = { fs: false };
        return config;
    }
}