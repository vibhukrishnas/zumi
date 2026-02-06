// Environment Configuration
// In production, these would come from environment variables

const ENV = {
    development: {
        API_URL: 'http://192.168.1.17:5000/api',
        STRIPE_KEY: 'pk_test_51SxUwDFF8UagZ97u5A03Ks7TdBTbQOw4YJAUrj2brtfXxOx4uwPrPBN5YQNzAN1PrXhX6yg8qo1KVfi2Vuc6ZcQY00ewLTK3Ef',
    },
    production: {
        API_URL: 'https://api.zumi.com/api',
        STRIPE_KEY: 'pk_live_xxxxx',
    }
};

const getEnvVars = () => {
    // You can switch this based on __DEV__ or a build config
    return __DEV__ ? ENV.development : ENV.production;
};

export default getEnvVars();
