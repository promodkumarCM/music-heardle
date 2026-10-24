import express from 'express'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import {randomUUID} from 'node:crypto'
export const uploadDirectory=path.resolve(process.env.UPLOAD_DIR||'uploads/picture-clues')
export function imageExtension(data){
 if(!Buffer.isBuffer(data))return null
 if(data.length>8&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png'
 if(data.length>3&&data[0]===255&&data[1]===216&&data[2]===255)return 'jpg'
 if(data.length>12&&data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP')return 'webp'
 return null
}
export const imageBody=express.raw({type:()=>true,limit:'8mb'})
export async function uploadImage(req,res){
 const ext=imageExtension(req.body)
 if(!ext)return res.status(400).json({error:'Choose a PNG, JPEG or WebP image (up to 8 MB).'})
 if(process.env.NODE_ENV==='production'&&!process.env.UPLOAD_DIR)return res.status(503).json({error:'Configure UPLOAD_DIR on a persistent Railway volume before uploading.'})
 try{await mkdir(uploadDirectory,{recursive:true});const name=`${randomUUID()}.${ext}`;await writeFile(path.join(uploadDirectory,name),req.body,{flag:'wx'});res.status(201).json({url:`/uploads/picture-clues/${name}`})}catch{res.status(503).json({error:'Could not store image. Check the upload volume.'})}
}
export function uploadError(error,req,res,next){if(error?.type==='entity.too.large')return res.status(413).json({error:'Image must be 8 MB or smaller.'});next(error)}
