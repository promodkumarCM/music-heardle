export const characterTable=`CREATE TABLE IF NOT EXISTS character_puzzles (
 id INT AUTO_INCREMENT PRIMARY KEY,
 movie VARCHAR(255) NOT NULL, actor_name VARCHAR(255) NOT NULL DEFAULT '', actor_image_url VARCHAR(600) NOT NULL DEFAULT '', actor_image_urls JSON NULL, character_name VARCHAR(255) NOT NULL,
 hide_actor_until_reveal TINYINT UNSIGNED NOT NULL DEFAULT 0, character_english VARCHAR(255) NOT NULL DEFAULT '', role VARCHAR(20) NOT NULL,
 aliases JSON NOT NULL, source_url VARCHAR(600) NOT NULL DEFAULT '',
 UNIQUE KEY unique_movie_character (movie,character_name)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`

export async function ensureCharacterActor(pool){
 const [columns]=await pool.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='character_puzzles' AND COLUMN_NAME='actor_name'")
 if(!columns.length)await pool.query("ALTER TABLE character_puzzles ADD COLUMN actor_name VARCHAR(255) NOT NULL DEFAULT '' AFTER movie")
}

export async function ensureCharacterImage(pool){
 const [columns]=await pool.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='character_puzzles' AND COLUMN_NAME='actor_image_url'")
 if(!columns.length)await pool.query("ALTER TABLE character_puzzles ADD COLUMN actor_image_url VARCHAR(600) NOT NULL DEFAULT '' AFTER actor_name")
}

export async function ensureActorPhotos(pool){
 const [columns]=await pool.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='character_puzzles' AND COLUMN_NAME='actor_image_urls'")
 if(!columns.length)await pool.query('ALTER TABLE character_puzzles ADD COLUMN actor_image_urls JSON NULL AFTER actor_image_url')
}

export async function ensureCharacterReveal(pool){
 const [columns]=await pool.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='character_puzzles' AND COLUMN_NAME='hide_actor_until_reveal'")
 if(!columns.length)await pool.query('ALTER TABLE character_puzzles ADD COLUMN hide_actor_until_reveal TINYINT UNSIGNED NOT NULL DEFAULT 0')
}
