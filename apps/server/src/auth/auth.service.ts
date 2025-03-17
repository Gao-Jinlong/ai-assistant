import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@server/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { LoginDto } from '@server/user/dto/login.dto';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  email: string;
  id: string;
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
      throw new UnauthorizedException();
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const { password: _, ...result } = user;
    return result;
  }

  async generateToken(user: User) {
    const payload = { email: user.email, id: user.uid };
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
      throw new UnauthorizedException('Invalid token');
    }
  }
}
