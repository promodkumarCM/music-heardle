CREATE DATABASE IF NOT EXISTS malayalam_heardle;
USE malayalam_heardle;

CREATE TABLE IF NOT EXISTS scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_name VARCHAR(24) NOT NULL,
  level INT NOT NULL,
  time_ms INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_level_time (level, time_ms)
);
