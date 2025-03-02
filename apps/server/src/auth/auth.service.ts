import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@server/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // 返回用户信息，但排除密码字段
    const { password: _, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    // 验证用户
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 生成JWT令牌
    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);

    return {
      user,
      access_token: token,
    };
  }
}
