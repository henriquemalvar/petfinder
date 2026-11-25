import { NextFunction, Request, Response } from 'express';

const DEMO_LOCKED_MESSAGE = 'A conta demo não pode trocar e-mail, senha nem ser excluída.';

export function isDemoAccount(email: string | undefined): boolean {
  const demoEmail = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  return Boolean(demoEmail) && email?.trim().toLowerCase() === demoEmail;
}

function changesCredentials(req: Request): boolean {
  const body = req.body ?? {};
  return body.email !== undefined || body.password !== undefined;
}

function guardDemo(shouldBlock: (req: Request) => boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (isDemoAccount(req.user?.email) && shouldBlock(req)) {
      res.status(403).json({ error: DEMO_LOCKED_MESSAGE });
      return;
    }
    next();
  };
}

export const lockDemoAccount = guardDemo(() => true);
export const lockDemoCredentials = guardDemo(changesCredentials);
