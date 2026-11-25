import * as bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/AppError';
import { UserRepository } from '../repositories/UserRepository';
import { CreateUserDTO, UpdateUserDTO, UserResponse } from '../types';

export class UserService {
  private repository: UserRepository;

  constructor(repository: UserRepository = new UserRepository()) {
    this.repository = repository;
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.repository.findAll();
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async create(data: CreateUserDTO): Promise<UserResponse> {
    const userExists = await this.repository.findByEmail(data.email);

    if (userExists) {
      throw new AppError('Email já está em uso', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.repository.create({
      ...data,
      password: hashedPassword
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new AppError('Usuário não encontrado', StatusCodes.NOT_FOUND);
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: string, data: UpdateUserDTO, requesterId: string): Promise<UserResponse> {
    if (id !== requesterId) {
      throw new AppError('Você não tem permissão para alterar esta conta', StatusCodes.FORBIDDEN);
    }

    const user = await this.repository.findById(id);

    if (!user) {
      throw new AppError('Usuário não encontrado', StatusCodes.NOT_FOUND);
    }

    if (data.email) {
      const userWithEmail = await this.repository.findByEmail(data.email);
      if (userWithEmail && userWithEmail.id !== id) {
        throw new AppError('Email já está em uso', StatusCodes.CONFLICT);
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await this.repository.update(id, data);
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', StatusCodes.NOT_FOUND);
    }

    // Conta criada só via Google não tem senha para conferir.
    if (!user.password) {
      throw new AppError(
        'Sua conta usa login com Google. Use "esqueci minha senha" para definir uma senha.',
        StatusCodes.BAD_REQUEST,
      );
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      throw new AppError('Senha atual incorreta', StatusCodes.UNAUTHORIZED);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.repository.update(userId, { password: hashed });
  }

  async delete(id: string, requesterId: string, password?: string): Promise<void> {
    if (id !== requesterId) {
      throw new AppError('Você não tem permissão para remover esta conta', StatusCodes.FORBIDDEN);
    }

    const user = await this.repository.findById(id);

    if (!user) {
      throw new AppError('Usuário não encontrado', StatusCodes.NOT_FOUND);
    }

    // Exclusão é irreversível (cascata em pets, posts, comentários). Para
    // contas com senha, exige confirmação por senha, protegendo contra uma
    // sessão sequestrada. Contas só-Google não têm senha: o JWT válido mais
    // a confirmação explícita na UI são a barreira.
    if (user.password) {
      if (!password) {
        throw new AppError('Confirme sua senha para excluir a conta', StatusCodes.BAD_REQUEST);
      }
      const matches = await bcrypt.compare(password, user.password);
      if (!matches) {
        throw new AppError('Senha incorreta', StatusCodes.UNAUTHORIZED);
      }
    }

    await this.repository.delete(id);
  }
} 