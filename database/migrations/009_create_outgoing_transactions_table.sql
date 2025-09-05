CREATE TABLE outgoing_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    source_location VARCHAR(255) NOT NULL, -- Warehouse 1, Warehouse 2, etc.
    transaction_date DATE NOT NULL,
    notes TEXT NULL,
    status ENUM('draft', 'done') DEFAULT 'draft',
    total_items INT DEFAULT 0,
    total_value DECIMAL(12,2) DEFAULT 0.00,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_source (source_location),
    INDEX idx_date (transaction_date),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Insert sample outgoing transactions
INSERT INTO outgoing_transactions (source_location, transaction_date, notes, status, total_items, total_value, created_by) VALUES
('Warehouse 1', '2024-01-15', 'Customer order fulfillment', 'done', 3, 882.25, 1),
('Warehouse 2', '2024-01-16', 'Emergency shipment', 'draft', 2, 567.50, 1),
('Warehouse 1', '2024-01-18', 'Bulk customer order', 'done', 5, 1245.75, 1);
