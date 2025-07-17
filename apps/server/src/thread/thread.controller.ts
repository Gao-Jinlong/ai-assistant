import { Controller } from '@nestjs/common';
import { ThreadService } from './thread.service';

@Controller('thread')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}
}
