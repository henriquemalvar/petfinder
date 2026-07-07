import type { ApiPost } from "./types";

const DEMO_USER = {
  id: "demo-user",
  name: "Comunidade PetFinder",
  email: "demo@petfinder.local",
};

const DEMO_IMAGE =
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=240&fit=crop";

export const DEMO_POST_IDS = new Set([
  "demo-lost-rex",
  "demo-found-luna",
  "demo-adoption-thor",
  "demo-lost-mia",
  "demo-found-bento",
  "demo-adoption-nina",
]);

export function isDemoPost(id: string) {
  return DEMO_POST_IDS.has(id);
}

export const MOCK_MAP_POSTS: ApiPost[] = [
  {
    id: "demo-lost-rex",
    title: "Rex desapareceu",
    content: "Cachorro labrador visto pela última vez no Tatuapé.",
    type: "LOST",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    user: DEMO_USER,
    pet: {
      id: "demo-pet-rex",
      name: "Rex",
      type: "DOG",
      breed: "Labrador",
      age: "2",
      gender: "MALE",
      size: "MEDIUM",
      image: DEMO_IMAGE,
      description: "Cachorro dócil, coleira azul.",
      castrated: true,
      vaccinated: true,
      location: "Tatuapé, São Paulo",
      latitude: -23.5407,
      longitude: -46.5756,
    },
  },
  {
    id: "demo-found-luna",
    title: "Gata encontrada",
    content: "Gata siamês encontrada na região da Água Rasa.",
    type: "FOUND",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    user: DEMO_USER,
    pet: {
      id: "demo-pet-luna",
      name: "Luna",
      type: "CAT",
      breed: "Siamês",
      age: "1",
      gender: "FEMALE",
      size: "SMALL",
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=240&fit=crop",
      description: "Gata carinhosa, sem coleira.",
      castrated: true,
      vaccinated: true,
      location: "Água Rasa, São Paulo",
      latitude: -23.5542,
      longitude: -46.6356,
    },
  },
  {
    id: "demo-adoption-thor",
    title: "Thor para adoção",
    content: "Pastor alemão busca um lar responsável.",
    type: "ADOPTION",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    user: DEMO_USER,
    pet: {
      id: "demo-pet-thor",
      name: "Thor",
      type: "DOG",
      breed: "Pastor Alemão",
      age: "3",
      gender: "MALE",
      size: "LARGE",
      image: "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&h=240&fit=crop",
      description: "Cachorro protetor e muito leal.",
      castrated: true,
      vaccinated: true,
      location: "Mooca, São Paulo",
      latitude: -23.5625,
      longitude: -46.5978,
    },
  },
  {
    id: "demo-lost-mia",
    title: "Mia desapareceu",
    content: "Gata persa sumiu perto do Parque da Aclimação.",
    type: "LOST",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    user: DEMO_USER,
    pet: {
      id: "demo-pet-mia",
      name: "Mia",
      type: "CAT",
      breed: "Persa",
      age: "2",
      gender: "FEMALE",
      size: "SMALL",
      image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=240&fit=crop",
      description: "Pelagem branca, olhos azuis.",
      castrated: true,
      vaccinated: true,
      location: "Aclimação, São Paulo",
      latitude: -23.5731,
      longitude: -46.6289,
    },
  },
  {
    id: "demo-found-bento",
    title: "Cachorro encontrado",
    content: "Vira-lata amigável encontrado na Vila Mariana.",
    type: "FOUND",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    user: DEMO_USER,
    pet: {
      id: "demo-pet-bento",
      name: "Bento",
      type: "DOG",
      breed: "Vira-lata",
      age: "4",
      gender: "MALE",
      size: "MEDIUM",
      image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=240&fit=crop",
      description: "Cachorro sociável, sem microchip.",
      castrated: false,
      vaccinated: true,
      location: "Vila Mariana, São Paulo",
      latitude: -23.5891,
      longitude: -46.6342,
    },
  },
  {
    id: "demo-adoption-nina",
    title: "Nina para adoção",
    content: "Filhote de golden retriever disponível para adoção.",
    type: "ADOPTION",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    user: DEMO_USER,
    pet: {
      id: "demo-pet-nina",
      name: "Nina",
      type: "DOG",
      breed: "Golden Retriever",
      age: "1",
      gender: "FEMALE",
      size: "MEDIUM",
      image: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&h=240&fit=crop",
      description: "Filhote brincalhona e carinhosa.",
      castrated: true,
      vaccinated: true,
      location: "Penha, São Paulo",
      latitude: -23.5289,
      longitude: -46.5421,
    },
  },
];

export function hasMapCoordinates(posts: ApiPost[]) {
  return posts.some((p) => p.pet.latitude != null && p.pet.longitude != null);
}

export function withDemoMapPosts(posts: ApiPost[]) {
  if (hasMapCoordinates(posts)) {
    return { posts, isDemo: false };
  }
  return { posts: MOCK_MAP_POSTS, isDemo: true };
}
