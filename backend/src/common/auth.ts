import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata,
  UnauthorizedException, createParamDecorator, BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { PrismaService } from './prisma.service';

export interface AuthUser { id: string; role: 'READER' | 'AUTHOR' | 'ADMIN'; username: string }

export const Public = () => SetMetadata('public', true);
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/** Global guard: parses Bearer JWT when present; enforces auth unless route is @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private reflector: Reflector, private prisma: PrismaService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>('public', [ctx.getHandler(), ctx.getClass()]);
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [ctx.getHandler(), ctx.getClass()]);
    const header: string = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      try {
        const p = await this.jwt.verifyAsync(header.slice(7));
        const u = await this.prisma.user.findUnique({ where: { id: p.sub }, select: { id: true, role: true, username: true, banned: true } });
        if (u && !u.banned) req.user = { id: u.id, role: u.role, username: u.username };
      } catch { /* invalid token -> anonymous */ }
    }
    if (isPublic) return true;
    if (!req.user) throw new UnauthorizedException('Vui lòng đăng nhập');
    if (roles?.length && !roles.includes(req.user.role)) throw new ForbiddenException('Không đủ quyền');
    return true;
  }
}

export const CurrentUser = createParamDecorator((_d, ctx: ExecutionContext): AuthUser | undefined =>
  ctx.switchToHttp().getRequest().user);

export function need<T>(v: T | undefined | null | '', msg: string): T {
  if (v === undefined || v === null || v === '') throw new BadRequestException(msg);
  return v as T;
}
export function int(v: any, def: number, min = 0, max = 1_000_000) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}
