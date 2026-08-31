import { Comment } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/AppError';
import { CommentRepository } from '../repositories/CommentRepository';
import { PostRepository } from '../repositories/PostRepository';

export class CommentService {
  private repository: CommentRepository;
  private postRepository: PostRepository;

  constructor(
    repository: CommentRepository = new CommentRepository(),
    postRepository: PostRepository = new PostRepository()
  ) {
    this.repository = repository;
    this.postRepository = postRepository;
  }

  private async assertPostExists(postId: string): Promise<void> {
    const post = await this.postRepository.findById(postId);

    if (!post) {
      throw new AppError('Post não encontrado', StatusCodes.NOT_FOUND);
    }
  }

  async findByPostId(postId: string): Promise<Comment[]> {
    await this.assertPostExists(postId);

    return this.repository.findByPostId(postId);
  }

  async create(postId: string, userId: string, text: string): Promise<Comment> {
    await this.assertPostExists(postId);

    return this.repository.create(postId, userId, text);
  }
}
