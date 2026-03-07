import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, LogIn, UserPlus, MailCheck } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error("Erro ao entrar: " + error.message); }
    else { toast.success("Login realizado!"); navigate("/dashboard"); }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Informe seu nome."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome }, emailRedirectTo: window.location.origin },
    });
    if (error) { toast.error("Erro ao cadastrar: " + error.message); }
    else { setSignupDone(true); }
    setLoading(false);
  };

  if (signupDone) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={{ background: "#070B14" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20">
              <MailCheck className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">Verifique seu e-mail</h2>
            <p className="text-sm text-muted-foreground">
              Enviamos um link de confirmação para <span className="text-foreground font-medium">{email}</span>.
              Clique no link para ativar sua conta.
            </p>
          </div>
          <Button onClick={() => { setSignupDone(false); setIsSignup(false); }} variant="outline" className="w-full h-10 border-border/50 text-foreground text-sm">
            Voltar ao Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: "#070B14" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary" style={{ boxShadow: "0 0 30px rgba(245,158,11,0.3)" }}>
            <span className="text-xl font-extrabold text-primary-foreground">OB</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Oficina da Borracha</h1>
          <p className="mt-1 text-xs text-muted-foreground">Sistema de Gestão Financeira</p>
        </div>

        <form
          onSubmit={isSignup ? handleSignup : handleLogin}
          className="rounded-xl p-5 space-y-4 border"
          style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", borderColor: "rgba(245,158,11,0.1)" }}
        >
          {isSignup && (
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs text-muted-foreground">Nome</Label>
              <Input id="nome" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required className="bg-background/30 border-border/50 h-10 text-sm" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-muted-foreground">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/30 border-border/50 h-10 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs text-muted-foreground">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-background/30 border-border/50 h-10 text-sm" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm gap-2" style={{ boxShadow: "0 0 20px rgba(245,158,11,0.25)" }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignup ? <><UserPlus className="h-4 w-4" /> Criar Conta</> : <><LogIn className="h-4 w-4" /> Entrar</>}
          </Button>
          <button type="button" onClick={() => setIsSignup(!isSignup)} className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors">
            {isSignup ? "Já tem conta? Entrar" : "Não tem conta? Cadastre-se"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
