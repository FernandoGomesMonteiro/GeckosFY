# GeckosFy 🦎

## Sobre o Projeto

GeckosFy é uma aplicação web que utiliza a API do Spotify para analisar seu perfil musical e criar playlists personalizadas. A aplicação oferece insights sobre seus gostos musicais, mostrando suas músicas favoritas, gêneros preferidos, e características de áudio como dançabilidade, energia e positividade.

## Funcionalidades

- **Análise de Perfil Musical**: Descubra seu "humor musical" baseado nas características de áudio das suas músicas favoritas
- **Visualização de Músicas Favoritas**: Veja suas músicas mais ouvidas no Spotify
- **Análise de Gêneros e Épocas**: Identifique seus gêneros musicais e décadas favoritas
- **Geração de Playlists Personalizadas**: Crie playlists inteligentes baseadas no seu perfil musical

## Requisitos

- Conta no Spotify
- Node.js e npm instalados
- Navegador web moderno

## Instalação

1. Clone o repositório:
   ```

   cd GeckosFy
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure o CLIENT_ID do Spotify:
   - Acesse o [Dashboard de Desenvolvedores do Spotify](https://developer.spotify.com/dashboard/)
   - Crie um novo aplicativo
   - Adicione `http://127.0.0.1:5500/index.html` como URI de Redirecionamento
   - Copie o CLIENT_ID gerado
   - Abra o arquivo `script.js` e substitua a constante `CLIENT_ID` pelo seu ID:
     ```javascript
     const CLIENT_ID = 'seu-client-id-aqui';
     ```

## Executando o Projeto

1. Inicie o servidor local:
   ```
   npm start
   ```

2. Abra seu navegador e acesse:
   ```
   http://127.0.0.1:5500
   ```

3. Clique em "Conectar com Spotify" e autorize o acesso à sua conta

## Como Funciona

1. **Autenticação**: O aplicativo utiliza o fluxo de autorização PKCE do Spotify para autenticar usuários de forma segura sem necessidade de um backend

2. **Análise de Dados**: Após a autenticação, o aplicativo coleta dados sobre suas músicas favoritas e suas características de áudio

3. **Visualização**: Os dados são processados e apresentados em uma interface amigável, mostrando insights sobre seu perfil musical

4. **Geração de Playlists**: Com base na análise, o aplicativo pode criar playlists personalizadas que são salvas diretamente na sua conta do Spotify

## Permissões do Spotify

O aplicativo solicita as seguintes permissões (scopes):
- `user-library-read`: Para acessar suas músicas salvas
- `playlist-modify-public`: Para criar playlists públicas
- `playlist-modify-private`: Para criar playlists privadas
- `user-top-read`: Para acessar suas músicas mais ouvidas

## Tecnologias Utilizadas

- HTML5, CSS3 e JavaScript
- API Web do Spotify
- Web Crypto API para autenticação PKCE
- HTTP Server para desenvolvimento local

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests com melhorias.

## Licença

Este projeto está licenciado sob a licença ISC - veja o arquivo LICENSE para mais detalhes.

---

Desenvolvido com 💚 e música 🎵