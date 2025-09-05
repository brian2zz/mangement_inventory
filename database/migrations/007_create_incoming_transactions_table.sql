CREATE TABLE incoming_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_id BIGINT UNSIGNED NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT NULL,
    status ENUM('draft', 'done') DEFAULT 'draft',
    total_items INT DEFAULT 0,
    total_value DECIMAL(12,2) DEFAULT 0.00,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_supplier (supplier_id),
    INDEX idx_date (transaction_date),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Insert sample incoming transactions
INSERT INTO incoming_transactions (supplier_id, transaction_date, notes, status, total_items, total_value, created_by) VALUES
(1, '2024-01-15', 'Monthly stock replenishment', 'done', 5, 1939.50, 1),
(2, '2024-01-16', 'Emergency stock order', 'draft', 3, 890.25, 1),
(1, '2024-01-18', 'Bulk order for Q1', 'done', 8, 2456.75, 1),
(4, '2024-01-19', 'Special components', 'draft', 2, 645.50, 1);
