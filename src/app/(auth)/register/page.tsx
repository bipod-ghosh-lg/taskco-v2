import Card from '@/components/ui/Card';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata = { title: 'Create account — TaskCo' };

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">TaskCo</h1>
          <p className="mt-1 text-sm text-gray-500">Create your account</p>
        </div>
        <Card>
          <RegisterForm />
        </Card>
      </div>
    </div>
  );
}
