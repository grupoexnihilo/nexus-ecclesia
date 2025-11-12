// src/components/RegistrationForm.tsx

'use client'; 

import React, { useState } from 'react';

// O nosso endpoint que o Vercel está a fazer o deploy
const API_ENDPOINT = '/api/register'; 

interface FormState {
  organizationName: string;
  userName: string;
  userEmail: string;
  userPassword: string;
}

export default function RegistrationForm() {
  const [form, setForm] = useState<FormState>({
    organizationName: '',
    userName: '',
    userEmail: '',
    userPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form), 
      });

      const result = await response.json();

      if (!response.ok || result.status === 'error') {
        const errorMsg = result.message || 'Falha no registo devido a um erro desconhecido.';
        throw new Error(errorMsg);
      }

      setIsSuccess(true);
      setMessage('✅ Registo concluído! Bem-vindo ao Nexus Ecclesia.');

    } catch (error: any) {
      setIsSuccess(false);
      setMessage(`❌ Erro: ${error.message || 'Não foi possível ligar ao servidor.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-lg">
        <h2 className="text-2xl font-bold text-center text-blue-900">
          Registo Nexus Ecclesia
        </h2>
        
        {message && (
          <div className={`p-3 rounded text-sm ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome da Organização (Igreja)</label>
            <input
              type="text"
              name="organizationName"
              value={form.organizationName}
              onChange={handleChange}
              required
              disabled={loading}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Seu Nome (Administrador)</label>
            <input
              type="text"
              name="userName"
              value={form.userName}
              onChange={handleChange}
              required
              disabled={loading}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email (Será o Login)</label>
            <input
              type="email"
              name="userEmail"
              value={form.userEmail}
              onChange={handleChange}
              required
              disabled={loading}
              className="mt-1 w-full p-2 border border-gray-9git add git add .00 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha (Mín. 6 caracteres)</label>
            <input
              type="password"
              name="userPassword"
              value={form.userPassword}
              onChange={handleChange}
              required
              disabled={loading}
              className="mt-1 w-full p-2 border border-gray-900 rounded-md"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'A registrar...' : 'Registrar Organização'}
          </button>
        </form>
      </div>
    </div>
  );
}