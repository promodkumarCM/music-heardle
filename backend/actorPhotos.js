import {randomInt} from 'node:crypto'
export function actorPhotos(row){
 let photos=row.actor_image_urls
 if(typeof photos==='string'){try{photos=JSON.parse(photos)}catch{photos=[]}}
 return [...new Set([...(Array.isArray(photos)?photos:[]),row.actor_image_url].filter(value=>typeof value==='string'&&value.trim()))]
}
export function validateActorPhotos(input){
 const photos=input.actor_image_urls??(input.actor_image_url?[input.actor_image_url]:[])
 if(!Array.isArray(photos)||photos.length>20||photos.some(url=>typeof url!=='string'||!url.trim()||url.length>600||!/^(https?:\/\/|\/uploads\/picture-clues\/|\/picture-clues\/)/i.test(url)))throw Error('Add up to 20 valid actor photos.')
 return [...new Set(photos.map(url=>url.trim()))]
}
export function randomActorPhoto(row,last){const photos=actorPhotos(row),different=photos.filter(url=>url!==last),pool=different.length?different:photos;return pool.length?pool[randomInt(pool.length)]:''}
