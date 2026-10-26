export async function ensureDialogueEnglish(pool) {
 const [columns]=await pool.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='dialogues' AND COLUMN_NAME='dialogue_english'")
 if(!columns.length)await pool.query('ALTER TABLE dialogues ADD COLUMN dialogue_english TEXT NULL AFTER dialogue')
}
export async function ensureDialogueVariants(pool) {
 const [columns]=await pool.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='dialogues' AND COLUMN_NAME='dialogue_variants'")
 if(!columns.length)await pool.query('ALTER TABLE dialogues ADD COLUMN dialogue_variants JSON NULL')
}
