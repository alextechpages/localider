import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { Car, ExternalLink, LayoutDashboard, Loader2, LogOut, PenSquare } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel administrativo | Localider" },
      { name: "description", content: "Área restrita da Localider." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminGate,
});

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 text-ink-foreground">
      <div className="w-full max-w-sm">
        <img src={logo} alt="Localider" className="mx-auto mb-8 h-14 w-auto" />
        {children}
      </div>
    </div>
  );
}

function AdminGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const checkRole = async (uid: string) => {
    const { data } = await supabase.from("admin_roles").select("id").eq("user_id", uid).eq("role", "admin").maybeSingle();
    setIsAdmin(!!data);
  };
  useEffect(() => {
    setIsAdmin(null);
    if (userId) checkRole(userId);
  }, [userId]);

  if (session === undefined || (session && isAdmin === null)) {
    return <Centered><Loader2 className="mx-auto size-8 animate-spin text-accent" /></Centered>;
  }
  if (!session) return <LoginForm />;
  if (!isAdmin) return <NotAdmin email={session.user.email ?? ""} onClaimed={() => checkRole(session.user.id)} />;
  return <AdminShell email={session.user.email ?? ""} />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [canSetup, setCanSetup] = useState(false);

  useEffect(() => {
    supabase.rpc("admin_exists").then(({ data }) => setCanSetup(data === false));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (setupMode) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      if (!data.session) toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre aqui.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error("E-mail ou senha inválidos.");
  };

  return (
    <Centered>
      <form onSubmit={submit} className="rounded-2xl border border-ink-border bg-ink-soft p-6">
        <h1 className="text-xl font-black">{setupMode ? "Criar primeiro administrador" : "Acesso administrativo"}</h1>
        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background text-foreground" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required minLength={8} autoComplete={setupMode ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background text-foreground" />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} {setupMode ? "Criar conta" : "Entrar"}
          </Button>
        </div>
        {canSetup && (
          <button type="button" onClick={() => setSetupMode(!setupMode)} className="mt-4 w-full text-center text-xs text-ink-muted underline hover:text-ink-foreground">
            {setupMode ? "Já tenho conta — entrar" : "Nenhum administrador configurado ainda? Configurar agora"}
          </button>
        )}
      </form>
      <Link to="/" className="mt-6 block text-center text-sm text-ink-muted hover:text-ink-foreground">← Voltar ao site</Link>
    </Centered>
  );
}

function NotAdmin({ email, onClaimed }: { email: string; onClaimed: () => void }) {
  const [canClaim, setCanClaim] = useState(false);
  useEffect(() => {
    supabase.rpc("admin_exists").then(({ data }) => setCanClaim(data === false));
  }, []);
  const claim = async () => {
    const { data, error } = await supabase.rpc("claim_first_admin");
    if (error || !data) { toast.error("Não foi possível concluir. Um administrador já pode existir."); return; }
    toast.success("Você agora é o administrador.");
    onClaimed();
  };
  return (
    <Centered>
      <div className="rounded-2xl border border-ink-border bg-ink-soft p-6 text-center">
        <p className="text-sm text-ink-muted">Conectado como {email}</p>
        {canClaim ? (
          <>
            <h1 className="mt-3 text-xl font-black">Configurar primeiro administrador</h1>
            <p className="mt-2 text-sm text-ink-muted">Ainda não há administrador. Esta conta será a única com acesso ao painel.</p>
            <Button className="mt-5 w-full" onClick={claim}>Tornar esta conta administradora</Button>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-xl font-black">Acesso não autorizado</h1>
            <p className="mt-2 text-sm text-ink-muted">Esta conta não tem permissão de administrador.</p>
          </>
        )}
        <Button variant="ghostLight" className="mt-3 w-full" onClick={() => supabase.auth.signOut()}>Sair</Button>
      </div>
    </Centered>
  );
}

const NAV = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/admin/veiculos", label: "Veículos", icon: Car, exact: false },
  { to: "/admin/conteudo", label: "Conteúdo do site", icon: PenSquare, exact: false },
] as const;

function AdminShell({ email }: { email: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries({ queryKey: ["admin"] });
    qc.removeQueries({ queryKey: ["admin"] });
    await supabase.auth.signOut();
    navigate({ to: "/admin", replace: true });
  };
  return (
    <div className="min-h-screen bg-secondary md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-ink text-ink-foreground md:sticky md:top-0 md:h-screen">
        <div className="flex items-center justify-between gap-2 p-4 md:block md:p-6">
          <img src={logo} alt="Localider" className="h-10 w-auto" />
          <Button variant="ghostLight" size="sm" className="md:hidden" onClick={signOut}><LogOut /> Sair</Button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-4">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <Link key={to} to={to} activeOptions={{ exact }} className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-muted hover:bg-ink-soft hover:text-ink-foreground" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}>
              <Icon className="size-4" /> {label}
            </Link>
          ))}
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-muted hover:bg-ink-soft hover:text-ink-foreground">
            <ExternalLink className="size-4" /> Ver site
          </a>
        </nav>
        <div className="absolute bottom-0 hidden w-[240px] border-t border-ink-border p-4 md:block">
          <p className="truncate text-xs text-ink-muted">{email}</p>
          <Button variant="ghostLight" size="sm" className="mt-2 w-full" onClick={signOut}><LogOut /> Sair</Button>
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
