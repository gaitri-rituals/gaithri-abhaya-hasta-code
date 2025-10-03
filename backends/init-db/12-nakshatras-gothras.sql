-- Create tables for nakshatras and gothras
CREATE TABLE IF NOT EXISTS nakshatras (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gothras (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert nakshatras data
INSERT INTO nakshatras (name) VALUES 
('Ashwini'), ('Bharani'), ('Krittika'), ('Rohini'), ('Mrigashira'), ('Ardra'),
('Punarvasu'), ('Pushya'), ('Ashlesha'), ('Magha'), ('Purva Phalguni'), ('Uttara Phalguni'),
('Hasta'), ('Chitra'), ('Swati'), ('Vishakha'), ('Anuradha'), ('Jyeshtha'),
('Mula'), ('Purva Ashadha'), ('Uttara Ashadha'), ('Shravana'), ('Dhanishta'), ('Shatabhisha'),
('Purva Bhadrapada'), ('Uttara Bhadrapada'), ('Revati')
ON CONFLICT (name) DO NOTHING;

-- Insert common gothras data
INSERT INTO gothras (name) VALUES 
('Bharadwaja'), ('Kashyapa'), ('Atri'), ('Vishwamitra'), ('Jamadagni'), ('Vasishta'), ('Agastya'),
('Angirasa'), ('Gautama'), ('Bhrigu'), ('Pulastya'), ('Pulaha'), ('Kratu'), ('Marichi'),
('Daksha'), ('Kasyapa'), ('Shandilya'), ('Kaushika'), ('Harita'), ('Mudgala'),
('Parasara'), ('Vatsya'), ('Shaunaka'), ('Garga'), ('Kanva'), ('Yaska'), ('Kapila'),
('Katyayana'), ('Kaundinya'), ('Dhanvantari')
ON CONFLICT (name) DO NOTHING;