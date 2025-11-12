// /src/app/api/register/route.ts (Vercel Serverless Function)

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as admin from 'firebase-admin';

// --- Variáveis de Configuração (Lidas dos Secrets do Vercel) ---
// O Firebase Admin precisa de ser inicializado com as chaves que adicionámos ao Vercel.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // A chave privada precisa de ser convertida de volta para o formato JSON/chave
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Inicializa o Firebase Admin SDK UMA VEZ
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// Inicializa a conexão ao Neon DB (Pool)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Endpoint de Registo: Cria a Organização e o Primeiro Usuário Administrador
 */
export async function POST(request: Request) {
  let client;
  let firebaseAuthUid;

  try {
    const data = await request.json();
    const { organizationName, userName, userEmail, userPassword } = data;

    // Validação de segurança básica
    if (!organizationName || !userName || !userEmail || !userPassword || userPassword.length < 6) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Dados incompletos ou senha muito curta.' 
      }, { status: 400 });
    }

    // 1. Criação do Usuário no Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: userEmail,
      password: userPassword,
      displayName: userName,
    });
    firebaseAuthUid = userRecord.uid;

    client = await pool.connect();
    
    // 2. Início da Transação no Neon DB (ACID Compliance)
    await client.query('BEGIN');

    // 2.1. Criar a Organização
    const orgSlug = organizationName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').slice(0, 90);
    const orgResult = await client.query(
      `INSERT INTO organizations (name, slug, contact_email, subscription_plan, is_active) 
       VALUES ($1, $2, $3, 'premium', true) RETURNING organization_id`,
      [organizationName, orgSlug, userEmail]
    );
    const organizationId = orgResult.rows[0].organization_id;

    // 2.2. Criar o Usuário (Admin)
    await client.query(
      `INSERT INTO users (user_id, organization_id, display_name, email, role, is_active) 
       VALUES ($1, $2, $3, $4, 'admin', true)`,
      [firebaseAuthUid, organizationId, userName, userEmail]
    );

    await client.query('COMMIT'); // Se tudo correu bem, salvamos

    return NextResponse.json({ 
      status: 'success', 
      message: 'Organização e usuário criados.', 
      userId: firebaseAuthUid, 
      organizationId: organizationId 
    }, { status: 201 });

  } catch (error: any) {
    // 3. Tratamento de Falhas
    if (client) {
      await client.query('ROLLBACK'); // Desfaz as mudanças no DB
      client.release();
    }
    
    // Se o erro foi no Firebase Auth (ex: email já existe), apagamos o usuário recém-criado
    if (firebaseAuthUid) {
        await admin.auth().deleteUser(firebaseAuthUid);
    }

    const message = error.code === 'auth/email-already-exists' ? 'Este e-mail já está em uso.' : 'Erro interno no servidor.';
    
    return NextResponse.json({ status: 'error', message: message }, { status: 500 });
  } finally {
    if (client) {
        client.release();
    }
  }
}