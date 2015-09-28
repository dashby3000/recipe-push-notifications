module.exports = {
    mongodb: {
        hostname: process.env.MONGODB_HOST || 'localhost',
        database: process.env.MONGODB_DATABASE || 'recipe_push_notification',
        user: process.env.MONGODB_USERNAME || '',
        password: process.env.MONGODB_PASSWORD || '',
        port: process.env.MONGODB_PORT || 27017,
        debug: process.env.MONGODB_DEBUG || true,
        url: process.env.MONGODB_URL
    }
}
