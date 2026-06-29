"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clientRegister } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await clientRegister(name, email, password);
      toast.success("Conta criada!");
      router.push("/post");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">Junte-se à comunidade PetFinder</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1 rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
