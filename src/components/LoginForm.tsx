// src/components/LoginForm.tsx (v2: Corrigido e Verificado)

'use client'; // Indica que este componente corre no navegador (Client Component)

import React, { useState } from 'react';

// O endpoint de Login que irá buscar os dados do usuário
const API_ENDPOINT_DATA = '/api/login-data'; 

export default function LoginForm() {
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);
    setLoading(true);

    let firebaseIdToken = null;

    try {
      // 1. --- PASSO DE SEGURANÇA: AUTENTICAÇÃO NO FIREBASE (CLIENTE) ---
      // IMPORTANTE: Aqui, no código REAL, você usará o SDK do Firebase Client 
      // para validar o Email/Senha. Ele fará o trabalho de autenticação.
      
      // *** SIMULAÇÃO DE FLUXO DE SEGURANÇA (Para continuarmos a engenharia): ***
      // Se o login fosse bem-sucedido, receberíamos o token:
      if (userEmail === 'admin@teste.com' && userPassword === '123456') {
         firebaseIdToken = 'simulated-jwt-token-for-admin-test'; 
      } else {
         throw new Error('Email ou senha incorretos.');
      }
      // ----------------------------------------------------------------------------------
      
      // 2. --- PASSO DE DADOS: ENVIAR O TOKEN PARA A NOSSA API VERCEL ---
      // A nossa API Serverless usa o token para verificar o usuário e buscar o seu papel no Neon DB.
      const response = await fetch(API_ENDPOINT_DATA, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseIdToken}`, // Enviamos o token, não a senha!
        },
        body: JSON.stringify({ userEmail }), // Enviamos o email apenas para busca
      });

      const result = await response.json();

      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Falha ao buscar dados do usuário.');
      }

      // Sucesso: Recebemos o role e organizationId do nosso DB
      console.log('Dados do Usuário:', result);
      setIsSuccess(true);
      setMessage(`✅ Bem-vindo, ${result.role || 'usuário'}! Redirecionando...`);
      
    } catch (error: any) {
      setIsSuccess(false);
      setMessage(`❌ Erro: ${error.message || 'Não foi possível completar o login.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded shadow-lg">
        <h2 className="text-2xl font-bold text-center text-blue-900">
          Login no Nexus Ecclesia
        </h2>
        
        {/* Exibe mensagens de sucesso ou erro */}
        {message && (
          <div className={`p-3 rounded text-sm ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Campo: Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="userEmail"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
              disabled={loading}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Campo: Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              name="userPassword"
              value={userPassword}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'A autenticar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}