// api/custom/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification',
    text: `Please click the following link to verify your email: ${verificationUrl}`,
  };

  await transporter.sendMail(mailOptions);
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const client = await clientPromise;
  const db = client.db("subData");

  const hashedToken = crypto.randomBytes(32).toString('hex'); // Generate a random token
  const hashedTokenForDB = crypto.createHash('sha256').update(hashedToken).digest('hex');

  try {
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists.' }, { status: 400 });
    }

    await db.collection('users').insertOne({
      email,
      password, // Hash this password before storing it
      emailVerified: false,
    });

    await db.collection('verificationTokens').insertOne({
      token: hashedTokenForDB,
      email,
      expires: new Date(Date.now() + 3600000), // 1 hour expiry
    });

    await sendVerificationEmail(email, hashedToken);

    return NextResponse.json({ message: 'Signup successful. Please check your email to verify your account.' });
  } catch (error) {
    console.error('Error during signup:', error);
    return NextResponse.json({ message: 'Signup failed. Please try again.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const email = url.searchParams.get('email');

  if (!token || !email) {
    return NextResponse.json({ message: 'Invalid request parameters.' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("subData");
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const record = await db.collection('verificationTokens').findOne({
      token: hashedToken,
      email,
    });

    let message;
    let verified = false;

    if (record && record.expires > new Date()) {
      await db.collection('users').updateOne(
        { email },
        { $set: { emailVerified: true } }
      );

      await db.collection('verificationTokens').deleteOne({
        token: hashedToken,
        email,
      });

      verified = true;
      message = 'Your email has been verified!';
    } 

    return NextResponse.json({ message, verified });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({ message: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
