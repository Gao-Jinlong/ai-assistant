import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../src/user/user.service';
import { UserController } from '../src/user/user.controller';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { BadRequestException } from '@nestjs/common';

describe('User CRUD Operations', () => {
  let userService: UserService;
  let userController: UserController;
  let prismaService: PrismaService;

  const mockPrismaService = {
    db: {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    },
  };

  const mockAuthService = {
    validateUser: jest.fn(),
    generateToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userController = module.get<UserController>(UserController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        uid: 'user-abc123',
        name: 'test',
        email: 'test@example.com',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.db.user.findFirst.mockResolvedValue(null);
      mockPrismaService.db.user.create.mockResolvedValue(mockUser);

      const result = await userController.register(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.db.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: createUserDto.email,
          deleted: false,
        },
      });
    });

    it('should throw error if user already exists', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockPrismaService.db.user.findFirst.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });

      await expect(userController.register(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('User Retrieval', () => {
    it('should get all users', async () => {
      const mockUsers = [
        {
          id: 1,
          uid: 'user-abc123',
          name: 'User 1',
          email: 'user1@example.com',
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          uid: 'user-def456',
          name: 'User 2',
          email: 'user2@example.com',
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.db.user.findMany.mockResolvedValue(mockUsers);

      const result = await userController.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.db.user.findMany).toHaveBeenCalledWith({
        where: { deleted: false },
        select: {
          id: true,
          uid: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should get user by id', async () => {
      const mockUser = {
        id: 1,
        uid: 'user-abc123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.db.user.findUnique.mockResolvedValue(mockUser);

      const result = await userController.findOne(1);

      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      mockPrismaService.db.user.findUnique.mockResolvedValue(null);

      await expect(userController.findOne(999)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('User Update', () => {
    it('should update user successfully', async () => {
      const updateUserDto = {
        id: 1,
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const existingUser = {
        id: 1,
        uid: 'user-abc123',
        email: 'old@example.com',
        name: 'Old Name',
        password: 'hashedpassword',
        avatar: null,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedUser = {
        id: 1,
        uid: 'user-abc123',
        name: 'Updated Name',
        email: 'updated@example.com',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.db.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.db.user.findFirst.mockResolvedValue(null); // 邮箱不重复
      mockPrismaService.db.user.update.mockResolvedValue(updatedUser);

      const result = await userController.update(1, updateUserDto);

      expect(result).toEqual(updatedUser);
    });
  });

  describe('User Deletion', () => {
    it('should soft delete user successfully', async () => {
      const userUid = 'user-abc123';
      const mockResult = { uid: userUid };

      mockPrismaService.db.user.update.mockResolvedValue(mockResult);

      const result = await userController.remove(userUid);

      expect(result).toBe(1);
      expect(mockPrismaService.db.user.update).toHaveBeenCalledWith({
        where: { uid: userUid },
        data: { deleted: true },
      });
    });
  });
});
