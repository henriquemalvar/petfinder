/**
 * Autorização a nível de objeto (o IDOR corrigido no PR #6), exercitada contra
 * a API real. Vai direto na API em vez da UI porque o wizard de post usa
 * selects do Radix, custosos de dirigir, e o que importa aqui é a regra do
 * servidor: dono edita, terceiro não.
 *
 * Assume o banco recém-populado pelo seed (joao@ e maria@, senha 123456).
 */
const API = Cypress.env("apiUrl") as string;

function login(email: string) {
  return cy
    .request("POST", `${API}/api/auth/login`, { email, password: "123456" })
    .its("body.token");
}

function criarPost(token: string) {
  return cy
    .request({
      method: "POST",
      url: `${API}/api/announcements`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        type: "LOST",
        title: "Post de teste e2e",
        content: "Conteúdo do post criado pelo teste e2e.",
        pet: {
          name: "Rex",
          type: "Cachorro",
          breed: "Vira-lata",
          age: "2 anos",
          gender: "MALE",
          size: "MEDIUM",
          description: "Pet criado pelo teste e2e.",
          castrated: true,
          vaccinated: true,
          location: "Centro",
        },
      },
    })
    .then((res) => {
      expect(res.status).to.eq(201);
      return res.body.id as string;
    });
}

describe("Autorização de posts (IDOR)", () => {
  let tokenDono: string;
  let tokenOutro: string;
  let postId: string;

  before(() => {
    login("joao@email.com").then((t) => {
      tokenDono = t as unknown as string;
      login("maria@email.com").then((t2) => {
        tokenOutro = t2 as unknown as string;
        criarPost(tokenDono).then((id) => {
          postId = id;
        });
      });
    });
  });

  it("bloqueia edição de post de outro usuário com 403", () => {
    cy.request({
      method: "PUT",
      url: `${API}/api/posts/${postId}`,
      headers: { Authorization: `Bearer ${tokenOutro}` },
      body: { title: "Invadido", content: "Editado por quem não é dono." },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403);
    });
  });

  it("bloqueia exclusão de post de outro usuário com 403", () => {
    cy.request({
      method: "DELETE",
      url: `${API}/api/posts/${postId}`,
      headers: { Authorization: `Bearer ${tokenOutro}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403);
    });
  });

  it("não altera o post após as tentativas negadas", () => {
    cy.request(`${API}/api/posts/${postId}`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.title).to.eq("Post de teste e2e");
    });
  });

  it("exige token: 401 sem Authorization e com Bearer mal formatado", () => {
    cy.request({
      method: "PUT",
      url: `${API}/api/posts/${postId}`,
      body: { title: "Sem token" },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 401);

    cy.request({
      method: "PUT",
      url: `${API}/api/posts/${postId}`,
      headers: { Authorization: "xyz123" },
      body: { title: "Token torto" },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 401);
  });

  it("permite que o dono edite e exclua o próprio post", () => {
    cy.request({
      method: "PUT",
      url: `${API}/api/posts/${postId}`,
      headers: { Authorization: `Bearer ${tokenDono}` },
      body: { title: "Editado pelo dono", content: "Agora sim, é o dono editando." },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.title).to.eq("Editado pelo dono");
    });

    cy.request({
      method: "DELETE",
      url: `${API}/api/posts/${postId}`,
      headers: { Authorization: `Bearer ${tokenDono}` },
    })
      .its("status")
      .should("be.oneOf", [200, 204]);
  });
});
