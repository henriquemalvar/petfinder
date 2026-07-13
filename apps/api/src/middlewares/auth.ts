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

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> | void => {
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

  try {
    const data = jwt.verify(token, getJwtSecret()) as TokenPayload;
    
    prisma.user.findUnique({
      where: { id: data.id },
      select: USER_SELECT
    }).then(user => {
      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Usuário não encontrado' });
        return;
      }

      req.user = user as UserResponse;
      next();
    }).catch(() => {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Token inválido' });
    });
  } catch (_error) {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Token inválido' });
  }
}; 