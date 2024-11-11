CREATE TABLE
    roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_restricted BOOLEAN DEFAULT FALSE
);

CREATE TABLE
    edge_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status ENUM('online', 'offline', 'error', 'app_issue') NOT NULL,
    last_contact TIMESTAMP,
    connection_type ENUM('wireless', 'wired') NOT NULL,
    coordinates POINT,
    ip_address VARCHAR(45),
    performance_metric DECIMAL(5, 2) -- Placeholder for performance metric, adjust as needed
);

CREATE TABLE
    mebers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
    );

CREATE TABLE
    tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('location', 'team', 'custom', 'other') NOT NULL,
    is_editable BOOLEAN DEFAULT TRUE,
    owner_id INT DEFAULT NULL,
    FOREIGN KEY (owner_id) REFERENCES mebers(id)
);

CREATE TABLE
    role_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tag_id INT,
    role_id INT,
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE
    device_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tag_id INT,
    device_id INT,
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    FOREIGN KEY (device_id) REFERENCES edge_devices(id)
);

CREATE TABLE
    meber_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meber_id INT,
    role_id INT,
    FOREIGN KEY (meber_id) REFERENCES mebers(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

# CREATE TABLE
# meber_tags (
#     id INT AUTO_INCREMENT PRIMARY KEY,
#     meber_id INT,
#     tag_id INT,
#     FOREIGN KEY (meber_id) REFERENCES mebers(id),
#     FOREIGN KEY (tag_id) REFERENCES tags(id)
# );

CREATE TABLE
    applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(10) NOT NULL,
    description TEXT,
    repo_url VARCHAR(255)
);

CREATE TABLE
    meber_applications (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    meber_id INT,
    application_id INT,
    FOREIGN KEY (meber_id) REFERENCES mebers(id),
    FOREIGN KEY (application_id) REFERENCES applications(id)
);

CREATE TABLE
    application_instances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT,
    device_id INT,
    status ENUM('online', 'offline', 'error', 'warning') NOT NULL,
    path VARCHAR(255), -- Placeholder, adjust depending on path format
    FOREIGN KEY (app_id) REFERENCES applications(id),
    FOREIGN KEY (device_id) REFERENCES edge_devices(id)
);

CREATE TABLE
    sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE
    device_sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT,
    device_id INT,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id),
    FOREIGN KEY (device_id) REFERENCES edge_devices(id)
);

CREATE TABLE
    application_sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT,
    application_id INT,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id),
    FOREIGN KEY (application_id) REFERENCES applications(id)
);

CREATE TABLE
    logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT,
    app_instance_id INT NULL,
    description TEXT NOT NULL,
    warning_level ENUM('online', 'offline', 'error', 'app_issue', 'warning') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES edge_devices(id),
    FOREIGN KEY (app_instance_id) REFERENCES application_instances(id)
);
