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
  it('usa o primeiro endereço do x-forwarded-for', () => {
    expect(visitorIp(requestWith({ 'x-forwarded-for': '200.1.1.1, 10.0.0.1' }))).toBe('200.1.1.1');
  });

  it('cai no x-real-ip quando não há x-forwarded-for', () => {
    expect(visitorIp(requestWith({ 'x-real-ip': '200.2.2.2' }))).toBe('200.2.2.2');
  });

  it('devolve undefined sem nenhum cabeçalho de IP', () => {
    expect(visitorIp(requestWith({}))).toBeUndefined();
  });
});

describe('clientIpHeaders', () => {
  it('repassa o IP e o segredo quando o segredo está configurado', () => {
    process.env.AUTH_PROXY_SECRET = 'segredo';

    expect(clientIpHeaders(requestWith({ 'x-forwarded-for': '200.1.1.1' }))).toEqual({
      'x-client-ip': '200.1.1.1',
      'x-proxy-secret': 'segredo',
    });
  });

  it('não repassa nada sem segredo configurado', () => {
    expect(clientIpHeaders(requestWith({ 'x-forwarded-for': '200.1.1.1' }))).toEqual({});
  });

  it('não repassa nada quando não sabe o IP do visitante', () => {
    process.env.AUTH_PROXY_SECRET = 'segredo';

    expect(clientIpHeaders(requestWith({}))).toEqual({});
  });
});
