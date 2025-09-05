CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,
    address TEXT NULL,
    role ENUM('admin', 'staff', 'viewer') NOT NULL DEFAULT 'viewer',
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    email_verified_at TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- Insert default users (passwords are hashed versions of: admin123, staff123, viewer123)
INSERT INTO users (name, email, phone, address, role, password, status) VALUES
('Admin User', 'admin@inventory.com', '+1 (555) 123-4567', '123 Admin St, City, State 12345', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('Staff Member', 'staff@inventory.com', '+1 (555) 234-5678', '456 Staff Ave, City, State 67890', 'staff', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active'),
('Viewer User', 'viewer@inventory.com', '+1 (555) 345-6789', '789 Viewer Blvd, City, State 54321', 'viewer', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active');
