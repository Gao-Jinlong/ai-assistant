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
import { pick } from 'es-toolkit';
import { generateUid } from '@server/utils/uid';

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
        uid: generateUid('user'),
        name: `${data.email.split('@')[0]}`,
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
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
      where: {
        deleted: false,
      },
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.db.user.findUnique({
      where: {
        id,
        deleted: false,
      },
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      // 检查用户是否存在
      const existingUser = await this.prisma.db.user.findUnique({
        where: { id, deleted: false },
      });

      if (!existingUser) {
        throw new BadRequestException('用户不存在');
      }

      // 如果要更新邮箱，检查邮箱是否已被其他用户使用
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const emailExists = await this.prisma.db.user.findFirst({
          where: {
            email: updateUserDto.email,
            deleted: false,
            id: { not: id },
          },
        });

        if (emailExists) {
          throw new BadRequestException('邮箱已被使用');
        }
      }

      // 如果要更新密码，进行加密
      const updateData: Partial<UpdateUserDto> & { password?: string } = {
        ...updateUserDto,
      };
      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      // 移除 id 字段，避免更新主键
      delete updateData.id;

      const updatedUser = await this.prisma.db.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          uid: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException('用户不存在');
        }
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('更新失败');
    }
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
