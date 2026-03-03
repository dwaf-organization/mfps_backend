import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateUlcerDto {
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  patient_code: number;

  @IsDateString()
  @IsNotEmpty()
  record_date: string;

  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  part_code: number;

  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  stage_code: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
