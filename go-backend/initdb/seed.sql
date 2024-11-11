-- Insert roles
INSERT INTO roles (id, name, description, is_admin, is_restricted)
VALUES
    (1, 'admin', 'Administrator role with all permissions', TRUE, FALSE),
    (2, 'team fraude', 'Fraude detection team', FALSE, FALSE);
#     (3, 'gemeente Middelburg', 'Role for Middelburg municipality', FALSE, TRUE),
#     (4, 'gemeente Goes', 'Role for Goes municipality', FALSE, TRUE),
#     (5, 'gemeente Reimerswaal', 'Role for Reimerswaal municipality', FALSE, TRUE),
#     (6, 'gemeente Schouwen-Duiveland', 'Role for Schouwen-Duiveland municipality', FALSE, TRUE),
#     (7, 'gemeente Hulst', 'Role for Hulst municipality', FALSE, TRUE);

-- Create mebers with role-specific names for clarity
INSERT INTO mebers (name)
VALUES
    ('Admin User'),
    ('Team Fraude Member');
#     ('Middelburg Member'),
#     ('Goes Member'),
#     ('Reimerswaal Member'),
#     ('Schouwen-Duiveland Member'),
#     ('Hulst Member');

-- Insert tags
INSERT INTO tags (id, name, type, is_editable, owner_id)
VALUES
    (1, 'fraude', 'team', TRUE, NULL),
#     (2, 'Middelburg', 'location', FALSE, NULL),
#     (3, 'Goes', 'location', FALSE, NULL),
#     (4, 'Reimerswaal', 'location', FALSE, NULL),
#     (5, 'Schouwen-Duiveland', 'location', FALSE, NULL),
#     (6, 'Hulst', 'location', FALSE, NULL),
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
#     (2, 2, 3), -- Middelburg role with Middelburg tag
#     (3, 3, 4), -- Goes role with Goes tag
#     (4, 4, 5), -- Reimerswaal role with Reimerswaal tag
#     (5, 5, 6), -- Schouwen-Duiveland role with Schouwen-Duiveland tag
#     (6, 6, 7); -- Hulst role with Hulst tag


-- Assign each meber a role, based on the demo setup
INSERT INTO meber_roles (meber_id, role_id)
VALUES
    (1, 1), -- Admin User assigned to admin role
    (2, 2); -- Team Fraude Member assigned to team fraude role
#     (3, 3), -- Middelburg Member assigned to Middelburg role
#     (4, 4), -- Goes Member assigned to Goes role
#     (5, 5), -- Reimerswaal Member assigned to Reimerswaal role
#     (6, 6), -- Schouwen-Duiveland Member assigned to Schouwen-Duiveland role
#     (7, 7); -- Hulst Member assigned to Hulst role

# -- Update meber_tags with user-created tags
# INSERT INTO meber_tags (meber_id, tag_id)
# VALUES
#     (1, 7), -- Admin User tagged "energy efficiency"
#     (1, 9), -- Admin User tagged "monitoring"
#     (2, 8), -- Team Fraude Member tagged "maintenance"
#     (2, 10), -- Team Fraude Member tagged "safety"
#     (3, 7), -- Middelburg Member tagged "energy efficiency"
#     (4, 9), -- Goes Member tagged "monitoring"
#     (5, 10), -- Reimerswaal Member tagged "safety"
#     (6, 8), -- Schouwen-Duiveland Member tagged "maintenance"
#     (7, 7), -- Hulst Member tagged "energy efficiency"
#     (7, 8); -- Hulst Member tagged "maintenance"
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
#     (3, 2),  -- Middelburg Member has access to "Straatlampen App"
#     (4, 2),  -- Goes Member has access to "Straatlampen App"
#     (5, 2),  -- Reimerswaal Member has access to "Straatlampen App"
#     (6, 2),  -- Schouwen-Duiveland Member has access to "Straatlampen App"
#     (7, 2);  -- Hulst Member has access to "Straatlampen App"

-- Insert application_sensors associations
-- Associating each application with its required sensors
INSERT INTO application_sensors (id, sensor_id, application_id)
VALUES
    (1, 2, 1), -- straatlampen app requires straatlampen sensor
    (2, 1, 2), -- fraude detectie requires spanningssensor
    (3, 1, 3), -- temperatuur monitoring requires spanningssensor
    (4, 3, 3); -- temperatuur monitoring also requires temperatuur sensor