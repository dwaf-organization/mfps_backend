import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber } from "class-validator";

export class WeightValueDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    sensor: number;

    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    value: number;
}