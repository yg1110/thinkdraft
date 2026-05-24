import { IsArray, IsString, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PushItemDto {
  @IsString()
  entity!: string;

  @IsString()
  entityId!: string;

  @IsString()
  action!: string; // "create" | "update" | "delete"

  @IsString()
  payload!: string; // JSON string
}

export class PushRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PushItemDto)
  items!: PushItemDto[];
}

export class PullRequestDto {
  @IsString()
  lastSyncedAt!: string;
}

export class PullItemDto {
  entity!: string;
  entityId!: string;
  action!: string;
  payload!: string;
}

export class PullResponseDto {
  items!: PullItemDto[];
}
