// src/app/login/page.tsx

import LoginForm from '@/components/LoginForm';

export const metadata = {
  title: 'Login - Nexus Ecclesia',
  description: 'Faça login na plataforma de gestão da sua igreja.',
};

export default function LoginPage() {
  return (
    <main>
      <LoginForm />
    </main>
  );
}