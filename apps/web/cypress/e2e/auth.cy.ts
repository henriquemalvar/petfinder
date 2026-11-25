/**
 * Fluxos de autenticação pela UI. Assume o banco recém-populado pelo seed
 * (usuários joao@email.com / maria@email.com, senha 123456).
 */
describe("Autenticação", () => {
  it("faz login com usuário do seed e libera rota protegida", () => {
    cy.visit("/login");
    cy.get("#email").type("joao@email.com");
    cy.get("#password").type("123456");
    cy.contains("button", "Entrar").click();

    cy.location("pathname").should("eq", "/");

    // /post redireciona para /login sem auth: chegar nela prova a sessão.
    cy.visit("/post");
    cy.location("pathname").should("eq", "/post");
  });

  it("guarda o destino ao barrar rota protegida e volta para ela após o login", () => {
    cy.visit("/post");
    cy.location("pathname").should("eq", "/login");
    cy.location("search").should("contain", "redirect");

    cy.get("#email").type("maria@email.com");
    cy.get("#password").type("123456");
    cy.contains("button", "Entrar").click();

    cy.location("pathname").should("eq", "/post");
  });

  it("cadastra um novo usuário e já entra autenticado", () => {
    const email = `e2e-${Date.now()}@example.com`;

    cy.visit("/register");
    cy.get("#name").type("Usuário E2E");
    cy.get("#email").type(email);
    cy.get("#password").type("123456");
    cy.contains("button", "Criar conta").click();

    // O registro faz auto-login e leva para /post, que é rota protegida.
    cy.location("pathname").should("eq", "/post");
  });

  // Por último de propósito: tentativas erradas também consomem o rate limit.
  it("rejeita senha errada e mantém o usuário no login", () => {
    cy.visit("/login");
    cy.get("#email").type("joao@email.com");
    cy.get("#password").type("senha-errada");
    cy.contains("button", "Entrar").click();

    cy.contains("Email ou senha inválidos");
    cy.location("pathname").should("eq", "/login");
  });
});
