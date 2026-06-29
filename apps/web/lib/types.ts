export type PostType = "LOST" | "FOUND" | "ADOPTION";
export type PostStatus = "ACTIVE" | "RESOLVED" | "CANCELED";
export type PetGender = "MALE" | "FEMALE";
export type PetSize = "SMALL" | "MEDIUM" | "LARGE";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  contactPreference?: string | null;
}

export interface ApiPet {
  id: string;
  name: string;
  type: string;
  breed: string;
  age: string;
  gender: PetGender;
  size: PetSize;
  image?: string | null;
  description: string;
  castrated: boolean;
  vaccinated: boolean;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ApiPost {
  id: string;
  title: string;
  content: string;
  type: PostType;
  status: PostStatus;
  createdAt: string;
  pet: ApiPet;
  user: ApiUser;
}

export interface PostsResponse {
  posts: ApiPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiComment {
  id: string;
  text: string;
  createdAt: string;
  user: Pick<ApiUser, "id" | "name" | "avatar">;
}

export interface AuthResponse {
  user: ApiUser;
  token: string;
}

export interface PostFilters {
  type?: PostType;
  status?: PostStatus;
  location?: string;
  petType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AnnouncementPayload {
  type: PostType;
  title?: string;
  content?: string;
  pet: {
    name: string;
    type: string;
    breed: string;
    age: string;
    gender: PetGender;
    size: PetSize;
    image?: string;
    description: string;
    castrated: boolean;
    vaccinated: boolean;
    location: string;
    latitude?: number;
    longitude?: number;
  };
  whatsapp?: string;
  instagram?: string;
  contactPreference?: string;
  sharePhonePublicly?: boolean;
}

export interface ApiNotification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  postId: string;
}

export interface NotificationsResponse {
  notifications: ApiNotification[];
  unreadCount: number;
}
