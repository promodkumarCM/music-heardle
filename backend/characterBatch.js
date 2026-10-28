export function characterBatch(pool,validate,fields){return async(req,res)=>{
 const input=req.body||{},entries=input.entries
 if(!Array.isArray(entries)||entries.length<1||entries.length>50)return res.status(400).json({error:'Add between 1 and 50 character/movie pairs.'})
 let data
 try{
  data=entries.map(entry=>({id:entry.id,...validate('characters',{...entry,actor_name:input.actor_name,actor_image_url:input.actor_image_url||'',actor_image_urls:input.actor_image_urls})}))
  const seen=new Set(),ids=new Set()
  for(const row of data){const key=JSON.stringify([row.movie.normalize('NFC').toLowerCase(),row.character_name.normalize('NFC').toLowerCase()]);if(seen.has(key))throw Error('Each character/movie pair must be unique.');seen.add(key);if(row.id!==undefined&&(!Number.isSafeInteger(row.id)||row.id<1||ids.has(row.id)))throw Error('Invalid or duplicate character ID.');if(row.id)ids.add(row.id)}
  if(input.original_actor!==undefined&&(typeof input.original_actor!=='string'||!input.original_actor.trim()||input.original_actor.length>255))throw Error('Invalid actor selection.')
 }catch(error){return res.status(400).json({error:error.message})}
 let connection
 try{
  connection=await pool.getConnection();await connection.beginTransaction()
  const original=input.original_actor||data[0].actor_name
  const [existing]=await connection.query('SELECT id FROM character_puzzles WHERE actor_name=? FOR UPDATE',[original])
  const owned=new Set(existing.map(row=>row.id))
  if(data.some(row=>row.id&&!owned.has(row.id))){await connection.rollback();return res.status(409).json({error:'The actor entries changed. Reload and try again.'})}
  if(!input.original_actor&&existing.length){await connection.rollback();return res.status(409).json({error:'This actor already exists. Select them from the list to add more characters.'})}
  if(input.original_actor&&original!==data[0].actor_name){const [other]=await connection.query('SELECT id FROM character_puzzles WHERE actor_name=? FOR UPDATE',[data[0].actor_name]);if(other.length){await connection.rollback();return res.status(409).json({error:'An actor with that name already exists.'})}}
  const ids=[]
  for(const row of data){
   if(row.id){await connection.query(`UPDATE character_puzzles SET ${fields.map(field=>field+'=?').join(',')} WHERE id=?`,[...fields.map(field=>row[field]),row.id]);ids.push(row.id)}
   else{const [result]=await connection.query(`INSERT INTO character_puzzles (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`,fields.map(field=>row[field]));ids.push(result.insertId)}
  }
  if(input.original_actor)await connection.query('UPDATE character_puzzles SET actor_name=?,actor_image_url=?,actor_image_urls=? WHERE actor_name=?',[data[0].actor_name,data[0].actor_image_url,data[0].actor_image_urls,original])
  await connection.commit();res.status(201).json({ids,actor_name:data[0].actor_name})
 }catch(error){if(connection)await connection.rollback();res.status(error.code==='ER_DUP_ENTRY'?409:503).json({error:error.code==='ER_DUP_ENTRY'?'A character/movie pair already exists. Nothing was saved.':'Could not save actor entries. Nothing was saved.'})}finally{connection?.release()}
}}
