import { Type } from "class-transformer";
import { IsArray, IsInt, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { WeightValueDto } from "./create-weight.dto";

export class MeasurementItemDto {
    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    temperature?: number;

    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    body_temperature?: number;

    @IsInt()
    @Type(() => Number)
    @IsOptional()
    humidity?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WeightValueDto)
    weights: WeightValueDto[];

}