CREATE TABLE product_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    quantity_requested INT NOT NULL,
    quantity_realized INT DEFAULT 0,
    request_date DATE NOT NULL,
    realization_date DATE NULL,
    store_name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    total_price DECIMAL(12,2) DEFAULT 0.00,
    notes TEXT NULL,
    supplier_location VARCHAR(255) NULL,
    status ENUM('pending', 'partial', 'fulfilled', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    requested_by VARCHAR(255) NOT NULL,
    approved_by VARCHAR(255) NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product_name (product_name),
    INDEX idx_request_date (request_date),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_store (store_name)
);

-- Insert sample product requests
INSERT INTO product_requests (product_name, quantity_requested, quantity_realized, request_date, realization_date, store_name, unit_price, total_price, notes, supplier_location, status, priority, requested_by, approved_by, created_by) VALUES
('Widget A', 50, 50, '2024-01-10', '2024-01-15', 'Store A', 25.99, 1299.50, 'Completed on time with full quantity', 'Supplier ABC', 'fulfilled', 'normal', 'John Doe', 'Jane Smith', 1),
('Widget B', 30, 20, '2024-01-12', '2024-01-16', 'Store B', 15.50, 465.00, 'Partial fulfillment due to stock shortage', 'Supplier XYZ', 'partial', 'high', 'Mike Johnson', 'Jane Smith', 1),
('Component X', 100, 0, '2024-01-18', NULL, 'Store C', 8.75, 875.00, 'Waiting for supplier confirmation', 'Supplier DEF', 'pending', 'urgent', 'Sarah Wilson', NULL, 1),
('Assembly Y', 25, 25, '2024-01-14', '2024-01-20', 'Main Branch', 45.00, 1125.00, 'Special order completed', 'Supplier XYZ', 'fulfilled', 'normal', 'David Miller', 'Jane Smith', 1);
