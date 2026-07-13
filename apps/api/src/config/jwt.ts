import * as jwt from 'jsonwebtoken';
import { UserResponse } from '../types';
import { getJwtSecret } from './env';

export const generateToken = (user: UserResponse): string => {
  return jwt.sign(
    { id: user.id },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};
