import { SignIn } from '@clerk/nextjs';
import { TrendingUp } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.3) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      
      <div className="relative w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Welcome to FinanceMate
          </h1>
          <p className="text-slate-300 mt-3 text-lg">Your intelligent financial companion</p>
        </div>


        {/* Sign In Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 ">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Sign in to FinanceMate</h2>
            <p className="text-slate-400">Welcome back! Please sign in to continue</p>
          </div>
          
          <div className='-ml-[10px]'>
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-white transition-all duration-200 hover:scale-[1.02]",
                socialButtonsBlockButtonText: "text-slate-200",
                dividerLine: "bg-slate-600/50",
                dividerText: "text-slate-400",
                formFieldInput: "bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20",
                formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none transition-all duration-200 hover:scale-[1.02]",
                footer: "hidden",
                footerActionText: "hidden",
                footerActionLink: "hidden",
                identityPreviewText: "text-slate-300",
                formFieldLabel: "text-slate-300",
                formResendCodeLink: "text-blue-400 hover:text-blue-300",
                formFieldSuccessText: "text-green-400",
                formFieldErrorText: "text-red-400",
                alertText: "text-slate-300",
                formHeaderTitle: "text-white",
                formHeaderSubtitle: "text-slate-400",
                cardFooter: "hidden",
                footerText: "hidden",
                footerAction: "hidden"
              }
            }}
            forceRedirectUrl="/dashboard"
            signUpUrl={undefined}
            redirectUrl="/dashboard"
          />
        </div>
      </div>
      </div>
    </div>
  );
}
