"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { clientLogin } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Separator } from "@/components/ui/separator";
import { AuthCard } from "@/components/auth/AuthCard";
import { safeRedirect } from "@/lib/utils";
import { demoCredentials } from "@/lib/demo-account";

const DEMO = demoCredentials();

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(loginEmail: string, loginPassword: string) {
    setLoading(true);
    try {
      await clientLogin(loginEmail, loginPassword);
      toast.success("Entrada realizada!");
      router.push(safeRedirect(searchParams.get("redirect")));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void signIn(email, password);
  }

  return (
    <AuthCard
      title="Entrar"
      description="Acesse sua conta PetFinder"
      footer={
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 rounded-xl"
          />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 rounded-xl"
          />
        </div>
        <Button type="submit" size="lg" className="w-full rounded-xl" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <div className="mt-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou</span>
        <Separator className="flex-1" />
      </div>
      <div className="mt-4 space-y-3">
        <GoogleSignInButton redirect={safeRedirect(searchParams.get("redirect"))} />
        {DEMO && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full rounded-xl"
            disabled={loading}
            onClick={() => void signIn(DEMO.email, DEMO.password)}
          >
            Entrar como visitante demo
          </Button>
        )}
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
