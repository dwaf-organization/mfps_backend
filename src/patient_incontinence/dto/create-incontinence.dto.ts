import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateIncontinenceDto {
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  patient_code: number;

  @IsDateString()
  @IsNotEmpty()
  record_date: string;

  @IsBoolean()
  @IsNotEmpty()
  has_incontinence: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
