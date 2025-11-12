// src/app/api/login-data/route.ts

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as admin from 'firebase-admin';

// --- CONFIGURAÇÃO DA INFRAESTRUTURA (Reutilizada do Registo) ---
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// -----------------------------------------------------------------

/**
 * Endpoint de Login de Dados: Verifica o Token do Firebase e retorna o Role/OrgID do Neon DB.
 */
export async function POST(request: Request) {
  let client;
  let decodedToken;

  try {
    // 1. EXTRAIR O TOKEN DO CABEÇALHO (Header)
    const authorizationHeader = request.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new Error('Token de autenticação ausente ou mal formatado.');
    }
    const idToken = authorizationHeader.split('Bearer ')[1];

    // 2. SEGURANÇA: VERIFICAR O TOKEN (Comunicação com o Porteiro/Firebase Auth)
    // Se o token for inválido, esta linha lança um erro automaticamente.
    decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    client = await pool.connect();
    
    // 3. BUSCA DE DADOS: Obter o role e organization_id do Neon DB
    const userQuery = `
      SELECT user_id, display_name, role, organization_id
      FROM users
      WHERE user_id = $1 AND is_active = true
    `;
    const userResult = await client.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('Usuário não encontrado ou inativo no sistema.');
    }

    const userData = userResult.rows[0];

    // 4. RESPOSTA (O Gerente devolve o crachá completo)
    return NextResponse.json({
      status: 'success',
      userId: userData.user_id,
      displayName: userData.display_name,
      role: userData.role,
      organizationId: userData.organization_id,
      message: 'Autenticação bem-sucedida.',
    });

  } catch (error: any) {
    console.error("ERRO NO ENDPOINT DE LOGIN:", error.message);
    
    let message = 'Falha na autenticação. Credenciais inválidas.';
    
    // Erros comuns de token
    if (error.code === 'auth/id-token-expired') {
      message = 'Sessão expirada. Por favor, faça login novamente.';
    }

    return NextResponse.json({ status: 'error', message: message }, { status: 401 });
  } finally {
    if (client) {
        client.release();
    }
  }
}