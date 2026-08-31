import { NextResponse } from 'next/server';
import { describe, expect, it } from 'vitest';
import { endSession, startSession } from '../server-session';

describe('startSession', () => {
  it('grava o token em cookie httpOnly de 7 dias', () => {
    const res = startSession(NextResponse.json({ ok: true }), 'jwt-novo');

    const cookie = res.cookies.get('token');
    expect(cookie?.value).toBe('jwt-novo');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('lax');
    expect(cookie?.path).toBe('/');
    expect(cookie?.maxAge).toBe(60 * 60 * 24 * 7);
  });

  it('não marca o cookie como secure fora de produção', () => {
    const res = startSession(NextResponse.json({ ok: true }), 'jwt');

    expect(res.cookies.get('token')?.secure).toBe(false);
  });
});

describe('endSession', () => {
  it('expira o cookie de sessão', () => {
    const res = endSession(NextResponse.json({ ok: true }));

    expect(res.cookies.get('token')?.value).toBe('');
  });
});
