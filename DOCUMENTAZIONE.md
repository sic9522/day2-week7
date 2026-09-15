# Mini WhatsApp — Documentazione tecnica (Consegna D2)

Mini clone di WhatsApp: ogni utente registrato vede l'elenco delle persone con cui può parlare e apre conversazioni private uno a uno. I messaggi sono recapitati in tempo reale solo al destinatario tramite le destinazioni utente del broker WebSocket, mai in broadcast.

## Tecnologie usate

### Backend
- **Java 25**, **Spring Boot 4.1.1**
- **Spring Data JPA** (Hibernate) su **PostgreSQL**
- **Spring Security** — filtro JWT stateless (nessuna sessione server-side), password con **BCrypt**
- **Spring WebSocket + STOMP** (endpoint SockJS) — broker in-memory su `/queue`, destinazioni per-utente (`/user/**`)
- **JWT**: `io.jsonwebtoken` (jjwt) 0.13.0
- **Lombok** (getter/setter/costruttori)
- **Maven**

### Frontend
- **React 19** + **Vite**
- **React Router 7**
- **react-bootstrap** / **Bootstrap 5** (modali, form)
- **Axios** — client REST con interceptor che allega `Authorization: Bearer <token>`
- **@stomp/stompjs** + **sockjs-client** — client WebSocket/STOMP

## Entità (JPA)

### `User` (tabella `users`)
| Proprietà | Tipo | Note |
|---|---|---|
| `id` | `Long` | PK, auto-incrementale |
| `nome` | `String` | obbligatorio |
| `cognome` | `String` | obbligatorio |
| `username` | `String` | obbligatorio, univoco — identità usata ovunque (login, WebSocket, chat) |
| `email` | `String` | obbligatoria, univoca |
| `password` | `String` | hash BCrypt, mai esposta nelle risposte |
| `readReceipts` | `boolean` | preferenza utente: mostrare o meno le spunte blu di lettura (default `true`) |

### `Chat` (tabella `chats`)
| Proprietà | Tipo | Note |
|---|---|---|
| `id` | `Long` | PK |
| `user1` | `User` (FK) | primo partecipante |
| `user2` | `User` (FK) | secondo partecipante |

Rappresenta esclusivamente conversazioni **uno a uno**: è identificata dai due utenti che la compongono e non è mai visibile a chi non ne fa parte — ogni endpoint verifica l'appartenenza (`requireMembership`) prima di restituire dati. Non esistono chat di gruppo. `lastMessage`, `time`, `unread`, `online` mostrati nel client **non sono colonne salvate**: sono calcolati a runtime (ultimo messaggio, conteggio non letti, stato presenza) per evitare di dover tenere dati duplicati sincronizzati.

### `Message` (tabella `messages`)
| Proprietà | Tipo | Note |
|---|---|---|
| `id` | `Long` | PK, assegnato dal server alla persistenza |
| `chat` | `Chat` (FK) | conversazione di appartenenza |
| `sender` | `User` (FK) | mittente — dedotto **sempre** dal Principal della sessione WebSocket autenticata, mai dal payload inviato dal client |
| `text` | `String` | contenuto, max 2000 caratteri |
| `sentAt` | `LocalDateTime` | istante assegnato dal server al salvataggio |
| `read` | `boolean` | letto dal destinatario (default `false`) |

## Autenticazione

`POST /auth/register` e `POST /auth/login` restituiscono `{ token, user }`. Il token JWT (HS384, scadenza 24h) va allegato come header `Authorization: Bearer <token>` su ogni chiamata REST successiva (gestito automaticamente da `services/api.js`) e come **header nativo STOMP** sul frame `CONNECT` del WebSocket, dove un `ChannelInterceptor` lo valida e imposta il `Principal` della sessione — da quel momento la sessione socket è associata a uno username, usato sia per instradare i messaggi sia per la presenza online.

## Comunicazione client↔server

### REST (protetto da JWT)
- `GET /users` — utenti registrati (esclude se stessi)
- `GET/PATCH /users/me`, `/users/me/read-receipts`
- `GET/POST /chats`
- `GET /chats/{id}/messages?beforeId=&size=` — cronologia paginata
- `PATCH /chats/{id}/read`

### WebSocket (STOMP su SockJS, endpoint `/ws`)
Client → server:
- `/app/chat/{id}/send`
- `/app/chat/{id}/typing`

Server → client, **destinazioni per-utente** (`convertAndSendToUser`, mai un topic condiviso):
- `/user/queue/messages` — nuovo messaggio
- `/user/queue/typing` — notifica "sta scrivendo"
- `/user/queue/read` — le proprie ultime bolle sono state lette (spunte blu)

La presenza online/offline è tracciata in memoria (`PresenceService`) tramite gli eventi di connessione/disconnessione della sessione STOMP.
