const { pool } = require('../config/db');

// Get dashboard data
exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Get counts
        const [[{ eventCount }]] = await pool.query('SELECT COUNT(*) as eventCount FROM events');
        const [[{ serviceCount }]] = await pool.query('SELECT COUNT(*) as serviceCount FROM services');

        // Get unique categories from services
        const [categoriesResult] = await pool.query('SELECT DISTINCT service_type FROM services WHERE service_type IS NOT NULL');
        const categories = ['All', ...categoriesResult.map(c => c.service_type)];

        // Get user stats if logged in
        let userStats = { bookingsCount: 0, totalSaved: 0, loyaltyPoints: 0, walks: 0, feedings: 0, playtime: 0 };
        if (userId) {
            const [[bookingStats]] = await pool.query(`
                SELECT 
                    COUNT(*) as bookingsCount,
                    COALESCE(SUM(original_price - final_price), 0) as totalSaved
                FROM bookings 
                WHERE user_id = ? AND status = 'completed'
            `, [userId]);

            // Get Activity Log Stats
            const [activities] = await pool.query(`
                SELECT activity_type, SUM(duration_minutes) as total 
                FROM activity_logs 
                WHERE user_id = ?
                GROUP BY activity_type
            `, [userId]);

            const activityMap = {};
            activities.forEach(a => activityMap[a.activity_type] = parseInt(a.total) || 0);

            userStats = {
                bookingsCount: bookingStats.bookingsCount || 0,
                totalSaved: parseFloat(bookingStats.totalSaved) || 0,
                loyaltyPoints: (bookingStats.bookingsCount || 0) * 10,
                walks: activityMap['Walk'] || 0,
                feedings: activityMap['Feeding'] || 0,
                playtime: activityMap['Playtime'] || 0
            };
        }

        // Dynamic promo banners based on available discounts
        const [discountedServices] = await pool.query(`
            SELECT title, provider_discount FROM services 
            WHERE provider_discount > 0 
            ORDER BY provider_discount DESC LIMIT 1
        `);

        const [upcomingEvents] = await pool.query(`
            SELECT title, event_date FROM events 
            WHERE event_date > NOW() 
            ORDER BY event_date ASC LIMIT 1
        `);

        // Build dynamic banners
        const banners = [];

        if (discountedServices.length > 0) {
            banners.push({
                id: 1,
                title: `${discountedServices[0].provider_discount}% OFF Services`,
                subtitle: `Save on ${discountedServices[0].title}`,
                gradient: ['#6C63FF', '#4834d4'],
                icon: '💰',
                action: 'services'
            });
        }

        if (upcomingEvents.length > 0) {
            const eventDate = new Date(upcomingEvents[0].event_date);
            banners.push({
                id: 2,
                title: upcomingEvents[0].title,
                subtitle: `Coming ${eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                gradient: ['#FF6584', '#FF4757'],
                icon: '📅',
                action: 'events'
            });
        }

        // Add membership banner if user is on free tier
        banners.push({
            id: 3,
            title: 'Premium Membership',
            subtitle: 'Unlock exclusive discounts',
            gradient: ['#00b894', '#00cec9'],
            icon: '👑',
            action: 'upgrade'
        });

        // Quick actions (derived from service types)
        const quickActions = [
            { id: 1, name: 'Grooming', icon: 'cut-outline', color: '#6C63FF', bg: '#6C63FF15' },
            { id: 2, name: 'Healthcare', icon: 'medical-outline', color: '#FF6584', bg: '#FF658415' },
            { id: 3, name: 'Boarding', icon: 'home-outline', color: '#00b894', bg: '#00b89415' },
            { id: 4, name: 'Training', icon: 'school-outline', color: '#fdcb6e', bg: '#fdcb6e20' },
            { id: 5, name: 'Walking', icon: 'walk-outline', color: '#0984e3', bg: '#0984e315' },
        ];

        // Filter to only include categories that exist in services
        const availableCategories = categories.map(c => c.toLowerCase());
        const filteredActions = quickActions.filter(action =>
            availableCategories.includes(action.name.toLowerCase()) || action.name === 'Healthcare'
        );

        res.json({
            success: true,
            data: {
                stats: {
                    eventCount,
                    serviceCount,
                    rating: 4.9, // Could be calculated from reviews table
                    ...userStats
                },
                banners,
                quickActions: filteredActions.length > 0 ? filteredActions : quickActions,
                categories
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
};

// Get featured/recommended items
exports.getFeatured = async (req, res) => {
    try {
        // Get top services by discount
        const [featuredServices] = await pool.query(`
            SELECT * FROM services 
            ORDER BY provider_discount DESC, created_at DESC 
            LIMIT 5
        `);

        // Get upcoming events
        const [featuredEvents] = await pool.query(`
            SELECT * FROM events 
            WHERE event_date > NOW() 
            ORDER BY event_date ASC 
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                services: featuredServices,
                events: featuredEvents
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching featured items', error: error.message });
    }
};
