// src/app/register/page.tsx

import RegistrationForm from '@/components/RegistrationForm';

export const metadata = {
  title: 'Registo - Nexus Ecclesia',
  description: 'Registe a sua organização e comece a usar a plataforma de gestão.',
};

export default function RegisterPage() {
  return (
    <main>
      <RegistrationForm />
    </main>
  );
}