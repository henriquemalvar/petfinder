import { Phone, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactActionsProps {
  whatsapp?: string | null;
  instagram?: string | null;
  contactPreference?: string | null;
}

function whatsappUrl(value: string) {
  return `https://wa.me/${value.replace(/\D/g, "")}`;
}

function instagramUrl(handle: string) {
  return `https://instagram.com/${handle.trim().replace(/^@/, "")}`;
}

/**
 * Renderiza o(s) botão(ões) de contato do dono do anúncio, respeitando a
 * preferência (WHATSAPP/INSTAGRAM). O canal preferido vira o CTA primário
 * ("Contatar dono"); se o outro canal também estiver preenchido, aparece como
 * ação secundária. Se a preferência aponta para um canal sem dado, cai para o
 * que existir. Sem nenhum contato, não renderiza nada.
 */
export function ContactActions({ whatsapp, instagram, contactPreference }: ContactActionsProps) {
  const hasWhatsapp = Boolean(whatsapp?.trim());
  const hasInstagram = Boolean(instagram?.trim());
  if (!hasWhatsapp && !hasInstagram) return null;

  const preferInstagram = contactPreference === "INSTAGRAM" && hasInstagram;
  const order: ("whatsapp" | "instagram")[] = preferInstagram
    ? ["instagram", ...(hasWhatsapp ? (["whatsapp"] as const) : [])]
    : [
        ...(hasWhatsapp ? (["whatsapp"] as const) : []),
        ...(hasInstagram ? (["instagram"] as const) : []),
      ];

  return (
    <>
      {order.map((channel, index) => {
        const primary = index === 0;
        const variant = primary ? "default" : "outline";
        if (channel === "whatsapp") {
          return (
            <a key="whatsapp" href={whatsappUrl(whatsapp!)} target="_blank" rel="noopener noreferrer">
              <Button variant={variant} className="rounded-xl">
                <Phone className="mr-2 h-4 w-4" />
                {primary ? "Contatar dono" : "WhatsApp"}
              </Button>
            </a>
          );
        }
        return (
          <a key="instagram" href={instagramUrl(instagram!)} target="_blank" rel="noopener noreferrer">
            <Button variant={variant} className="rounded-xl">
              <Instagram className="mr-2 h-4 w-4" />
              {primary ? "Contatar dono" : "Instagram"}
            </Button>
          </a>
        );
      })}
    </>
  );
}
