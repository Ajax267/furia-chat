# FURIA Chat Bot

**Repositório:** [https://github.com/Ajax267/furia-chat](https://github.com/Ajax267/furia-chat)

**Demo:** https://chat-furia-c918aa144b28.herokuapp.com/

Um chatbot e chat em tempo real para torcedores da equipe de CS\:GO FURIA.
Backend em Node.js com Express, Socket.IO e integração com a API PandaScore;
frontend estático (dist) servido pelo mesmo servidor.

---

## 📂 Estrutura do Projeto

```bash
/ (raiz)
├─ /server            # Código do backend (este repositório)
│   ├─ index.js       # Entrada do servidor Express + Socket.IO
│   ├─ .env           # Variáveis de ambiente (não versionado)
│   ├─ package.json
│   └─ /node_modules
├─ /client            # Código do frontend (repositório separado)
│   └─ /dist          # Build estático servido pelo backend
└─ README.md          # Documentação do projeto (este arquivo)
```

---

## 🚀 Funcionalidades Principais

* **Chat em tempo real** usando Socket.IO
* **Chatbot** baseado em regras (patterns + string-similarity) para:

  * Próxima partida da FURIA
  * Escalação do time
  * Estatísticas recentes (K/D, win rate)
  * Histórico de confrontos
  * Mensagens de saudação
* **Integração** com API PandaScore para dados de CS\:GO
* **Serviço único**: backend Express serve também o frontend estático

---

## ⚙️ Pré-requisitos

* Node.js v14+
* npm ou yarn
* Conta e token da API PandaScore ([https://developers.pandascore.co](https://developers.pandascore.co))

---

## 💻 Instalação e Configuração

1. Clone este repositório:

   ```bash
   git clone https://github.com/Ajax267/furia-chat.git
   cd furia-chat/server
   ```
2. Instale dependências:

   ```bash
   npm install
   # ou
   yarn install
   ```
3. Copie o arquivo de ambiente e preencha:

   ```bash
   cp .env.example .env
   ```

   No `.env`, defina:

   ```dotenv
   PANDASCORE_TOKEN=seu_token_aqui
   PORT=3001       # porta em que o servidor irá rodar (opcional)
   NODE_ENV=development
   ```
4. Certifique-se de que a pasta `../client/dist` contém o build do frontend. Se não, clone e construa seu client:

   ```bash
   cd ../client
   npm install
   npm run build    # gera dist/
   cd ../server
   ```

---

## ▶️ Executando o Servidor

```bash
npm start
# ou
node index.js
```

* O servidor Express ficará disponível em `http://localhost:3001`.
* O frontend será servido em `/`.
* Conexões Socket.IO em `ws://localhost:3001`.

---

## 🔌 WebSocket / Socket.IO

### Eventos (cliente → servidor)

| Evento        | Dados                 | Descrição                         |
| ------------- | --------------------- | --------------------------------- |
| `mensagem`    | `{ texto, username }` | Envia mensagem de chat para todos |
| `reaction`    | `{ emoji, username }` | Envia reação (emoji) para todos   |
| `userMessage` | `{ text }`            | Pergunta ao chatbot               |

### Eventos (servidor → cliente)

| Evento       | Dados                      | Descrição                              |
| ------------ | -------------------------- | -------------------------------------- |
| `mensagem`   | `{ texto, username, ... }` | Mensagem de chat recebida              |
| `reaction`   | `{ emoji, username, ... }` | Reação recebida                        |
| `botMessage` | `{ text }`                 | Resposta do chatbot                    |
| `nextMatch`  | `{ start, channel }`       | Atualização automática do próximo jogo |
| `gameStatus` | `{ round, score, ... }`    | Estado de jogo (se implementado)       |

---

## 🤖 Fluxo do Chatbot

1. **Normalize**: Remove acentuação, pontuação e passa para minúsculas.
2. **Pattern matching**: Lista de regex patterns para intents (`/próximo jogo/`, `/escalação/`, etc.).
3. **Fallback fuzzy**: Usa `string-similarity` para selecionar a intent mais próxima.
4. **Ações**: Cada intent chama uma função que:

   * Busca dados na API PandaScore (`/teams`, `/matches`, `/players`).
   * Formata e retorna texto para o usuário.



---

## 📄 Licença

MIT © [Ajax267](https://github.com/Ajax267)
