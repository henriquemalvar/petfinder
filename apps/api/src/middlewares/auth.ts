import { USER_SELECT } from '../constants/prismaSelect';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as jwt from 'jsonwebtoken';
import { UserResponse } from '../types';
import { prisma } from '../config/prisma';
import { getJwtSecret } from '../config/env';


interface TokenPayload {
  id: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { authorization } = req.headers;

  if (!authorization) {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Token não fornecido' });
    return;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Token mal formatado' });
    return;
  }

  let payload: TokenPayload;

  try {
    payload = jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch (_error) {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Token inválido' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: USER_SELECT
    });

    if (!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Usuário não encontrado' });
      return;
    }

    req.user = user as UserResponse;
    next();
  } catch (error) {
    next(error);
  }
};
