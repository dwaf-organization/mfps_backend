import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SafetyConfirmDto {
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  patient_code: number;

  @IsString()
  @IsOptional()
  confirmed_by?: string;
}
