import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome to FinanceMate</h1>
          <p className="text-slate-400 mt-2">Sign in to track your expenses</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              footer: "hidden"
            }
          }}
          forceRedirectUrl="/dashboard"
          signUpUrl={null}
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
