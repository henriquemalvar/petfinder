import * as bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { generateToken } from '../config/jwt';
import { GOOGLE_CLIENT_ID, googleClient } from '../config/google';
import { AppError } from '../errors/AppError';
import { UserRepository } from '../repositories/UserRepository';
import { CreateUserDTO } from '../types';

interface AuthDTO {
  email: string;
  password: string;
}

export class AuthService {
  private repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
  }

  async authenticate({ email, password }: AuthDTO) {
    try {
      const user = await this.repository.findByEmail(email);

      if (!user || !user.password) {
        throw new AppError('Email ou senha inválidos', StatusCodes.UNAUTHORIZED);
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        throw new AppError('Email ou senha inválidos', StatusCodes.UNAUTHORIZED);
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(userWithoutPassword);

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Erro ao autenticar usuário', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async register(data: CreateUserDTO) {
    try {
      const userExists = await this.repository.findByEmail(data.email);

      if (userExists) {
        throw new AppError('Email já está em uso', StatusCodes.CONFLICT);
      }

      if (!data.password) {
        throw new AppError('Senha é obrigatória', StatusCodes.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await this.repository.create({
        ...data,
        password: hashedPassword
      });

      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(userWithoutPassword);

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Erro ao registrar usuário', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async authenticateWithGoogle(credential: string) {
    if (!GOOGLE_CLIENT_ID) {
      throw new AppError('Login com Google não configurado no servidor', StatusCodes.INTERNAL_SERVER_ERROR);
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch {
      throw new AppError('Token do Google inválido', StatusCodes.UNAUTHORIZED);
    }

    if (!payload || !payload.email) {
      throw new AppError('Token do Google inválido', StatusCodes.UNAUTHORIZED);
    }

    if (!payload.email_verified) {
      throw new AppError('Email do Google não verificado', StatusCodes.UNAUTHORIZED);
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await this.repository.findByEmail(email);

    if (!user) {
      user = await this.repository.create({
        name: name || email,
        email,
        googleId,
        avatar: picture
      });
    } else if (!user.googleId) {
      // Segurança: não vincular automaticamente a uma conta que já tem senha.
      // O cadastro local não verifica email, então um atacante poderia ter
      // criado essa conta com o email da vítima; auto-vincular sequestraria a conta.
      if (user.password) {
        throw new AppError(
          'Este email já possui uma conta com senha. Entre com email e senha.',
          StatusCodes.CONFLICT
        );
      }
      user = await this.repository.update(user.id, { googleId });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      token
    };
  }
}
