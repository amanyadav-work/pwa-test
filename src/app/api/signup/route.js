import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongoose';
import User from '@/models/User'; // fix import (no destructuring)
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendErrorResponse } from '@/lib/sendErrorResponse';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { email, password, name, age, profile } = await req.json();

    if (!email || !password || !name || !age || !profile) {
      return sendErrorResponse({ code: 'missing_fields', message: 'All fields are required', status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendErrorResponse({ code: 'user_exists', message: 'User already exists', status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      age,
      profile,
    });

    const token = jwt.sign(
      { userId: newUser._id.toString(), email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userData } = newUser.toObject();

    const response = NextResponse.json(
      { message: 'Signup successful', user: userData },
      { status: 201 }
    );

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return sendErrorResponse({ code: 'server_error', message: 'Server error', status: 500 });
  }
}
