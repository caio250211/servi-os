# InsectControl Tupy — Gestão de Clientes e Serviços (MVP)

## Objetivo
Criar um sistema web simples (tipo CRM + Ordem de Serviço) para a InsectControl Tupy anotar **clientes** e **serviços**, com **login** (usuário/senha). Foco em uso no dia a dia (celular e PC).

## Stack
- Frontend: React + Tailwind + componentes shadcn/ui
- Backend: FastAPI
- Banco: MongoDB (Motor)

## Arquitetura
- Frontend consome API via `process.env.REACT_APP_BACKEND_URL` e prefixo `/api`.
- Backend expõe rotas em `/api/*`.
- Autenticação: **JWT** (login por usuário/senha)
  - Access token curto (ex: 24h)
  - Enviado no header `Authorization: Bearer <token>`

## Módulos (MVP)
1) **Login**
2) **Dashboard**
   - Cards: Clientes cadastrados, Serviços no mês, Pendentes, Receita no mês
   - Lista rápida: próximos serviços (opcional, por data)
3) **Clientes**
   - CRUD (criar, editar, excluir, listar)
   - Busca por nome/telefone
4) **Serviços**
   - CRUD
   - Campos: data, cliente, tipo de praga/serviço, valor, status (PENDENTE/CONCLUIDO)
   - Filtros: por status e por período (mês atual)
5) **Agenda (visão simples)**
   - Lista por data (hoje/semana/mês) — sem calendário complexo no MVP

## Esquema de Banco (MongoDB)
### users
- _id (mongo)
- id (uuid string)
- name
- username (único)
- password_hash
- created_at

### clients
- id (uuid)
- name
- phone
- address
- city
- neighborhood
- email (opcional)
- created_at
- updated_at

### services
- id (uuid)
- client_id
- date (ISO string)
- service_type (texto)
- value (number)
- status ("PENDENTE" | "CONCLUIDO")
- notes (opcional — reservado)
- created_at
- updated_at

## APIs (backend)
### Auth
- POST `/api/auth/register` (criar primeiro usuário admin)
- POST `/api/auth/login`
- GET `/api/auth/me`

### Clients
- GET `/api/clients` (query: `q` para busca)
- POST `/api/clients`
- GET `/api/clients/{id}`
- PUT `/api/clients/{id}`
- DELETE `/api/clients/{id}`

### Services
- GET `/api/services` (query: `status`, `from`, `to`, `client_id`)
- POST `/api/services`
- GET `/api/services/{id}`
- PUT `/api/services/{id}`
- DELETE `/api/services/{id}`

### Dashboard
- GET `/api/dashboard/summary` (cards do mês)

## Fluxos de Frontend
- Tela de Login
- Layout com sidebar/topbar
  - Dashboard
  - Clientes
  - Serviços
  - Agenda
- Modais para criar/editar (Clientes e Serviços)
- Tabelas com ações (editar/excluir)
- Toasts de sucesso/erro

## UI/Identidade
- Tema escuro elegante com detalhes em vermelho (baseado no logo)
- Botões modernos (pill / sharp)
- Sem centralização global de texto

## Testes
- Backend: testar login, CRUD de clientes e serviços, dashboard summary
- Frontend: fluxo completo
  - Registrar admin (uma vez), logar
  - Criar cliente
  - Criar serviço para cliente
  - Ver dashboard atualizando
  - Filtrar serviços por status
