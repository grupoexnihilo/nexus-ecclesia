// src/components/LoginForm.tsx (v6: Estruturalmente Correto e Funcional)

'use client'; 

import React, { useState } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, User, Auth } from 'firebase/auth';

// --- CONFIGURAÇÃO DO FIREBASE CLIENT ---
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa a instância do App e Auth de forma a ser segura contra o SSR do Next.js
let app: FirebaseApp;
let auth: Auth;

try {
    // 1. Tenta obter a instância existente ou inicializa-a.
    // Esta lógica é segura para o ambiente de compilação Next.js/SSR.
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
} catch (error) {
    // Em caso de falha crítica, tratamos o erro, mas garantimos que as variáveis existam (para evitar erros de tipagem).
    console.error("Firebase Initialization Error:", error);
    // Cria objetos mock para evitar crashs de runtime no navegador.
    app = null as any; 
    auth = null as any; 
}
// ---------------------------------------------------

const API_ENDPOINT_DATA = '/api/login-data'; 

export default function LoginForm() {
    // Estado do formulário e UI (o mesmo)
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

        // Se a inicialização falhou (chaves .env ausentes), paramos aqui.
        if (!auth) {
            setMessage("❌ Erro de Configuração: O Firebase não foi inicializado corretamente.");
            setLoading(false);
            return;
        }

        try {
            // 1. AUTENTICAÇÃO REAL NO FIREBASE
            const userCredential = await signInWithEmailAndPassword(
                auth,
                userEmail,
                userPassword
            );
            const user: User = userCredential.user;
            
            // 2. OBTENÇÃO DO TOKEN REAL
            const firebaseIdToken = await user.getIdToken(); 
            
            // 3. ENVIAR O TOKEN REAL PARA A NOSSA API VERCEL
            const response = await fetch(API_ENDPOINT_DATA, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${firebaseIdToken}`, 
                },
                body: JSON.stringify({ userEmail }),
            });

            const result = await response.json();

            if (!response.ok || result.status === 'error') {
                throw new Error(result.message || 'Falha ao buscar dados do usuário.');
            }

            // Sucesso
            console.log('Dados do Usuário:', result);
            setIsSuccess(true);
            setMessage(`✅ Login efetuado! Bem-vindo, ${result.role || 'usuário'}! Redirecionando...`);
            
        } catch (error: any) {
            // Tratamento de Erros
            let errorMessage = 'Falha na autenticação. Verifique email e senha.';
            
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Senha incorreta.';
            } else if (error.code === 'auth/user-not-found') {
                 errorMessage = 'Usuário não encontrado.';
            } else if (error.message) {
                 errorMessage = error.message; 
            }

            setIsSuccess(false);
            setMessage(`❌ Erro: ${errorMessage}`);
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
            
            {message && (
              <div className={`p-3 rounded text-sm ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-black">Email</label>
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

              <div>
                <label className="block text-sm font-medium text-black">Senha</label>
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