import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';
import { clientIpHeaders, visitorIp } from '../server-auth-proxy';

function requestWith(headers: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/auth/login', { method: 'POST', headers });
}

afterEach(() => {
  delete process.env.AUTH_PROXY_SECRET;
});

describe('visitorIp', () => {
  it('usa o IP que a Vercel grava em x-vercel-forwarded-for', () => {
    expect(visitorIp(requestWith({ 'x-vercel-forwarded-for': '200.1.1.1' }))).toBe('200.1.1.1');
  });

  it('ignora x-forwarded-for e x-real-ip, que o visitante pode forjar fora da Vercel', () => {
    expect(
      visitorIp(requestWith({ 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '5.6.7.8' })),
    ).toBeUndefined();
  });

  it('devolve undefined sem nenhum cabeçalho de IP', () => {
    expect(visitorIp(requestWith({}))).toBeUndefined();
  });
});

describe('clientIpHeaders', () => {
  it('repassa o IP e o segredo quando o segredo está configurado', () => {
    process.env.AUTH_PROXY_SECRET = 'segredo';

    expect(clientIpHeaders(requestWith({ 'x-vercel-forwarded-for': '200.1.1.1' }))).toEqual({
      'x-client-ip': '200.1.1.1',
      'x-proxy-secret': 'segredo',
    });
  });

  it('não repassa nada sem segredo configurado', () => {
    expect(clientIpHeaders(requestWith({ 'x-vercel-forwarded-for': '200.1.1.1' }))).toEqual({});
  });

  it('não repassa nada quando não sabe o IP do visitante', () => {
    process.env.AUTH_PROXY_SECRET = 'segredo';

    expect(clientIpHeaders(requestWith({}))).toEqual({});
  });
});
