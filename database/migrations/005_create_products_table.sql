CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    card_number VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    description TEXT NULL,
    stock INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    reorder_level INT DEFAULT 0,
    supplier_id BIGINT UNSIGNED NULL,
    status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_card_number (card_number),
    INDEX idx_name (name),
    INDEX idx_part_number (part_number),
    INDEX idx_category (category_id),
    INDEX idx_stock (stock),
    INDEX idx_status (status)
);

-- Insert sample products
INSERT INTO products (card_number, name, category_id, part_number, description, stock, unit_price, reorder_level, supplier_id) VALUES
('C001', 'Widget A', 1, 'PN001', 'High-quality electronic widget for industrial use', 75, 25.99, 20, 1),
('C002', 'Widget B', 2, 'PN002', 'Mechanical widget for automation systems', 40, 15.50, 15, 2),
('C003', 'Widget C', 1, 'PN003', 'Advanced electronic component', 200, 18.75, 25, 1),
('C004', 'Component X', 3, 'PN004', 'Hardware component for assembly', 15, 8.75, 10, 3),
('C005', 'Assembly Y', 2, 'PN005', 'Complete mechanical assembly unit', 88, 45.00, 20, 2),
('C006', 'Electronic Module Z', 1, 'PN006', 'Specialized electronic module', 25, 32.25, 15, 1);
