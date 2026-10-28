export function stockOrder(rows){
 const remaining=[...rows],result=[]
 let last
 while(remaining.length){const choices=remaining.map((row,index)=>({row,index})).filter(({row})=>(row.group??row.id)!==last);const pool=choices.length?choices:remaining.map((row,index)=>({row,index}));const chosen=pool[Math.floor(Math.random()*pool.length)];remaining.splice(chosen.index,1);result.push(chosen.row);last=chosen.row.group??chosen.row.id}
 return result
}
