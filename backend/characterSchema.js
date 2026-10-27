export const characterTable=`CREATE TABLE IF NOT EXISTS character_puzzles (
 id INT AUTO_INCREMENT PRIMARY KEY,
 movie VARCHAR(255) NOT NULL, character_name VARCHAR(255) NOT NULL,
 character_english VARCHAR(255) NOT NULL DEFAULT '', role VARCHAR(20) NOT NULL,
 aliases JSON NOT NULL, source_url VARCHAR(600) NOT NULL DEFAULT '',
 UNIQUE KEY unique_movie_character (movie,character_name)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
