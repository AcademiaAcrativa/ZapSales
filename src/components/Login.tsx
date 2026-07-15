import React, { useState } from "react";
import { Bot, Key, User, ShieldAlert, Sparkles } from "lucide-react";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate server-side authentication delay
    setTimeout(() => {
      if (username.trim() === "pedroluka" && password === "teste") {
        onLoginSuccess();
      } else {
        setError("Usuário ou senha incorretos. Tente novamente.");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
      id="login-page-container"
      style={{
        backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden relative">
        {/* Top brand accent strip */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500"></div>

        <div className="p-8 space-y-7">
          {/* Logo and Brand Heading */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/10">
              <Bot className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
                Acesse o ZapBot
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Insira suas credenciais exclusivas para gerenciar seu robô e vendas
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Conta de Usuário
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Senha
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Autenticando...
                </>
              ) : (
                <>
                  Entrar no Painel
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Area with security notice */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            Atendimento Ativo
          </span>
          <span>Acesso Protegido</span>
        </div>
      </div>
    </div>
  );
}
