import { User as UserModel } from '@prisma/client';

export class User implements UserModel {
  uid!: string;
  id!: number;
  email!: string;
  name!: string | null;
  password!: string;
  avatar!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
  deleted!: boolean;
}
