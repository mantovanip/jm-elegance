import test from 'node:test';
import assert from 'node:assert/strict';
import {categoryLabel,formatPrice,escapeHtml,contactLinks,publicImageUrl} from '../api.js';
test('quatro categorias da vitrine',()=>{
 for(const [value,label] of Object.entries({feminino:'Feminino',masculino:'Masculino',fitness:'Fitness',infantil:'Infantil'}))assert.equal(categoryLabel(value),label);
});
test('preços e valor opcional',()=>{assert.equal(formatPrice(null),'Consulte o valor');assert.ok(formatPrice(199.9).includes('199,90'))});
test('escapa HTML',()=>assert.equal(escapeHtml('<script>"&</script>'),'&lt;script&gt;&quot;&amp;&lt;/script&gt;'));
test('gera links válidos para WhatsApp',()=>{
 const x=contactLinks({group_url:'https://chat.whatsapp.com/abc123',whatsapp_number:'5548999999999'});
 assert.ok(x.group.startsWith('https://chat.whatsapp.com/'));assert.ok(x.direct.includes('wa.me/5548999999999'));
});
test('rejeita contatos suspeitos',()=>{
 const x=contactLinks({group_url:'https://chat.whatsapp.com.phishing.dev/abc',instagram_url:'javascript:alert(1)',whatsapp_number:'abc'});
 assert.equal(x.group,'');assert.equal(x.instagram,'');assert.equal(x.direct,'');
});
test('fotos publicadas são servidas apenas via API interna',()=>{
 assert.equal(publicImageUrl('assets/products/11111111-1111-4111-8111-111111111111.webp'),'/api/photos/11111111-1111-4111-8111-111111111111.webp');
 assert.equal(publicImageUrl('https://example.com/image'),'');
});
