"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientGoogleLogin } from "@/lib/client-api";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number; text?: string }
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  redirect?: string;
}

export function GoogleSignInButton({ redirect }: GoogleSignInButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);

  async function handleCredential(response: GoogleCredentialResponse) {
    try {
      await clientGoogleLogin(response.credential);
      toast.success("Entrada realizada!");
      router.push(redirect || "/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar com Google");
    }
  }

  function renderGoogleButton() {
    if (!window.google || !buttonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      callback: handleCredential,
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 328,
      text: "continue_with",
    });
  }

  useEffect(() => {
    if (window.google) renderGoogleButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={renderGoogleButton}
      />
      <div ref={buttonRef} className="flex justify-center" />
    </>
  );
}
