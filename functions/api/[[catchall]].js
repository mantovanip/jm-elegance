// JM Elegance | API privada do catálogo Cloudflare Pages Functions.
// Apenas variáveis secretas no ambiente Cloudflare, sem segredos no repositório.
const CATEGORIES=new Set(['feminino','masculino','fitness','infantil']);
const PHOTO_RE=/^assets\/products\/[a-f0-9-]{36}\.webp$/;
const COOKIE='jm_admin_session';
const encoder=new TextEncoder();
function json(value,status=200,headers={}){return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}})}
function fail(message,status=400){return json({error:message},status)}
function sameOrigin(request){return request.headers.get('origin')===new URL(request.url).origin}
function fromCookie(request){return request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||''}
function b64(buffer){let s='';for(const ch of new Uint8Array(buffer))s+=String.fromCharCode(ch);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function unb64(value){const s=value.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(s.padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0))}
async function macKey(secret){const bytes=await crypto.subtle.digest('SHA-256',encoder.encode('jm-elegance-cookie-signing:'+secret));return crypto.subtle.importKey('raw',bytes,{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
async function makeSession(secret){const payload=b64(encoder.encode(JSON.stringify({sub:'admin',exp:Math.floor(Date.now()/1000)+28800})));const signature=b64(await crypto.subtle.sign('HMAC',await macKey(secret),encoder.encode(payload)));return payload+'.'+signature}
async function authenticated(request,env){
  const cookie=fromCookie(request),secret=env.JM_ADMIN_PASSWORD;
  if(!cookie||typeof secret!=='string'||!secret)return false;
  const [p,s,...rest]=cookie.split('.');
  if(!p||!s||rest.length||p.length>512||s.length>128)return false;
  try{
    const ok=await crypto.subtle.verify('HMAC',await macKey(secret),unb64(s),encoder.encode(p));
    if(!ok)return false;
    const data=JSON.parse(new TextDecoder().decode(unb64(p)));
    return data.sub==='admin'&&Number.isSafeInteger(data.exp)&&data.exp>Date.now()/1000;
  }catch{return false}
}
function secureEqual(a,b){
  const aa=encoder.encode(String(a||'')),bb=encoder.encode(String(b||''));
  let d=aa.length^bb.length;for(let i=0;i<Math.max(aa.length,bb.length);i++)d|=(aa[i]||0)^(bb[i]||0);return d===0;
}
async function fingerprint(request){const ip=request.headers.get('cf-connecting-ip')||'unknown';return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode('jm-elegance-attempts:'+ip)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
async function parseJson(request,max=25000){
  const type=request.headers.get('content-type')||'';
  if(!type.toLowerCase().startsWith('application/json'))throw Error('O formato enviado deve ser JSON.');
  if(Number(request.headers.get('content-length')||0)>max)throw Error('O formulário é grande demais.');
  const text=await request.text();if(text.length>max)throw Error('O formulário é grande demais.');
  return JSON.parse(text);
}
function product(row){return {...row,photos:JSON.parse(row.photos||'[]'),published:row.published===1}}
function validateProduct(body){
  const name=String(body.name||'').trim(),description=String(body.description||'').trim(),category=String(body.category||'');
  if(name.length<3||name.length>120)throw Error('Nome deve ter de 3 a 120 caracteres.');
  if(description.length<8||description.length>1200)throw Error('Descrição deve ter de 8 a 1200 caracteres.');
  if(!CATEGORIES.has(category))throw Error('Categoria inválida.');
  const price=(body.price===null||body.price===undefined||body.price==='')?null:Number(body.price);
  if(price!==null&&(!Number.isFinite(price)||price<0||price>99999999))throw Error('Preço inválido.');
  if(!Array.isArray(body.photos)||body.photos.length<1||body.photos.length>6||body.photos.some(p=>typeof p!=='string'||!PHOTO_RE.test(p)))throw Error('Inclua de 1 a 6 fotos válidas.');
  if(new Set(body.photos).size!==body.photos.length)throw Error('Fotos duplicadas.');
  return {name,description,category,price,photos:JSON.stringify(body.photos),published:body.published?1:0};
}
function validateSettings(body){
  const value={};
  for(const key of ['group_url','whatsapp_number','instagram_url','welcome_message'])value[key]=String(body[key]||'').trim();
  if(value.group_url){let u;try{u=new URL(value.group_url)}catch{}if(!u||u.protocol!=='https:'||u.hostname!=='chat.whatsapp.com'||u.pathname.length<3)throw Error('Link do grupo inválido.')}
  value.whatsapp_number=value.whatsapp_number.replace(/\D/g,'');
  if(value.whatsapp_number&&!/^\d{10,15}$/.test(value.whatsapp_number))throw Error('Número do WhatsApp inválido.');
  if(value.instagram_url){let u;try{u=new URL(value.instagram_url)}catch{}if(!u||u.protocol!=='https:'||!['instagram.com','www.instagram.com'].includes(u.hostname))throw Error('Instagram inválido.')}
  if(value.welcome_message.length>160||value.group_url.length>500||value.instagram_url.length>500)throw Error('Campos muito longos.');
  return value;
}
async function listProducts(env,all){
  const sql=all?'SELECT * FROM jm_products ORDER BY created_at DESC LIMIT 500':'SELECT * FROM jm_products WHERE published = 1 ORDER BY created_at DESC LIMIT 500';
  return (await env.JM_DB.prepare(sql).all()).results.map(product);
}
async function getSettings(env){return await env.JM_DB.prepare('SELECT * FROM jm_settings WHERE id=1').first()||{}}
function photoKey(path){return 'photo:'+path.split('/').pop()}
async function handlePhotoRead(env,filename){
  const path='assets/products/'+filename;if(!PHOTO_RE.test(path))return fail('Foto não encontrada.',404);
  const data=await env.JM_PHOTOS.get(photoKey(path),'arrayBuffer');
  if(!data)return fail('Foto não encontrada.',404);
  return new Response(data,{headers:{'content-type':'image/webp','cache-control':'public,max-age=31536000,immutable','x-content-type-options':'nosniff'}});
}
export async function onRequest({request,env}){
  try{
    if(!env.JM_DB||!env.JM_PHOTOS)return fail('Serviço não configurado.',503);
    const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean),route=parts[1]||'',id=parts[2]||'',method=request.method;
    if(parts[0]!=='api')return fail('Não encontrado.',404);
    if(!['GET','HEAD'].includes(method)&&!sameOrigin(request))return fail('Origem não autorizada.',403);
    if(method==='GET'&&route==='photos'&&id)return handlePhotoRead(env,id);
    if(method==='GET'&&route==='products'&&!id){
      const all=url.searchParams.get('all')==='1';if(all&&!await authenticated(request,env))return fail('Sessão necessária.',401);
      return json(await listProducts(env,all));
    }
    if(method==='GET'&&route==='settings')return json(await getSettings(env));
    if(method==='GET'&&route==='session')return await authenticated(request,env)?json({user:{id:'jm-admin',email:env.JM_ADMIN_EMAIL}}):fail('Sessão expirada.',401);
    if(method==='POST'&&route==='login'){
      const secret=env.JM_ADMIN_PASSWORD,email=String(env.JM_ADMIN_EMAIL||'').trim().toLowerCase();
      if(typeof secret!=='string'||!secret)return fail('Administrador ainda não configurado na Cloudflare.',503);
      const body=await parseJson(request,1024),finger=await fingerprint(request),now=Math.floor(Date.now()/1000);
      const rate=await env.JM_DB.prepare('SELECT attempts,window_start FROM jm_login_attempts WHERE fingerprint=?').bind(finger).first();
      if(rate&&now-rate.window_start<900&&rate.attempts>=6)return fail('Muitas tentativas. Tente novamente em 15 minutos.',429);
      const ok=secureEqual(String(body.email||'').trim().toLowerCase(),email)&&secureEqual(String(body.password||''),secret);
      if(!ok){
        await env.JM_DB.prepare('INSERT INTO jm_login_attempts(fingerprint,attempts,window_start) VALUES(?,1,?) ON CONFLICT(fingerprint) DO UPDATE SET attempts=CASE WHEN excluded.window_start-jm_login_attempts.window_start>=900 THEN 1 ELSE jm_login_attempts.attempts+1 END,window_start=CASE WHEN excluded.window_start-jm_login_attempts.window_start>=900 THEN excluded.window_start ELSE jm_login_attempts.window_start END').bind(finger,now).run();
        return fail('E-mail ou senha incorretos.',401);
      }
      await env.JM_DB.prepare('DELETE FROM jm_login_attempts WHERE fingerprint=?').bind(finger).run();
      const cookie=COOKIE+'='+await makeSession(secret)+'; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=28800';
      return json({user:{id:'jm-admin',email}},200,{'set-cookie':cookie});
    }
    if(method==='POST'&&route==='logout')return json({ok:true},200,{'set-cookie':COOKIE+'=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0'});
    if(!await authenticated(request,env))return fail('Sessão necessária.',401);
    if(method==='PATCH'&&route==='settings'&&!id){
      const settings=validateSettings(await parseJson(request,4000)),stamp=new Date().toISOString();
      await env.JM_DB.prepare('UPDATE jm_settings SET group_url=?,whatsapp_number=?,instagram_url=?,welcome_message=?,updated_at=? WHERE id=1').bind(settings.group_url,settings.whatsapp_number,settings.instagram_url,settings.welcome_message,stamp).run();
      return json(await getSettings(env));
    }
    if(method==='POST'&&route==='products'&&!id){
      const p=validateProduct(await parseJson(request,20000)),now=new Date().toISOString(),pid=crypto.randomUUID();
      await env.JM_DB.prepare('INSERT INTO jm_products(id,name,description,category,price,photos,published,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(pid,p.name,p.description,p.category,p.price,p.photos,p.published,now,now).run();
      return json(product(await env.JM_DB.prepare('SELECT * FROM jm_products WHERE id=?').bind(pid).first()),201);
    }
    if(method==='PATCH'&&route==='products'&&/^[a-f0-9-]{36}$/.test(id)){
      const before=await env.JM_DB.prepare('SELECT id FROM jm_products WHERE id=?').bind(id).first();if(!before)return fail('Produto não encontrado.',404);
      const p=validateProduct(await parseJson(request,20000));
      await env.JM_DB.prepare('UPDATE jm_products SET name=?,description=?,category=?,price=?,photos=?,published=?,updated_at=? WHERE id=?').bind(p.name,p.description,p.category,p.price,p.photos,p.published,new Date().toISOString(),id).run();
      return json(product(await env.JM_DB.prepare('SELECT * FROM jm_products WHERE id=?').bind(id).first()));
    }
    if(method==='DELETE'&&route==='products'&&/^[a-f0-9-]{36}$/.test(id)){
      const record=await env.JM_DB.prepare('SELECT photos FROM jm_products WHERE id=?').bind(id).first();if(!record)return fail('Produto não encontrado.',404);
      await env.JM_DB.prepare('DELETE FROM jm_products WHERE id=?').bind(id).run();
      for(const p of JSON.parse(record.photos||'[]'))if(PHOTO_RE.test(p))await env.JM_PHOTOS.delete(photoKey(p));
      return json({ok:true});
    }
    if(method==='POST'&&route==='photos'&&!id){
      const len=Number(request.headers.get('content-length')||0);
      if(!request.headers.get('content-type')?.startsWith('image/webp')||len>5*1024*1024)return fail('Foto deve estar em WebP e ter até 5 MB.',413);
      const bytes=await request.arrayBuffer();
      if(bytes.byteLength<16||bytes.byteLength>5*1024*1024)return fail('Imagem inválida ou muito grande.',413);
      const h=new Uint8Array(bytes).slice(0,12),signature=String.fromCharCode(...h);
      if(signature.slice(0,4)!=='RIFF'||signature.slice(8,12)!=='WEBP')return fail('Arquivo não é uma imagem WebP válida.');
      const path='assets/products/'+crypto.randomUUID()+'.webp';
      await env.JM_PHOTOS.put(photoKey(path),bytes);
      return json({path},201);
    }
    if(method==='DELETE'&&route==='photos'&&!id){
      const data=await parseJson(request,2000);
      if(!Array.isArray(data.paths)||data.paths.length>6)return fail('Lista de fotos inválida.');
      for(const p of data.paths)if(typeof p==='string'&&PHOTO_RE.test(p)){
        const linked=await env.JM_DB.prepare('SELECT COUNT(*) AS total FROM jm_products WHERE photos LIKE ?').bind('%'+p+'%').first();
        if(!linked?.total)await env.JM_PHOTOS.delete(photoKey(p));
      }
      return json({ok:true});
    }
    return fail('Rota inexistente.',404);
  }catch(e){
    if(e instanceof SyntaxError)return fail('Dados inválidos.');
    if(e instanceof Error&&/^(O formato|O formulário|Nome deve|Descrição deve|Categoria inválida|Preço inválido|Inclua|Fotos duplicadas|Link do grupo|Número do WhatsApp|Instagram inválido|Campos muito longos|Lista de fotos)/.test(e.message))return fail(e.message);
    return fail('Falha interna ao processar solicitação.',500);
  }
}
