import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, LogIn, UserPlus, MailCheck } from "lucide-react";
import odbLogo from "@/assets/odb-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Erro ao entrar: " + error.message);
      setSubmitting(false);
    } else {
      toast.success("Login realizado!");
      navigate("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Informe seu nome."); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome }, emailRedirectTo: window.location.origin },
    });
    if (error) { toast.error("Erro ao cadastrar: " + error.message); }
    else { setSignupDone(true); }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (signupDone) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
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
    <div className="flex min-h-screen items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)" }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <motion.div
            className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl overflow-hidden border border-primary/20"
            style={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.3)" }}
            animate={{ boxShadow: ["0 0 30px hsl(var(--primary) / 0.2)", "0 0 50px hsl(var(--primary) / 0.4)", "0 0 30px hsl(var(--primary) / 0.2)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <img src={odbLogo} alt="ODB" className="h-20 w-20 object-contain" />
          </motion.div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Oficina da Borracha</h1>
          <p className="mt-1.5 text-xs text-muted-foreground font-medium">Sistema de Gestão Inteligente</p>
        </div>

        {/* Form */}
        <form
          onSubmit={isSignup ? handleSignup : handleLogin}
          className="rounded-2xl p-6 space-y-5 border border-border/15 bg-card/80 backdrop-blur-xl"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
        >
          {isSignup && (
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs text-muted-foreground font-medium">Nome</Label>
              <Input id="nome" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required className="bg-background/50 border-border/30 h-11 text-base focus:border-primary/50 focus:ring-primary/20" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-muted-foreground font-medium">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/50 border-border/30 h-11 text-base focus:border-primary/50 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs text-muted-foreground font-medium">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-background/50 border-border/30 h-11 text-base focus:border-primary/50 focus:ring-primary/20" />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm gap-2 rounded-xl"
            style={{ boxShadow: "0 0 24px hsl(var(--primary) / 0.3)" }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignup ? <><UserPlus className="h-4 w-4" /> Criar Conta</> : <><LogIn className="h-4 w-4" /> Entrar</>}
          </Button>
          <button type="button" onClick={() => setIsSignup(!isSignup)} className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors pt-1">
            {isSignup ? "Já tem conta? Entrar" : "Não tem conta? Cadastre-se"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
