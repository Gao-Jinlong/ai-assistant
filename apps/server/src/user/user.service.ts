import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '@server/auth/auth.service';
import { LoginDto } from './dto/login.dto';
import { omit, pick } from 'es-toolkit';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async register(data: CreateUserDto) {
    const find = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (find) {
      throw new BadRequestException('用户已存在');
    }

    // bcryptjs 用法与 bcrypt 相同
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: `${data.email.split('@')[0]}`,
        ...data,
        password: hashedPassword,
      },
      // 添加 select 确保不返回密码
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: false,
        updatedAt: false,
      },
    });

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isPasswordValid = await this.authService.validateUser(user, loginDto);

    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const token = await this.authService.generateToken(user);

    return {
      user: pick(user, ['id', 'name', 'email', 'avatar']),
      token,
    };
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
