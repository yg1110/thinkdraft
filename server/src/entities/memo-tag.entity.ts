import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('memo_tags')
export class MemoTag {
  @PrimaryColumn({ type: 'varchar', name: 'memo_id' })
  memoId!: string;

  @PrimaryColumn({ type: 'varchar', name: 'tag_id' })
  tagId!: string;

  @Column({ type: 'varchar', default: 'user' })
  source!: string;
}
