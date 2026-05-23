import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('memos')
export class Memo {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar', nullable: true })
  title!: string | null;

  @Column({ type: 'varchar', default: '' })
  content!: string;

  @Column({ type: 'varchar', name: 'created_at' })
  createdAt!: string;

  @Column({ type: 'varchar', name: 'updated_at' })
  updatedAt!: string;

  @Column({ type: 'varchar', name: 'deleted_at', nullable: true })
  deletedAt!: string | null;

  @Column({ type: 'varchar', name: 'sync_status', default: 'pending' })
  syncStatus!: string;
}
