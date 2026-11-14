# JM Elegance | Catálogo de moda

Vitrine para roupas femininas, masculinas e fitness. Não há carrinho, checkout nem pagamento: os clientes seguem para o WhatsApp.

## Acessar o site e o painel

- Loja: https://jm-elegance.pages.dev/
- Painel: https://jm-elegance.pages.dev/admin/
- Código, produtos e fotografias: https://github.com/mantovanip/jm-elegance

## Criar o acesso de administrador

1. Abra https://github.com/settings/personal-access-tokens/new
2. Crie um token **Fine-grained**, selecionando **Only select repositories** e **jm-elegance**.
3. Em **Repository permissions**, escolha **Contents: Read and write**. Em **Account permissions**, habilite **Email addresses: Read-only** para validar seu e-mail verificado. Não dê acesso a outros repositórios. Defina uma data de expiração.
4. Na página /admin/, entre com um **e-mail verificado na sua conta GitHub** e o token. Não use a senha do GitHub.
5. O token permanece apenas em memória nesta aba; após recarregar, é necessário entrar novamente.

Para outra pessoa administrar a loja, convide-a como colaboradora com acesso de escrita no repositório e peça que gere o próprio token com permissão de leitura de e-mail. Não compartilhe credenciais.

## Adicionar e editar roupas

No painel, escolha **Produtos > Nova peça**. Preencha nome, categoria, descrição, preço opcional, até 6 fotos e status publicado ou rascunho. É possível editar e excluir depois.

## Alterar WhatsApp

No painel, escolha **Configurações**. Cole o link de convite do grupo (https://chat.whatsapp.com/...), o telefone de atendimento com código do país e DDD (por exemplo, 5548999999999), Instagram opcional e a mensagem da vitrine. Clique **Salvar configurações**.

## Dados

- data/products.json: lista de peças, descrições, preços, categorias e status.
- data/settings.json: link do grupo, telefone, Instagram e texto.
- assets/products/: fotografias em WEBP.
- Cada alteração gera um commit na branch main e um deploy automático no projeto jm-elegance da Cloudflare Pages.

**Limites e segurança:** GitHub funciona para um catálogo pequeno, mas não é banco de dados para grandes volumes de imagens. Fotos e configurações publicadas são visíveis no repositório público; os arquivos excluídos permanecem no histórico Git. Nunca armazene dados pessoais ou tokens neste repositório. A vitrine pode levar alguns instantes para refletir o deploy. Guarde seu token com segurança e revogue-o se perder o controle.

## Testes

Projeto HTML, CSS e JavaScript sem framework. Execute npm test para validar funções utilitárias. Operações autenticadas no GitHub devem ser testadas por um administrador com token próprio.
