CREATE TABLE product_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Insert default categories
INSERT INTO product_categories (name, description) VALUES
('Electronics', 'Electronic components and devices'),
('Mechanical', 'Mechanical parts and components'),
('Hardware', 'Hardware tools and equipment'),
('Software', 'Software licenses and digital products'),
('Tools', 'Various tools and instruments');
