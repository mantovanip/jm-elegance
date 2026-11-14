// JM Elegance: catálogo no GitHub. O token nunca é salvo no código.
const API='https://api.github.com/repos/mantovanip/jm-elegance';
const PRODUCT_FILE='data/products.json',SETTINGS_FILE='data/settings.json';
let token=null,user=null;const pending=new Map();
async function gh(method,path,body){
  if(!token)throw Error('Faça login com um token do GitHub.');
  let r;try{r=await fetch(path.startsWith('https://')?path:API+path,{method,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+token,...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)}),cache:'no-store'})}catch{throw Error('Não foi possível conectar ao GitHub.')}
  if(!r.ok){const d=await r.json().catch(()=>({}));if(r.status===401)throw Error('Token inválido ou expirado.');if(r.status===403)throw Error('Acesso negado. O token precisa de Contents: Read and write para jm-elegance.');if(r.status===409||r.status===422)throw Error('Conflito de atualização. Atualize e tente novamente.');throw Error(d.message||'GitHub: erro '+r.status)}
  return r.status===204?null:r.json();
}
const decode=b=>new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g,'')),c=>c.charCodeAt(0)));
async function readRepo(path,defaultValue){const r=await gh('GET','/contents/'+path+'?ref=main');return JSON.parse(decode(r.content))}
async function readPublic(path){const r=await fetch('/'+path+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('Não foi possível carregar o catálogo.');return r.json()}
export const getStoredSession=()=>token&&user?{user}:null;
export async function signIn(username,secret){
  if(!/^(github_pat_|gh[pousr]_)/.test((secret||'').trim()))throw Error('Use um token pessoal fine-grained do GitHub.');
  token=secret.trim();
  try{const u=await gh('GET','https://api.github.com/user');const r=await gh('GET','');if(username?.trim().toLowerCase()!==u.login.toLowerCase())throw Error('Usuário e token GitHub não correspondem.');if(!r.permissions?.push)throw Error('Seu usuário não tem permissão para alterar este repositório.');user=u;return{user:u}}catch(e){token=null;user=null;throw e}
}
export async function signOut(){token=null;user=null;pending.clear()}
export async function getCurrentUser(){return user}
export async function isAdmin(id){return Boolean(token&&user&&user.id===id)}
export async function listProducts(drafts=false){const all=drafts?await readRepo(PRODUCT_FILE,[]):await readPublic(PRODUCT_FILE);return (Array.isArray(all)?all:[]).filter(p=>drafts||p.published).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)))}
export async function getSettings(){return token?readRepo(SETTINGS_FILE,{}):readPublic(SETTINGS_FILE)}
async function encodeFile(file){const bytes=new Uint8Array(await file.arrayBuffer());let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text)}
async function gitCommit(changes,message){
  const ref=await gh('GET','/git/ref/heads/main');const head=ref.object.sha;
  const base=await gh('GET','/git/commits/'+head);
  const tree=[];
  for(const c of changes){
    if(c.remove){tree.push({path:c.path,mode:'100644',type:'blob',sha:null});continue}
    if(c.file){const b=await gh('POST','/git/blobs',{content:await encodeFile(c.file),encoding:'base64'});tree.push({path:c.path,mode:'100644',type:'blob',sha:b.sha})}
    else tree.push({path:c.path,mode:'100644',type:'blob',content:JSON.stringify(c.data,null,2)+'\n'});
  }
  const t=await gh('POST','/git/trees',{base_tree:base.tree.sha,tree});
  const commit=await gh('POST','/git/commits',{message,tree:t.sha,parents:[head]});
  await gh('PATCH','/git/refs/heads/main',{sha:commit.sha,force:false});pending.clear();
}
const safePhotos=p=>(p?.photos||[]).filter(x=>/^assets\/products\/[\w-]+\.webp$/.test(x));
export async function uploadPhoto(file){if(!token)throw Error('Entre no painel.');const path='assets/products/'+crypto.randomUUID()+'.webp';pending.set(path,file);return path}
export async function removePhotos(paths){for(const p of paths||[])pending.delete(p)}
export function publicImageUrl(path){return /^assets\/products\/[\w-]+\.webp$/.test(path||'')?'/'+path:''}
export async function saveProduct(data,id){
  const all=await readRepo(PRODUCT_FILE,[]),idx=id?all.findIndex(p=>p.id===id):-1;
  if(id&&idx<0)throw Error('Peça não encontrada. Atualize o painel.');
  if(!['feminino','masculino','fitness'].includes(data.category))throw Error('Categoria inválida.');
  const photos=safePhotos(data);if(photos.length<1||photos.length>6)throw Error('Adicione de uma a seis fotos.');
  const old=idx>=0?all[idx]:null,now=new Date().toISOString();
  const p={id:id||crypto.randomUUID(),name:data.name.trim(),description:data.description.trim(),category:data.category,price:data.price??null,photos,published:!!data.published,created_at:old?.created_at||now,updated_at:now};
  if(idx>=0)all[idx]=p;else all.unshift(p);
  await gitCommit([{path:PRODUCT_FILE,data:all},...photos.filter(x=>pending.has(x)).map(x=>({path:x,file:pending.get(x)})),...safePhotos(old).filter(x=>!photos.includes(x)).map(x=>({path:x,remove:true}))],(id?'Editar':'Adicionar')+' peça JM Elegance: '+p.name.slice(0,60));
  return p;
}
export async function deleteProduct(id){
  const all=await readRepo(PRODUCT_FILE,[]),old=all.find(p=>p.id===id);
  if(!old)throw Error('Peça não encontrada.');
  await gitCommit([{path:PRODUCT_FILE,data:all.filter(p=>p.id!==id)},...safePhotos(old).map(p=>({path:p,remove:true}))],'Excluir peça JM Elegance: '+old.name.slice(0,60));
}
export async function saveSettings(data){
  const settings={...(await readRepo(SETTINGS_FILE,{})),...data,updated_at:new Date().toISOString()};
  await gitCommit([{path:SETTINGS_FILE,data:settings}],'Atualizar contatos JM Elegance');return settings;
}
export function contactLinks(settings={},name=''){let group='';let direct='';let instagram='';try{const u=new URL(settings.group_url||'');if(u.protocol==='https:'&&u.hostname==='chat.whatsapp.com'&&u.pathname.length>2)group=u.toString()}catch{}const number=String(settings.whatsapp_number||'').replace(/\D/g,'');if(/^\d{10,15}$/.test(number)){const text=name?'Olá! Vi a peça "'+name+'" no catálogo JM Elegance e gostaria de saber mais.':'Olá! Vim pelo site JM Elegance e gostaria de atendimento.';direct='https://wa.me/'+number+'?text='+encodeURIComponent(text)}try{const u=new URL(settings.instagram_url||'');if(u.protocol==='https:'&&['instagram.com','www.instagram.com'].includes(u.hostname))instagram=u.toString()}catch{}return {group,direct,instagram}}
export function formatPrice(value){if(value==null||value==='')return 'Consulte o valor';return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value))}
export function categoryLabel(v){return ({feminino:'Feminino',masculino:'Masculino',fitness:'Fitness'})[v]||'Moda'}
export function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
export async function compressPhoto(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Escolha fotos JPG, PNG ou WEBP.');if(file.size>8*1024*1024)throw Error('Cada imagem pode ter até 8 MB.');const bitmap=await createImageBitmap(file).catch(()=>{throw Error('A foto não pôde ser aberta.')});const scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));const c=document.createElement('canvas');c.width=Math.round(bitmap.width*scale)||1;c.height=Math.round(bitmap.height*scale)||1;const ctx=c.getContext('2d');if(!ctx)throw Error('Falha ao processar foto.');ctx.drawImage(bitmap,0,0,c.width,c.height);bitmap.close?.();const data=await new Promise(resolve=>c.toBlob(resolve,'image/webp',.86));if(!data)throw Error('Não foi possível converter a foto.');return new File([data],crypto.randomUUID()+'.webp',{type:'image/webp'})}