import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('tags')
export class Tag {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar', unique: true })
  name!: string;
}
