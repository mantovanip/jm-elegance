import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,join,normalize,sep} from 'node:path';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.txt':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  let file=normalize(join(root,decodeURIComponent(path)));
  if(!file.startsWith(root+sep)&&file!==root){res.writeHead(403);res.end();return}
  try{const info=await stat(file);if(info.isDirectory())file=join(file,'index.html');
    const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(body);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('404 - Arquivo não encontrado')}
});
server.listen(4173,()=>process.stdout.write('JM Elegance: http://localhost:4173/\n'));