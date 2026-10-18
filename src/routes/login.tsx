import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Ensinamos ao TypeScript que esta rota aceita um parâmetro "?redirect="
export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: search?.redirect as string | undefined,
    };
  },
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  // Captura a rota para a qual devemos redirecionar após o login
  const { redirect } = Route.useSearch();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabase) {
      toast.error("O banco de dados não está conectado.");
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Conta criada! Verifique o seu email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login efetuado com sucesso.");
        
        // Se havia uma rota pendente (ex: /relatorios), devolve o utilizador para lá // Navegação suave pelo React Router
        if (redirect && redirect.startsWith("/")) {
          navigate({ to: redirect as any });
        } else {
          navigate({ to: "/" });
        }
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl font-bold">
            {isSignUp ? "Criar Conta" : "Acesso Restrito"}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Registe-se para salvar os seus laudos de viabilidade." 
              : "Entre para aceder às suas simulações do LeilãoSeguro."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nome@exemplo.com" 
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Palavra-passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isSignUp ? "Registar" : "Entrar")}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isSignUp ? "Já tem uma conta? " : "Ainda não tem conta? "}
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold text-primary hover:underline"
            >
              {isSignUp ? "Faça login" : "Crie uma agora"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}