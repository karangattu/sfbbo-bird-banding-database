-- Create photo_tags table in Turso database
-- Run this SQL in your Turso database console or using the Turso CLI

CREATE TABLE IF NOT EXISTS photo_tags (
  id TEXT PRIMARY KEY,
  photoId TEXT NOT NULL,
  recordId TEXT,
  bandNumber TEXT,
  date TEXT,
  location TEXT,
  species TEXT,
  age TEXT,
  sex TEXT,
  firstPhotoNumber TEXT,
  lastPhotoNumber TEXT,
  wrpPlumageCode TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_photo_tags_photoId ON photo_tags(photoId);
CREATE INDEX IF NOT EXISTS idx_photo_tags_recordId ON photo_tags(recordId);
CREATE INDEX IF NOT EXISTS idx_photo_tags_bandNumber ON photo_tags(bandNumber);
CREATE INDEX IF NOT EXISTS idx_photo_tags_species ON photo_tags(species);
