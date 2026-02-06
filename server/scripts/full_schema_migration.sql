-- Database Schema Migration Script
-- Run this to ensure all necessary tables and columns exist

-- Users table updates
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS notifications_enabled TINYINT(1) DEFAULT 1,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Bookings table updates
ALTER TABLE bookings 
    ADD COLUMN IF NOT EXISTS booking_date DATETIME,
    ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subscription_discount DECIMAL(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reward_promo_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS reward_promo_discount DECIMAL(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS provider_discount DECIMAL(5,2) DEFAULT 0;

-- Create coupons table if not exists
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    discount_percentage DECIMAL(5,2) NOT NULL,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    usage_limit INT DEFAULT 0,
    used_count INT DEFAULT 0,
    applicable_types ENUM('all', 'event', 'service') DEFAULT 'all',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_valid_dates (valid_from, valid_until)
);

-- Create pets table if not exists
CREATE TABLE IF NOT EXISTS pets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) DEFAULT 'dog',
    breed VARCHAR(100),
    age INT,
    weight DECIMAL(5,2),
    notes TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create messages table if not exists
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation (sender_id, receiver_id)
);

-- Create activity_logs table for tracking
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_created (created_at)
);

-- Services table updates
ALTER TABLE services 
    ADD COLUMN IF NOT EXISTS provider_discount DECIMAL(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1;

-- Events table updates  
ALTER TABLE events 
    ADD COLUMN IF NOT EXISTS provider_discount DECIMAL(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1;

-- Subscriptions table updates
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS auto_renew TINYINT(1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
