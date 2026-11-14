# JM Elegance | Vitrine e painel administrativo

Catálogo elegante de roupas femininas, masculinas e fitness, com atendimento **exclusivamente via WhatsApp**. Não existe carrinho, checkout, cobrança ou pagamento pelo site.

## O que está implementado

- **Site público:** home responsiva, identidade JM Elegance em preto, creme e dourado, categorias, filtros, busca por nome/descrição, detalhes e múltiplas fotos, preços opcionais e links de WhatsApp.
- **Painel em `/admin/`:** login por e-mail/senha, autorização por administrador, indicadores do catálogo, cadastro, edição, exclusão, rascunho/publicação e envio de até **6 fotos** por peça (JPG/PNG/WEBP; limite de 8 MB cada, com redimensionamento WebP no navegador).
- **Configurações:** link de convite do grupo, número de WhatsApp para atendimento individual, Instagram e mensagem personalizada.
- **Banco e armazenamento:** Supabase Auth, Postgres, Storage e políticas de segurança RLS. Somente membros de `admin_users` alteram dados ou imagens; visitantes veem produtos publicados.
- **Sem dependências de frontend:** HTML, CSS e JavaScript modular. Não precisa instalar frameworks ou executar um build.

## Primeiros passos (ordem recomendada)

### 1. Repositório GitHub da JM Elegance

O repositório é `mantovanip/jm-elegance`, separado de todos os outros projetos. A hospedagem comercial recomendada é Cloudflare Pages conectado a este GitHub. O GitHub Pages não deve ser usado para lojas comerciais, conforme suas limitações de uso.

### 2. Crie um projeto Supabase **novo**, exclusivo da JM Elegance

Em <https://supabase.com/dashboard>, crie um projeto separado. Verifique o custo apresentado antes de confirmar. **Não execute o SQL no banco do DolceMed.**

Abra **SQL Editor**, cole e execute **todo** o arquivo `supabase/schema.sql`. O arquivo cria tabelas, permissões RLS, gatilhos e o bucket público `product-images` com escrita restrita ao administrador.

### 3. Crie o primeiro administrador

Em **Supabase > Authentication > Users > Add user**, cadastre o e-mail e senha da pessoa administradora. Confirme o e-mail, caso aplicável, e copie o **User UID** desse usuário.

Em **SQL Editor**, execute, trocando pelo UID real:

```sql
insert into public.admin_users (user_id)
values ('COLE-AQUI-O-UUID-REAL-DO-USUARIO')
on conflict (user_id) do nothing;
```

**Segurança:** não adicione uma página de cadastro público. Não exponha a senha em código. Para incluir outra administradora, crie outro usuário e autorize seu UID da mesma maneira. Em Authentication > Providers, avalie desativar cadastro aberto de novos usuários.

### 4. Conecte o site ao Supabase

No Supabase, copie **Project URL** e **Publishable key** em Project Settings / API Keys (ou painel Connect). Abra `config.js`:

```js
export const CONFIG = {
  SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_SUA_CHAVE_PUBLICA'
};
```

A chave **publishable** é adequada para código público, desde que as políticas RLS estejam ativas. **Nunca** coloque `sb_secret_...` ou `service_role` neste arquivo.

Sem essa configuração, a vitrine mostra produtos **ilustrativos**, identificados como demonstração, e o painel informa que ainda não está conectado. Esses produtos de demonstração não são gravados no banco.

### 5. Teste localmente

É necessário Node.js 20+ apenas para o servidor de desenvolvimento:

```bash
npm run dev
```

- Vitrine: <http://localhost:4173/>
- Administração: <http://localhost:4173/admin/>
- Testes de utilitários: `npm test`

Para testar de verdade, entre no painel, preencha o WhatsApp, cadastre uma peça com foto, publique e veja a vitrine. Depois edite, crie um rascunho e exclua a peça. Teste também um usuário **sem** autorização para garantir bloqueio de escrita.

### 6. Hospedagem e publicação automática

Este repositório já está ligado a um projeto **Cloudflare Pages** exclusivo chamado `jm-elegance`, com a branch `main` como origem. Ao fazer commits nesta branch, a Cloudflare publica a vitrine em:

**https://jm-elegance.pages.dev/**

A hospedagem é independente de qualquer outro projeto Cloudflare. O serviço de banco permanece separado e precisa ser configurado no Supabase.

- Build command: vazio (site HTML/CSS/JS estático).
- Output directory: `.`
- Production branch: `main`.
- A administração fica em `/admin/`.
- Antes de usar comercialmente, crie o Supabase exclusivo da loja, cadastre o administrador, preencha a chave pública em `config.js`, configure o grupo de WhatsApp e substitua as peças de demonstração pelas reais.

Não utilize **GitHub Pages** como hospedagem de uma loja, pois as regras de uso do serviço não permitem sites voltados principalmente para transações comerciais. O GitHub aqui hospeda e versiona o código.

### 7. Configure o WhatsApp

No painel, vá em **Configurações** e preencha:

- **Grupo:** link de convite gerado no WhatsApp (`https://chat.whatsapp.com/...`).
- **Número:** telefone com DDI e DDD, exemplo `5548999999999`. O catálogo envia a referência da peça no atendimento individual.
- **Instagram:** opcional.

Você pode usar só o grupo, só atendimento individual ou ambos. Se o grupo não existir, o botão do grupo fica indisponível até configurá-lo.

## Estrutura do projeto

```text
index.html              Vitrine pública
styles.css              Identidade visual responsiva
src.js                  Listagem, categorias, busca, detalhes, links
api.js                  Autenticação, API, produtos, fotos, configurações
config.js               URL e chave PÚBLICA do Supabase
admin/index.html        Login, dashboard, formulários
admin/admin.css         Visual do painel
admin/admin.js          CRUD de roupas, fotos e configurações
supabase/schema.sql     Esquema, Storage e políticas RLS
assets/                 Logotipo JM Elegance
serve.mjs               Servidor local sem dependências
test/                   Testes de funções puras
```

## Observações de operação

- As imagens ficam em bucket público porque o catálogo é público. Não envie documentos pessoais ou fotos que devam permanecer privadas.
- A exclusão de peça tenta remover fotos do bucket; se houver falha de conexão após a exclusão, verifique arquivos órfãos no Supabase Storage.
- O design usa imagens editoriais externas **apenas no modo de demonstração**, até as peças reais serem cadastradas. Não publique a demonstração como se fossem produtos reais.
- O site não reserva produtos, controla estoque, entrega, frete ou pagamentos. Esses recursos não foram solicitados.
- Este projeto não foi implantado em ambiente público nem conectado a um banco real por este pacote. O teste de integração com Supabase será possível depois da configuração.

## Fontes técnicas

- <https://supabase.com/docs/guides/api>
- <https://supabase.com/docs/guides/storage/security/access-control>
- <https://supabase.com/docs/guides/storage/buckets/fundamentals>
- <https://supabase.com/docs/guides/auth/passwords>