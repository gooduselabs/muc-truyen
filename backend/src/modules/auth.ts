import { BadRequestException, Body, ConflictException, Controller, Get, Injectable, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { AuthUser, CurrentUser, Public } from '../common/auth';
import { slugify } from '../common/content';

export const publicUser = { id: true, username: true, name: true, bio: true, avatarUrl: true, role: true, createdAt: true } as const;

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(email: string, password: string, name: string, asAuthor = false) {
    email = (email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new BadRequestException('Email không hợp lệ');
    if (!password || password.length < 8) throw new BadRequestException('Mật khẩu tối thiểu 8 ký tự');
    name = (name || '').trim().slice(0, 60);
    if (!name) throw new BadRequestException('Vui lòng nhập tên hiển thị');
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('Email đã được sử dụng');
    let username = slugify(name).replace(/-/g, '').slice(0, 20) || 'docgia';
    while (await this.prisma.user.findUnique({ where: { username } })) username = `${username.slice(0, 16)}${Math.floor(Math.random() * 9000 + 1000)}`;
    const user = await this.prisma.user.create({
      data: { email, name, username, passwordHash: await bcrypt.hash(password, 10), role: asAuthor ? 'AUTHOR' : 'READER' },
    });
    return this.session(user.id);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: (email || '').trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) throw new UnauthorizedException('Sai email hoặc mật khẩu');
    if (user.banned) throw new UnauthorizedException('Tài khoản đã bị khoá');
    return this.session(user.id);
  }

  async session(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { ...publicUser, email: true, coins: true, earnings: true } });
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { token, user };
  }
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private prisma: PrismaService) {}
  @Public() @Post('register')
  register(@Body() b: any) { return this.auth.register(b.email, b.password, b.name, !!b.asAuthor); }
  @Public() @Post('login')
  login(@Body() b: any) { return this.auth.login(b.email, b.password); }
  @Get('me')
  me(@CurrentUser() u: AuthUser) { return this.auth.session(u.id); }
  @Patch('me')
  async update(@CurrentUser() u: AuthUser, @Body() b: any) {
    await this.prisma.user.update({
      where: { id: u.id },
      data: {
        name: b.name ? String(b.name).slice(0, 60) : undefined,
        bio: b.bio !== undefined ? String(b.bio).slice(0, 500) : undefined,
        avatarUrl: b.avatarUrl !== undefined ? b.avatarUrl : undefined,
      },
    });
    return this.auth.session(u.id);
  }
  /** Readers can become authors with one click (opens the studio). */
  @Post('become-author')
  async becomeAuthor(@CurrentUser() u: AuthUser) {
    if (u.role === 'READER') await this.prisma.user.update({ where: { id: u.id }, data: { role: 'AUTHOR' } });
    return this.auth.session(u.id);
  }
}
