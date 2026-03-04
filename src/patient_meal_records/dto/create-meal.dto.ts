import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateMealDto {
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  patient_code: number;

  @IsDateString()
  @IsNotEmpty()
  record_date: string;

  @IsObject()
  @IsNotEmpty()
  meals: {
    breakfast: number; // 0: 식사전, 1: 전량섭취, 5: 결식
    lunch: number;
    dinner: number;
  };
}
