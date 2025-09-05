CREATE TABLE outgoing_transaction_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    outgoing_transaction_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    destination VARCHAR(255) NOT NULL, -- Customer name or location
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (outgoing_transaction_id) REFERENCES outgoing_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_transaction (outgoing_transaction_id),
    INDEX idx_product (product_id),
    INDEX idx_destination (destination)
);

-- Insert sample outgoing transaction items
INSERT INTO outgoing_transaction_items (outgoing_transaction_id, product_id, quantity, unit_price, total_price, destination, notes) VALUES
(1, 1, 25, 25.99, 649.75, 'Customer 123', 'Rush order'),
(1, 2, 15, 15.50, 232.50, 'Customer 456', 'Standard delivery'),
(2, 3, 20, 18.75, 375.00, 'ABC Corporation', 'Bulk shipment'),
(2, 4, 10, 8.75, 87.50, 'XYZ Industries', 'Special order'),
(3, 5, 12, 45.00, 540.00, 'Tech Solutions Ltd', 'Assembly order');
