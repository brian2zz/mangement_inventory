CREATE TABLE customers (
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

-- Insert default customers
INSERT INTO customers (name, phone, address, email, contact_person) VALUES
('ABC Corporation', '+1 (555) 111-2222', '100 Business Park, City, State 12345', 'contact@abccorp.com', 'Robert Brown'),
('XYZ Industries', '+1 (555) 333-4444', '200 Industrial Way, City, State 67890', 'orders@xyzind.com', 'Lisa Davis'),
('Tech Solutions Ltd', '+1 (555) 555-6666', '300 Tech Drive, City, State 54321', 'info@techsolutions.com', 'David Miller'),
('Customer 123', '+1 (555) 777-8888', '400 Main Street, City, State 11111', 'orders@customer123.com', 'Emily Johnson'),
('Customer 456', '+1 (555) 999-0000', '500 Oak Avenue, City, State 22222', 'contact@customer456.com', 'Michael Wilson');
