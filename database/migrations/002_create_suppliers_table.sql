CREATE TABLE suppliers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    address TEXT NULL,
    email VARCHAR(255) NULL,
    contact_person VARCHAR(255) NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status)
);

-- Insert default suppliers
INSERT INTO suppliers (name, phone, address, email, contact_person) VALUES
('Supplier ABC', '+1 (555) 123-4567', '123 Industrial Ave, City, State 12345', 'contact@supplierabc.com', 'John Smith'),
('Supplier XYZ', '+1 (555) 987-6543', '456 Manufacturing St, City, State 67890', 'info@supplierxyz.com', 'Jane Doe'),
('Supplier DEF', '+1 (555) 456-7890', '789 Commerce Blvd, City, State 54321', 'sales@supplierdef.com', 'Mike Johnson'),
('Supplier GHI', '+1 (555) 321-0987', '321 Business Park, City, State 98765', 'orders@supplierGHI.com', 'Sarah Wilson');
