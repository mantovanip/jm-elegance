# JM Elegance | Catálogo de roupas

Vitrine para peças femininas, masculinas, fitness e infantis. O atendimento e as vendas acontecem pelo WhatsApp: não há carrinho nem pagamento no site.

- Loja: https://jm-elegance.pages.dev/
- Administração: https://jm-elegance.pages.dev/admin/
- Código: https://github.com/mantovanip/jm-elegance

## Login do administrador

O painel agora usa **e-mail e senha próprios da JM Elegance**, sem token GitHub no navegador.

A conta de e-mail está configurada **exclusivamente na Cloudflare** como variável de ambiente `JM_ADMIN_EMAIL`, e a senha deve ser configurada somente em **Cloudflare > Workers & Pages > jm-elegance > Settings > Variables and Secrets > Production**.

- Adicione a variável **`JM_ADMIN_PASSWORD`** com o tipo **Secret**.
- Informe a senha escolhida pelo proprietário, sem colocá-la em arquivos do GitHub.
- Faça novo deploy da branch `main` se a Cloudflare solicitar para aplicar as variáveis.
- Nunca salve essa senha no README, no histórico Git ou em arquivos do site.

O servidor valida a senha, emite um cookie de sessão com `HttpOnly`, `Secure` e `SameSite=Strict`, e bloqueia alterações sem sessão. O login conta com limitação de tentativas e expira após oito horas. A senha não é armazenada no navegador em JavaScript.

## Administrar roupas e WhatsApp

Em **Produtos > Nova peça**, envie até 6 imagens JPG/PNG/WEBP, escolha uma categoria (Feminino, Masculino, Fitness, Infantil), preencha descrição, preço opcional e publique. Produtos podem ser editados, excluídos ou mantidos como rascunho.

Em **Configurações**, altere o link de convite para o grupo de WhatsApp, o telefone de atendimento com DDI e DDD (exemplo: 5548999999999), o Instagram opcional e a mensagem de chamada.

## Infraestrutura

O site público é hospedado no Cloudflare Pages conectado ao GitHub, com uma Pages Function na rota `/api/*` e recursos exclusivos:

- **D1** (`JM_DB`, banco `jm-elegance-catalog`): produtos, descrições, categorias, publicação, configurações e registro temporário de tentativas de login.
- **Workers KV** (`JM_PHOTOS`, namespace `jm-elegance-photos`): fotografias WebP das roupas.
- **Secret** (`JM_ADMIN_PASSWORD`): senha do administrador, configurada somente na Cloudflare.
- **Variável** (`JM_ADMIN_EMAIL`): e-mail autorizado.

O banco e as imagens **não ficam no GitHub**. Atualizações do catálogo são imediatas no banco sem gerar commits nem implantar o site novamente.

Os arquivos de origem `functions/api/[[catchall]].js` e `api.js` oferecem as rotas do catálogo, arquivos e autenticação.

## Observações

- Imagens WebP podem ocupar até 5 MB cada após compressão; máximo de 6 por produto.
- Workers KV é apropriado para catálogo pequeno; pode apresentar breve demora de propagação entre regiões.
- Guarde e renove a senha de administrador conforme necessário. Não reutilize uma senha usada em outros serviços.
- O backend falha de maneira segura com HTTP 503 quando o segredo ainda não está configurado.
- Para teste local com Pages Functions e bindings, consulte a documentação atual da Cloudflare Pages; o servidor simples `npm run dev` serve apenas arquivos estáticos, não executa Functions.
