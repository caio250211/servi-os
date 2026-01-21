# InsectControl Tupy — Gestão (Firebase)

## Objetivo
Sistema web para **gestão de clientes e serviços** da InsectControl Tupy, reutilizando os dados já cadastrados no **Firebase/Firestore** e fazendo **login via Gmail**.

## Stack (atual)
- Frontend: React + Tailwind + shadcn/ui
- Dados e login: **Firebase Auth (Google)** + **Firestore**
- Backend (FastAPI + MongoDB): permanece no projeto, mas **não é mais necessário para o uso principal** (MVP atual está direto no Firebase).

## Como funciona
- O usuário entra com Google.
- O sistema filtra documentos pelo campo **`usuario`** igual ao e-mail do Google logado.
- Collections:
  - **`servicos`** (confirmada por você)
  - **`clientes`** (opcional: se não existir, a tela de clientes vai aparecer vazia até você criar ou ajustar o nome)

## Modelo de dados (Firestore)
### servicos
Campos esperados (com base no print que você enviou):
- `cliente` (string)
- `contato` (string)
- `criado` (string ISO)
- `data` (string `YYYY-MM-DD`)
- `local` (string)
- `status` (ex: `Pendente` / `Pago`)
- `tipo` (string)
- `usuario` (string email)
- `valor` (string, ex: `450.00`)

### clientes (opcional)
- `nome`, `telefone`, `endereco`, `cidade`, `bairro`, `email`, `usuario`

## Telas
- Login (Google)
- Dashboard (resumo do mês a partir dos serviços do Firestore)
- Clientes (CRUD no Firestore, se a collection existir)
- Serviços (CRUD no Firestore)
- Agenda (próximos 14 dias a partir de `servicos`)

## Observações importantes (Firebase)
1) **Authorized domains**: no Firebase Console → Authentication → Settings → Authorized domains, adicione o domínio do seu site (exibido na tela de login).
2) **Regras do Firestore**: para segurança, o ideal é permitir leitura/escrita somente do que tiver `usuario == request.auth.token.email`.
