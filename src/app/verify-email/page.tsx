// src/app/verify-email/page.tsx
import VerifyEmailClient from './VerifyEmailClient';

interface VerifyEmailProps {
  searchParams: { token?: string; email?: string };
}

export default function VerifyEmailPage({ searchParams }: VerifyEmailProps) {
  const { token, email } = searchParams;

  return (
    <div>
      <VerifyEmailClient token={token} email={email} />
    </div>
  );
}
