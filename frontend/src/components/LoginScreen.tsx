import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginScreen() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-chat-bg">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300a884' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-sm w-full">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-teal opacity-20 blur-xl scale-110" />
            <img
              src="/assets/generated/chatflow-logo.dim_256x256.png"
              alt="ChatFlow Logo"
              className="relative w-24 h-24 rounded-3xl shadow-msg"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">ChatFlow</h1>
            <p className="text-muted-foreground text-sm mt-1">Simple. Secure. Fast.</p>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-3 w-full">
          {[
            { icon: MessageCircle, text: 'Real-time messaging & group chats' },
            { icon: Shield, text: 'Secured by Internet Identity' },
            { icon: Zap, text: 'Built on the Internet Computer' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-chat-header border border-chat-border"
            >
              <Icon className="w-4 h-4 text-teal shrink-0" />
              <span className="text-sm text-foreground/80">{text}</span>
            </div>
          ))}
        </div>

        {/* Login button */}
        <Button
          onClick={handleAuth}
          disabled={isLoggingIn}
          className="w-full h-12 text-base font-semibold rounded-xl bg-teal hover:bg-teal-dark text-white border-0 transition-all duration-200 shadow-msg"
        >
          {isLoggingIn ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting…
            </span>
          ) : (
            'Get Started'
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our terms of service
        </p>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
        Built with{' '}
        <span className="text-teal">♥</span>{' '}
        using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'chatflow-app')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
