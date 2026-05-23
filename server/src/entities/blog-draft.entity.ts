import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('blog_drafts')
export class BlogDraft {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar', name: 'memo_ids' })
  memoIds!: string;

  @Column({ type: 'varchar' })
  template!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar' })
  content!: string;

  @Column({ type: 'varchar', default: 'draft' })
  status!: string;

  @Column({ type: 'varchar', name: 'published_at', nullable: true })
  publishedAt!: string | null;

  @Column({ type: 'varchar', name: 'published_url', nullable: true })
  publishedUrl!: string | null;

  @Column({ type: 'varchar', name: 'created_at' })
  createdAt!: string;

  @Column({ type: 'varchar', name: 'updated_at' })
  updatedAt!: string;
}
