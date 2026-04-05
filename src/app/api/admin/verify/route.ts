import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

function getAdminFirestore() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

export async function POST(request: Request) {
  try {
    const { password, eventId } = await request.json();

    if (typeof password !== 'string' || typeof eventId !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Password and eventId are required' },
        { status: 400 }
      );
    }

    // Validate eventId format (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(eventId)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    // In mock mode, accept any password (server has no access to client-side mock store)
    if (process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE === 'true') {
      return NextResponse.json({ valid: true });
    }

    const db = getAdminFirestore();
    const eventDoc = await db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      return NextResponse.json(
        { valid: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = eventDoc.data();
    const storedHash = eventData?.adminPasswordHash;

    if (!storedHash) {
      return NextResponse.json(
        { valid: false, error: 'No admin password configured for this event' },
        { status: 500 }
      );
    }

    // Simple comparison — the password is stored as a hash
    // For production, use bcrypt or similar
    const valid = password === storedHash;
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
