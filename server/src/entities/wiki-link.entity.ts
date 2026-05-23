import { Entity, PrimaryColumn } from 'typeorm';

@Entity('wiki_links')
export class WikiLink {
  @PrimaryColumn({ type: 'varchar', name: 'source_memo_id' })
  sourceMemoId!: string;

  @PrimaryColumn({ type: 'varchar', name: 'target_memo_id' })
  targetMemoId!: string;
}
