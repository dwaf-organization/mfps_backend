import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class RoomInfoDto {
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  hospital_st_code: number;

  @IsString()
  @IsNotEmpty()
  room_name: string;

  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  sort_order: number;
}

export class BedInfoDto {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  hospital_st_code?: number | null;

  @IsString()
  @IsNotEmpty()
  bed_name: string;

  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  sort_order: number;
}

export class UpdateRoomDetailDto {
  @ValidateNested()
  @Type(() => RoomInfoDto)
  @IsNotEmpty()
  room_info: RoomInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BedInfoDto)
  @IsOptional()
  beds?: BedInfoDto[];
}
