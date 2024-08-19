// src/app/verify-email/VerifyEmailClient.tsx
'use client'; // This directive ensures the component is rendered on the client side

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignupForm from './email';

interface VerifyEmailClientProps {
  token?: string;
  email?: string;
}

export default function VerifyEmailClient({ token, email }: VerifyEmailClientProps) {
  const [message, setMessage] = useState('Verifying your email...');
  const [verified, setVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !email) {
        setMessage('Invalid verification link.');
        return;
      }

      try {
        const response = await fetch(`/api/custom/signup?token=${token}&email=${encodeURIComponent(email)}`);
        const data = await response.json();
        setMessage(data.message);
        setVerified(data.verified);

        if (data.verified) {
          // Redirect to the dashboard after successful verification
          router.push('/dashboard');
        }
      } catch (error) {
        setMessage('Verification failed. Please try again.');
      }
    };

    verifyEmail();
  }, [token, email, router]);

  return (
    <div>
      <h1>Email Verification</h1>
      <p>{message}</p>
      {!verified && (
        <>
          <p>Verification failed. The link may have expired or is invalid.</p>
          <SignupForm />
        </>
      )}
    </div>
  );
}
