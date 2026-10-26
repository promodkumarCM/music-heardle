import express from 'express'
import {pool} from './db.js'
export const contributionKinds=['pictures','songs','dialogues','clues','lyrics','bug']
export const contributionTable=`CREATE TABLE IF NOT EXISTS contributions (
 id INT AUTO_INCREMENT PRIMARY KEY, kind VARCHAR(20) NOT NULL, content TEXT NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'pending', catalog_id INT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, reviewed_at TIMESTAMP NULL,
 INDEX contribution_status (status,created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
const router=express.Router()
const submissions=new Map()
router.post('/',async(req,res)=>{
 const {kind,content}=req.body||{}
 if(!contributionKinds.includes(kind)||typeof content!=='string'||content.trim().length<10||content.length>20000)return res.status(400).json({error:'Choose a game and enter between 10 and 20,000 characters.'})
 const now=Date.now(),ip=req.ip,recent=(submissions.get(ip)||[]).filter(t=>now-t<3600000)
 if(recent.length>=5)return res.status(429).json({error:'You can submit five contributions per hour. Please try later.'})
 submissions.set(ip,[...recent,now])
 try {await pool.query('INSERT INTO contributions (kind,content) VALUES (?,?)',[kind,content.trim()]);res.status(201).json({ok:true})}
 catch {res.status(503).json({error:'Could not submit your contribution. Please try later.'})}
})
setInterval(()=>{const cutoff=Date.now()-3600000;for(const [ip,times] of submissions)if(times.every(t=>t<cutoff))submissions.delete(ip)},3600000).unref()
export default router
