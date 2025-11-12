// src/app/page.tsx

import { redirect } from 'next/navigation';

export default function Home() {
  // Redireciona o usuário da rota principal ('/') para a rota de Login.
  // Futuramente, adicionaremos a lógica de checagem de sessão aqui.
  redirect('/login');
}