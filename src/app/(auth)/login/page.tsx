import Card from '@/components/ui/Card';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = { title: 'Sign in — TaskCo' };

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-heading">TaskCo</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your account</p>
        </div>
        <Card>
          <LoginForm />
        </Card>
      </div>
    </div>
  );
}
