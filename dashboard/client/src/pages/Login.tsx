import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await loginMutation.mutateAsync({ email, password });
        if (result.success) {
          toast.success("Login realizado com sucesso!");
          setLocation("/");
        }
      } else {
        const result = await registerMutation.mutateAsync({ email, password, name });
        if (result.success) {
          toast.success("Cadastro realizado! Aguarde aprovação do admin.");
          setIsLogin(true);
          setPassword("");
          setName("");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 p-4">
      <Card className="w-full max-w-md border-purple-500/30 bg-slate-900/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">AF</span>
            </div>
          </div>
          <CardTitle className="text-center text-2xl text-white">
            {isLogin ? "AfiliFlow Dashboard" : "Criar Conta"}
          </CardTitle>
          <CardDescription className="text-center text-purple-300">
            {isLogin
              ? "Acesse seu painel de controle"
              : "Solicite acesso ao dashboard"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome
                </label>
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white font-semibold"
            >
              {isLoading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isLogin ? "Não tem conta?" : "Já tem conta?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPassword("");
                  setName("");
                }}
                className="ml-2 text-purple-400 hover:text-purple-300 font-semibold transition"
              >
                {isLogin ? "Cadastre-se" : "Faça login"}
              </button>
            </p>
          </div>

          {!isLogin && (
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded text-sm text-blue-200">
              📧 Após cadastro, aguarde a aprovação do administrador para acessar o dashboard.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
