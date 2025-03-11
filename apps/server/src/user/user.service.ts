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
import { ClsService } from 'nestjs-cls';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async register(data: CreateUserDto) {
    const find = await this.prisma.db.user.findFirst({
      where: {
        email: data.email,
        deleted: false,
      },
    });

    if (find) {
      throw new BadRequestException('用户已存在');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.db.user.create({
      data: {
        uid: '',
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
    const user = await this.prisma.db.user.findFirst({
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
      user: pick(user, ['id', 'uid', 'name', 'email', 'avatar']),
      token,
    };
  }

  async findAll() {
    return this.prisma.db.user.findMany({
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
    return this.prisma.db.user.findUnique({
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

  async delete(uid: string) {
    try {
      const result = await this.prisma.db.user.update({
        where: { uid },
        data: { deleted: true },
      });

      return result.uid && 1;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException('用户不存在');
        }
      }
      throw new BadRequestException('删除失败');
    }
  }
}
