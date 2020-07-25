import {
  IsArray,
  IsDate,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UserInfoDto } from '../users/user-info.dto';
import { NotePermissionsDto } from './note-permissions.dto';

export class NoteMetadataDto {
  @IsString()
  id: string;
  @IsString()
  alias: string;
  @IsString()
  title: string;
  @IsString()
  description: string;
  @IsArray()
  @IsString({ each: true })
  tags: string[];
  @IsDate()
  updateTime: Date;
  @ValidateNested()
  updateUser: UserInfoDto;
  @IsNumber()
  viewCount: number;
  @IsDate()
  createTime: Date;
  @IsArray()
  @ValidateNested()
  editedBy: UserInfoDto['userName'][];
  @ValidateNested()
  permission: NotePermissionsDto;
}
