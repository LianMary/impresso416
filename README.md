# Impresso416

Crie uma plataforma de e-commerce para uma papelaria, em português do Brasil, com design moderno, responsivo (mobile first), limpo e colorido, com tom acolhedor e criativo. Use Supabase para autenticação, banco de dados e armazenamento de imagens.



## PERFIS DE USUÁRIO

1. Cliente (visitante ou logado)

2. Administrador (acesso restrito)



## ÁREA DO CLIENTE



**Página inicial**

- Banner de destaque, categorias principais e seção de produtos em destaque/novidades.



**Catálogo**

- Grade de produtos com foto, nome, preço e botão "Adicionar ao carrinho".

- Filtro por categoria (ex.: cadernos, canetas, material escolar, escritório, arte e artesanato), busca por nome, ordenação por preço e relevância.

- Página de detalhes do produto: galeria de imagens, descrição, preço, estoque disponível e seletor de quantidade.

- Produtos sem estoque aparecem como "Indisponível".



**Carrinho e compra**

- Carrinho com alterar quantidade, remover item e ver subtotal.

- Checkout com: dados do cliente, endereço de entrega (com busca de CEP via ViaCEP), opção de entrega ou retirada na loja, e resumo do pedido.

- Pagamento via Pix e cartão ( apenas visual, sem integração) 

- Ao finalizar, criar o pedido com status "Aguardando pagamento" e reduzir o estoque.



**Conta do cliente**

- Cadastro e login (e-mail/senha e Google).

- Página "Meus pedidos" com histórico e status (Aguardando pagamento, Pago, Em separação, Enviado, Entregue, Cancelado).

- Editar dados pessoais e endereços.



## ÁREA DO ADMINISTRADOR

Acesso por uma rota separada (/admin) com tela de login própria. Apenas usuários com papel "admin" podem entrar.



**Painel (dashboard)**

- Total de vendas, número de pedidos, produtos com estoque baixo e pedidos recentes.



**Gerenciar catálogo**

- Listar produtos em tabela com busca e filtros.

- Criar, editar e excluir produtos: nome, descrição, preço, categoria, quantidade em estoque, upload de várias imagens e opção de ativar/desativar (visível ou não na loja).

- Gerenciar categorias (criar, editar, excluir).



**Gerenciar pedidos**

- Lista de pedidos com filtro por status.

- Ver detalhes do pedido e alterar o status.

## EXTRAS

- Estados de carregamento (skeletons), mensagens de erro/sucesso (toasts) e página 404.

- Rodapé com informações da loja, contato e redes sociais.

- Insira alguns produtos e categorias de exemplo para eu visualizar o catálogo.

- Crie um usuário administrador inicial e me explique como definir o meu.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d1f0b126-f09a-496e-abf2-7e6667555607).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
