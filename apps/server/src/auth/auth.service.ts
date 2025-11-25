import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@server/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { User } from 'generated/prisma/client';
import { LoginDto } from '@server/user/dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { TRPCError } from '@trpc/server';

export interface JwtPayload {
  email: string;
  uid: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(user: User, loginDto: LoginDto) {
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async generateToken(user: User) {
    const payload: JwtPayload = { email: user.email, uid: user.uid };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
    };
  }

  /**
   * 验证 token
   * @param token
   * @returns
   */
  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);
      return decoded;
    } catch (error) {
      // TODO 记录日志
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      });
    }
  }
}
