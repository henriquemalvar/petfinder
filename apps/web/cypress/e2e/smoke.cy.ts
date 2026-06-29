describe("PetFinder smoke", () => {
  it("carrega a home", () => {
    cy.visit("/");
    cy.contains("PetFinder");
    cy.contains("Reunindo famílias");
  });

  it("navega para find pets", () => {
    cy.visit("/find-pets");
    cy.contains("Pets disponíveis");
  });

  it("redireciona /post para login sem auth", () => {
    cy.visit("/post");
    cy.url().should("include", "/login");
  });
});
