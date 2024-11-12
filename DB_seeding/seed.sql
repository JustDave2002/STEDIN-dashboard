-- Insert roles
INSERT INTO roles (id, name, description, is_admin, is_restricted)
VALUES
    (1, 'admin', 'Administrator role with all permissions', TRUE, FALSE),
    (2, 'team fraude', 'Fraude detection team', FALSE, FALSE);


-- Create mebers with role-specific names for clarity
INSERT INTO mebers (name)
VALUES
    ('Admin User'),
    ('Team Fraude Member');


-- Insert tags
INSERT INTO tags (id, name, type, is_editable, owner_id)
VALUES
    (1, 'fraude', 'team', TRUE, NULL),
    (2, 'energy efficiency', 'custom', TRUE, 1),
    (3, 'maintenance', 'custom', TRUE, 1),
    (4, 'urgent response', 'custom', TRUE, 2),
    (5, 'monitoring', 'custom', TRUE, 2),
    (6, 'safety', 'custom', TRUE, 1);


-- Insert role_tags associations
-- Linking each gemeente role to its respective location tag
INSERT INTO role_tags (id, tag_id, role_id)
VALUES
    (1, 1, 2); -- Team fraude role with fraude tag


-- Assign each meber a role, based on the demo setup
INSERT INTO meber_roles (meber_id, role_id)
VALUES
    (1, 1), -- Admin User assigned to admin role
    (2, 2); -- Team Fraude Member assigned to team fraude role


-- Insert sensors
INSERT INTO sensors (id, name, description)
VALUES
    (1, 'spanningssensor', 'Voltage sensor for monitoring electrical status'),
    (2, 'straatlampen', 'Sensor for streetlights control'),
    (3, 'temperatuur sensor', 'Sensor for temperature monitoring'),
    (4, 'audio sensor', 'Microphone for audio monitoring');

-- Insert applications
INSERT INTO applications (id, name, version, description, repo_url)
VALUES
    (1, 'straatlampen app', '1.0', 'Applicatie die straatlampen kan beheren', 'https://repo.example.com/straatlampen'),
    (2, 'fraude detectie', '1.1', 'Applicatie die fraude kan detecteren binnen de regio van de middenspanningsruimte', 'https://repo.example.com/fraudedetectie'),
    (3, 'temperatuur monitoring', '1.0', 'Temperature and voltage monitoring app', 'https://repo.example.com/temperatuur'),
    (4, 'Audio Analysis', '1.2', 'Audio analysis application for public safety', 'https://example.com/audio-analysis');

-- Assign applications to gemeente and team fraude mebers (Admin User excluded)
INSERT INTO meber_applications (meber_id, application_id)
VALUES
    (2, 1);  -- Team Fraude Member has access to "Fraude Detectie" app


-- Insert application_sensors associations
-- Associating each application with its required sensors
INSERT INTO application_sensors (id, sensor_id, application_id)
VALUES
    (1, 2, 1), -- straatlampen app requires straatlampen sensor
    (2, 1, 2), -- fraude detectie requires spanningssensor
    (3, 1, 3), -- temperatuur monitoring requires spanningssensor
    (4, 3, 3); -- temperatuur monitoring also requires temperatuur sensor