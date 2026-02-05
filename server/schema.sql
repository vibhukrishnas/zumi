CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    provider VARCHAR(255),
    event_date DATETIME,
    location VARCHAR(255),
    price DECIMAL(10, 2),
    image_url VARCHAR(255),
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    provider VARCHAR(255),
    service_type VARCHAR(50),
    price DECIMAL(10, 2),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    tier ENUM('free', 'basic', 'premium') DEFAULT 'free',
    status ENUM('active', 'expired') DEFAULT 'active',
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    item_id INT,
    item_type ENUM('event', 'service'),
    original_price DECIMAL(10, 2),
    provider_discount DECIMAL(5, 2) DEFAULT 0,
    coupon_code VARCHAR(50),
    coupon_discount DECIMAL(5, 2) DEFAULT 0,
    subscription_discount DECIMAL(5, 2) DEFAULT 0,
    final_price DECIMAL(10, 2),
    status ENUM('initiated', 'confirmed', 'cancelled', 'pending_payment') DEFAULT 'initiated',
    reward_promo_code VARCHAR(50) DEFAULT NULL,
    reward_promo_discount DECIMAL(5, 2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_reward_promo_code (reward_promo_code)
);