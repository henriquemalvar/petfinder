import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidade | PetFinder",
  description: "Quais dados o PetFinder coleta, por que coleta e como excluí-los.",
};

const CONTACT_EMAIL = "PREENCHER_EMAIL_DE_CONTATO";

const LAST_UPDATE = "28 de agosto de 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-bold">Política de privacidade</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última atualização: {LAST_UPDATE}
      </p>

      <Section title="Quem somos">
        <p>
          O PetFinder é uma plataforma comunitária para reunir pets perdidos com suas famílias
          e divulgar animais para adoção. Esta página descreve exatamente quais dados a
          plataforma guarda e o que você pode fazer com eles.
        </p>
      </Section>

      <Section title="Dados que coletamos">
        <p>Ao criar uma conta, guardamos nome e e-mail. Se você entra com e-mail e senha,
          a senha fica armazenada apenas como hash e nunca em texto puro. Se você entra com
          o Google, guardamos o identificador da sua conta Google no lugar da senha.</p>
        <p>No seu perfil, você pode adicionar, sempre de forma opcional: foto, WhatsApp,
          Instagram, sua preferência de contato e seu endereço com as coordenadas
          correspondentes.</p>
        <p>Ao publicar um anúncio, guardamos as informações do pet, as fotos enviadas, o
          texto do anúncio e o local do desaparecimento ou avistamento, incluindo latitude e
          longitude.</p>
      </Section>

      <Section title="Por que coletamos">
        <p>Os dados do anúncio existem para que outras pessoas reconheçam o animal e
          consigam falar com você. A localização é usada para posicionar o anúncio no mapa e
          para avisar quem está por perto quando um novo alerta aparece na região.</p>
        <p>Seu contato só aparece no anúncio no canal que você escolheu como preferido.
          Se você não preencher WhatsApp nem Instagram, nenhum contato é exibido.</p>
      </Section>

      <Section title="O que fica visível para outras pessoas">
        <p>São públicos: os anúncios ativos, as fotos e a descrição do pet, a localização
          aproximada, seu nome, sua foto de perfil e o contato que você escolheu divulgar.
          Seu e-mail e seu endereço completo nunca são exibidos nos anúncios.</p>
      </Section>

      <Section title="Serviços de terceiros">
        <p>As imagens são hospedadas no Cloudinary. O login social usa o Google Identity
          Services. O mapa usa camadas da CARTO sobre dados do OpenStreetMap. Esses serviços
          recebem apenas o necessário para funcionar e seguem as próprias políticas de
          privacidade.</p>
      </Section>

      <Section title="Cookies">
        <p>Usamos um único cookie, chamado <code className="font-mono text-xs">token</code>,
          para manter você conectado. Ele é httpOnly, o que impede leitura por scripts, e
          expira em sete dias. Não usamos cookies de publicidade nem de rastreamento.</p>
      </Section>

      <Section title="Seus direitos">
        <p>Você pode revisar e corrigir seus dados a qualquer momento no
          {" "}
          <Link href="/profile" className="text-primary hover:underline">seu perfil</Link>.
          Anúncios podem ser editados, marcados como resolvidos ou excluídos por você.</p>
        <p>Também no perfil, em Segurança, você pode excluir sua conta. A exclusão é
          definitiva e remove junto todos os seus pets, anúncios, comentários e notificações.
          Não mantemos cópia depois disso.</p>
      </Section>

      <Section title="Contato">
        <p>Dúvidas sobre esta política ou sobre seus dados podem ser enviadas para
          {" "}
          <span className="font-medium text-foreground">{CONTACT_EMAIL}</span>.</p>
      </Section>
    </div>
  );
}
