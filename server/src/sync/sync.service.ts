import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Memo } from '../entities/memo.entity';
import { Tag } from '../entities/tag.entity';
import { MemoTag } from '../entities/memo-tag.entity';
import { WikiLink } from '../entities/wiki-link.entity';
import { BlogDraft } from '../entities/blog-draft.entity';
import { PushItemDto, PullItemDto } from './sync.dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(Memo)
    private readonly memoRepo: Repository<Memo>,

    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,

    @InjectRepository(MemoTag)
    private readonly memoTagRepo: Repository<MemoTag>,

    @InjectRepository(WikiLink)
    private readonly wikiLinkRepo: Repository<WikiLink>,

    @InjectRepository(BlogDraft)
    private readonly blogDraftRepo: Repository<BlogDraft>,
  ) {}

  async push(items: PushItemDto[]): Promise<{ processed: number; errors: string[] }> {
    let processed = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        await this.processItem(item);
        processed++;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        this.logger.error(
          `Failed to process ${item.entity}/${item.entityId}: ${message}`,
        );
        errors.push(`${item.entity}/${item.entityId}: ${message}`);
      }
    }

    return { processed, errors };
  }

  async pull(lastSyncedAt: string): Promise<{ items: PullItemDto[] }> {
    const items: PullItemDto[] = [];

    // Pull memos updated since lastSyncedAt
    const memos = await this.memoRepo.find({
      where: { updatedAt: MoreThan(lastSyncedAt) },
    });

    for (const memo of memos) {
      items.push({
        entity: 'memo',
        entityId: memo.id,
        action: memo.deletedAt ? 'delete' : 'update',
        payload: JSON.stringify(memo),
      });
    }

    // Pull blog drafts updated since lastSyncedAt
    const drafts = await this.blogDraftRepo.find({
      where: { updatedAt: MoreThan(lastSyncedAt) },
    });

    for (const draft of drafts) {
      items.push({
        entity: 'blog_draft',
        entityId: draft.id,
        action: 'update',
        payload: JSON.stringify(draft),
      });
    }

    // Tags and memo_tags don't have updated_at, so we return all of them
    // only on initial sync (when lastSyncedAt is empty or epoch)
    if (!lastSyncedAt || lastSyncedAt === '1970-01-01T00:00:00.000Z') {
      const tags = await this.tagRepo.find();
      for (const tag of tags) {
        items.push({
          entity: 'tag',
          entityId: tag.id,
          action: 'update',
          payload: JSON.stringify(tag),
        });
      }

      const memoTags = await this.memoTagRepo.find();
      for (const mt of memoTags) {
        items.push({
          entity: 'memo_tag',
          entityId: `${mt.memoId}:${mt.tagId}`,
          action: 'update',
          payload: JSON.stringify(mt),
        });
      }

      const wikiLinks = await this.wikiLinkRepo.find();
      for (const wl of wikiLinks) {
        items.push({
          entity: 'wiki_link',
          entityId: `${wl.sourceMemoId}:${wl.targetMemoId}`,
          action: 'update',
          payload: JSON.stringify(wl),
        });
      }
    }

    return { items };
  }

  private async processItem(item: PushItemDto): Promise<void> {
    const data = JSON.parse(item.payload);

    switch (item.entity) {
      case 'memo':
        await this.processMemo(item.action, data);
        break;
      case 'tag':
        await this.processTag(item.action, data);
        break;
      case 'memo_tag':
        await this.processMemoTag(item.action, data);
        break;
      case 'wiki_link':
        await this.processWikiLink(item.action, data);
        break;
      case 'blog_draft':
        await this.processBlogDraft(item.action, data);
        break;
      default:
        throw new Error(`Unknown entity type: ${item.entity}`);
    }
  }

  private async processMemo(
    action: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (action === 'delete') {
      // Soft delete: set deleted_at timestamp
      const id = data['id'] as string;
      const existing = await this.memoRepo.findOne({ where: { id } });
      if (existing) {
        existing.deletedAt = new Date().toISOString();
        existing.updatedAt = new Date().toISOString();
        await this.memoRepo.save(existing);
      }
      return;
    }

    // Upsert for create/update
    const memo = this.memoRepo.create({
      id: data['id'] as string,
      title: (data['title'] as string) || null,
      content: (data['content'] as string) || '',
      createdAt: (data['createdAt'] as string) || new Date().toISOString(),
      updatedAt: (data['updatedAt'] as string) || new Date().toISOString(),
      deletedAt: (data['deletedAt'] as string) || null,
      syncStatus: 'synced',
    });

    await this.memoRepo.save(memo);
  }

  private async processTag(
    action: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (action === 'delete') {
      await this.tagRepo.delete({ id: data['id'] as string });
      return;
    }

    const tag = this.tagRepo.create({
      id: data['id'] as string,
      name: data['name'] as string,
    });

    await this.tagRepo.save(tag);
  }

  private async processMemoTag(
    action: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const memoId = data['memoId'] as string;
    const tagId = data['tagId'] as string;

    if (action === 'delete') {
      await this.memoTagRepo.delete({ memoId, tagId });
      return;
    }

    const memoTag = this.memoTagRepo.create({
      memoId,
      tagId,
      source: (data['source'] as string) || 'user',
    });

    await this.memoTagRepo.save(memoTag);
  }

  private async processWikiLink(
    action: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const sourceMemoId = data['sourceMemoId'] as string;
    const targetMemoId = data['targetMemoId'] as string;

    if (action === 'delete') {
      await this.wikiLinkRepo.delete({ sourceMemoId, targetMemoId });
      return;
    }

    const link = this.wikiLinkRepo.create({ sourceMemoId, targetMemoId });
    await this.wikiLinkRepo.save(link);
  }

  private async processBlogDraft(
    action: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (action === 'delete') {
      await this.blogDraftRepo.delete({ id: data['id'] as string });
      return;
    }

    const draft = this.blogDraftRepo.create({
      id: data['id'] as string,
      memoIds: (data['memoIds'] as string) || '',
      template: (data['template'] as string) || '',
      title: (data['title'] as string) || '',
      content: (data['content'] as string) || '',
      status: (data['status'] as string) || 'draft',
      publishedAt: (data['publishedAt'] as string) || null,
      publishedUrl: (data['publishedUrl'] as string) || null,
      createdAt: (data['createdAt'] as string) || new Date().toISOString(),
      updatedAt: (data['updatedAt'] as string) || new Date().toISOString(),
    });

    await this.blogDraftRepo.save(draft);
  }
}
