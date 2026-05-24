import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { Memo } from '../entities/memo.entity';
import { Tag } from '../entities/tag.entity';
import { MemoTag } from '../entities/memo-tag.entity';
import { WikiLink } from '../entities/wiki-link.entity';
import { BlogDraft } from '../entities/blog-draft.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Memo, Tag, MemoTag, WikiLink, BlogDraft])],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
