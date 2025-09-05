CREATE TABLE incoming_transaction_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    incoming_transaction_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (incoming_transaction_id) REFERENCES incoming_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_transaction (incoming_transaction_id),
    INDEX idx_product (product_id)
);

-- Insert sample incoming transaction items
INSERT INTO incoming_transaction_items (incoming_transaction_id, product_id, quantity, unit_price, total_price, notes) VALUES
(1, 1, 50, 25.99, 1299.50, 'Initial stock order'),
(1, 2, 30, 15.50, 465.00, 'Backup inventory'),
(1, 4, 20, 8.75, 175.00, 'Special components'),
(2, 3, 25, 18.75, 468.75, 'Emergency restock'),
(2, 5, 10, 45.00, 450.00, 'Assembly units'),
(3, 1, 100, 25.99, 2599.00, 'Bulk order'),
(3, 6, 15, 32.25, 483.75, 'Electronic modules');
