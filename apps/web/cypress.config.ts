import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: false,
    env: {
      // A suíte de autorização fala direto com a API (o wizard de post usa
      // selects do Radix, custosos de dirigir pela UI).
      apiUrl: "http://localhost:3333",
    },
  },
});
