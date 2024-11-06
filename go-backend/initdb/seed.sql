
-- Insert predefined roles

INSERT INTO roles (name, description, is_admin, is_restricted) VALUES
    ('admin', 'Administrator role', TRUE, FALSE),
    ('team fraude', 'Fraud investigation team', FALSE, FALSE),
    ('Middelburg', 'Role for gemeente Middelburg', FALSE, TRUE),
    ('Goes', 'Role for gemeente Goes', FALSE, TRUE),
    ('Reimerswaal', 'Role for gemeente Reimerswaal', FALSE, TRUE),
    ('Schouwen-Duiveland', 'Role for gemeente Schouwen-Duiveland', FALSE, TRUE),
    ('Hulst', 'Role for gemeente Hulst', FALSE, TRUE);

-- Insert tags

INSERT INTO tags (name, type, is_editable) VALUES
    ('fraude', 'team', TRUE),
    ('Middelburg', 'location', FALSE),
    ('Goes', 'location', FALSE),
    ('Reimerswaal', 'location', FALSE),
    ('Schouwen-Duiveland', 'location', FALSE),
    ('Hulst', 'location', FALSE);

-- Insert sensors

INSERT INTO sensors (name, description) VALUES
    ('spanningssensor', 'Voltage sensor for monitoring voltage levels'),
    ('straatlampen', 'Sensor for monitoring street lights'),
    ('temperatuur sensor', 'Temperature sensor for environmental monitoring'),
    ('audio sensor', 'Microphone for audio monitoring');

-- Insert applications

INSERT INTO applications (name, version, description, repo_url) VALUES
    ('Straatlampen App', '1.0', 'Applicatie die straatlampen kan beheren', 'https://example.com/straatlampen-app'),
    ('Fraude Detectie', '2.1', 'Applicatie die fraude kan detecteren binnen de regio van de middenspanningsruimte', 'https://example.com/fraude-detectie'),
    ('Temperatuur Monitoring', '1.3', 'App for monitoring temperature levels', 'https://example.com/temperature-monitoring'),
    ('Audio Analysis', '1.2', 'Audio analysis application for public safety', 'https://example.com/audio-analysis');