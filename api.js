// JM Elegance | API Cloudflare. Senhas nunca vão para o repositório.
async function send(path,options={}){
  let response;
  try{
    response=await fetch('/api'+path,{credentials:'same-origin',cache:'no-store',...options,headers:{...(options.body instanceof Blob?{}:{Accept:'application/json'}),...options.headers}});
  }catch{throw Error('Falha de conexão com a loja. Tente novamente.')}
  if(!response.ok){
    let d;try{d=await response.json()}catch{}
    throw Error(d?.error||'Erro ao acessar o catálogo ('+response.status+').');
  }
  return response.status===204?null:response.json();
}
const jsonBody=data=>({headers:{'content-type':'application/json'},body:JSON.stringify(data)});
export function getStoredSession(){return null}
export async function signIn(email,password){return send('/login',{method:'POST',...jsonBody({email,password})})}
export async function signOut(){try{return await send('/logout',{method:'POST',...jsonBody({})})}catch{return null}}
export async function getCurrentUser(){try{const r=await send('/session');return r?.user||null}catch{return null}}
export async function isAdmin(id){return id==='jm-admin'}
export async function listProducts(withDrafts=false){return send('/products'+(withDrafts?'?all=1':''))}
export async function getSettings(){return send('/settings')}
export async function saveSettings(payload){return send('/settings',{method:'PATCH',...jsonBody(payload)})}
export async function saveProduct(payload,id){return send('/products'+(id?'/'+encodeURIComponent(id):''),{method:id?'PATCH':'POST',...jsonBody(payload)})}
export async function deleteProduct(id){return send('/products/'+encodeURIComponent(id),{method:'DELETE',...jsonBody({})})}
export function publicImageUrl(path){
  if(!/^assets\/products\/[a-f0-9-]{36}\.webp$/.test(path||''))return '';
  return '/api/photos/'+path.split('/').pop();
}
export async function uploadPhoto(file){
  const response=await send('/photos',{method:'POST',headers:{'content-type':'image/webp'},body:file});
  return response.path;
}
export async function removePhotos(paths){
  if(paths?.length)return send('/photos',{method:'DELETE',...jsonBody({paths})});
}
export function contactLinks(settings={},name=''){let group='';let direct='';let instagram='';try{const u=new URL(settings.group_url||'');if(u.protocol==='https:'&&u.hostname==='chat.whatsapp.com'&&u.pathname.length>2)group=u.toString()}catch{}const number=String(settings.whatsapp_number||'').replace(/\D/g,'');if(/^\d{10,15}$/.test(number)){const text=name?'Olá! Vi a peça "'+name+'" no catálogo JM Elegance e gostaria de saber mais.':'Olá! Vim pelo site JM Elegance e gostaria de atendimento.';direct='https://wa.me/'+number+'?text='+encodeURIComponent(text)}try{const u=new URL(settings.instagram_url||'');if(u.protocol==='https:'&&['instagram.com','www.instagram.com'].includes(u.hostname))instagram=u.toString()}catch{}return {group,direct,instagram}}
export function formatPrice(value){if(value==null||value==='')return 'Consulte o valor';return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value))}
export function categoryLabel(v){return ({feminino:'Feminino',masculino:'Masculino',fitness:'Fitness',infantil:'Infantil'})[v]||'Moda'}
export function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
export async function compressPhoto(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Escolha fotos JPG, PNG ou WEBP.');if(file.size>8*1024*1024)throw Error('Cada imagem pode ter até 8 MB.');const bitmap=await createImageBitmap(file).catch(()=>{throw Error('A foto não pôde ser aberta.')});const scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));const c=document.createElement('canvas');c.width=Math.round(bitmap.width*scale)||1;c.height=Math.round(bitmap.height*scale)||1;const ctx=c.getContext('2d');if(!ctx)throw Error('Falha ao processar foto.');ctx.drawImage(bitmap,0,0,c.width,c.height);bitmap.close?.();const data=await new Promise(resolve=>c.toBlob(resolve,'image/webp',.86));if(!data)throw Error('Não foi possível converter a foto.');return new File([data],crypto.randomUUID()+'.webp',{type:'image/webp'})}