import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '@server/auth/public.decorator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * 用户注册
   */
  @Post('register')
  @Public()
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.userService.register(createUserDto);
  }

  /**
   * 用户登录
   */
  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    this.logger.info('用户登录', loginDto);
    const result = await this.userService.login(loginDto);
    this.logger.info('用户登录成功', result);
    return result;
  }

  /**
   * 获取所有用户列表
   */
  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  /**
   * 根据ID获取单个用户
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.findOne(id);
  }

  /**
   * 更新用户信息
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(id, updateUserDto);
  }

  /**
   * 删除用户（软删除）
   */
  @Delete(':uid')
  async remove(@Param('uid') uid: string) {
    return await this.userService.delete(uid);
  }
}
