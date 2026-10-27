CREATE DATABASE IF NOT EXISTS malayalam_heardle;
USE malayalam_heardle;

CREATE TABLE IF NOT EXISTS songs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  movie VARCHAR(255) NOT NULL,
  youtube_id VARCHAR(11) NOT NULL,
  release_year SMALLINT UNSIGNED NULL
);

CREATE TABLE IF NOT EXISTS scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_name VARCHAR(24) NOT NULL,
  level INT NOT NULL,
  time_ms INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_level_time (level, time_ms)
);

CREATE TABLE IF NOT EXISTS dialogues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dialogue TEXT NOT NULL,
  dialogue_english TEXT NULL,
  dialogue_variants JSON NULL,
  movie VARCHAR(255) NOT NULL,
  aliases JSON NOT NULL,
  source_url VARCHAR(600) NOT NULL,
  UNIQUE KEY unique_dialogue_movie (movie)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movie_puzzles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie VARCHAR(255) NOT NULL UNIQUE,
  aliases JSON NOT NULL,
  clues JSON NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS picture_puzzles (id INT AUTO_INCREMENT PRIMARY KEY, movie VARCHAR(255) NOT NULL, aliases JSON NOT NULL, image_url VARCHAR(600) NOT NULL, mobile_image_url VARCHAR(600) NULL);

CREATE TABLE IF NOT EXISTS contributions (
 id INT AUTO_INCREMENT PRIMARY KEY, kind VARCHAR(20) NOT NULL, content TEXT NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'pending', catalog_id INT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, reviewed_at TIMESTAMP NULL,
 INDEX contribution_status (status,created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS character_puzzles (
 id INT AUTO_INCREMENT PRIMARY KEY,
 movie VARCHAR(255) NOT NULL, character_name VARCHAR(255) NOT NULL,
 character_english VARCHAR(255) NOT NULL DEFAULT '', role VARCHAR(20) NOT NULL,
 aliases JSON NOT NULL, source_url VARCHAR(600) NOT NULL DEFAULT '',
 UNIQUE KEY unique_movie_character (movie,character_name)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
