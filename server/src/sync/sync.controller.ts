import { Controller, Post, Body } from '@nestjs/common';
import { SyncService } from './sync.service';
import { PushRequestDto, PullRequestDto } from './sync.dto';

@Controller('api/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  async push(@Body() body: PushRequestDto) {
    return this.syncService.push(body.items);
  }

  @Post('pull')
  async pull(@Body() body: PullRequestDto) {
    return this.syncService.pull(body.lastSyncedAt);
  }
}
