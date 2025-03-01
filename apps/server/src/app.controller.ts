import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import * as trpc from '@trpc/server';

@Controller()
export class AppController {
  constructor() {}
}
