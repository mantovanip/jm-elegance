import test from 'node:test';import assert from 'node:assert/strict';import {categoryLabel,formatPrice,escapeHtml,contactLinks,verifiedEmailMatches} from '../api.js';
test('categorias da vitrine',()=>{assert.equal(categoryLabel('feminino'),'Feminino');assert.equal(categoryLabel('masculino'),'Masculino');assert.equal(categoryLabel('fitness'),'Fitness')});
test('preços em reais e valor opcional',()=>{assert.equal(formatPrice(null),'Consulte o valor');assert.ok(formatPrice(199.9).includes('199,90'))});
test('escapa caracteres HTML em texto',()=>assert.equal(escapeHtml('<script>"&</script>'),'&lt;script&gt;&quot;&amp;&lt;/script&gt;'));
test('gera links válidos de grupo e chat',()=>{const x=contactLinks({group_url:'https://chat.whatsapp.com/abc123',whatsapp_number:'5548999999999'});assert.ok(x.group.startsWith('https://chat.whatsapp.com/'));assert.ok(x.direct.includes('wa.me/5548999999999'))});
test('recusa links de falsos domínios',()=>{const x=contactLinks({group_url:'https://chat.whatsapp.com.phishing.dev/abc',instagram_url:'javascript:alert(1)',whatsapp_number:'abc'});assert.equal(x.group,'');assert.equal(x.instagram,'');assert.equal(x.direct,'')});
test('login com e-mail verificado sem exigir nome de usuário',()=>{
  const addresses=[{email:'Contato@Exemplo.com',verified:true},{email:'naoconfirmado@exemplo.com',verified:false}];
  assert.equal(verifiedEmailMatches('contato@exemplo.com',addresses),true);
  assert.equal(verifiedEmailMatches('  CONTATO@exemplo.com  ',addresses),true);
  assert.equal(verifiedEmailMatches('naoconfirmado@exemplo.com',addresses),false);
  assert.equal(verifiedEmailMatches('desconhecido@exemplo.com',addresses),false);
  assert.equal(verifiedEmailMatches('invalid-email',addresses),false);
});
