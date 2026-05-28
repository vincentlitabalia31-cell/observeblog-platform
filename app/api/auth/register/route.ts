import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';
import { isConfiguredAdminEmail, persistEffectiveRole } from '../../../../lib/roles';
import { logServerError } from '../../../../lib/logging';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: isConfiguredAdminEmail(email) ? 'admin' : 'contributor'
    });
    await persistEffectiveRole(user._id.toString(), user.email);

    return NextResponse.json({
      message: 'Registration successful.',
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    logServerError('Registration error:', error);
    const message =
      typeof error === 'object' && error && 'message' in error && typeof (error as any).message === 'string'
        ? (error as any).message
        : 'Unable to create account.';

    const isDuplicateKey =
      typeof error === 'object' && error && 'code' in error && (error as any).code === 11000;

    if (isDuplicateKey) {
      return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 });
    }

    return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'Unable to create account.' : message }, { status: 500 });
  }
}
