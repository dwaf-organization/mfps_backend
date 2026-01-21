import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateWeightDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    measurement_code: number;

    @IsInt()
    @Type(() => Number)
    @IsOptional()
    weight1?: number;
    
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    weight2?: number;

    @IsInt()
    @Type(() => Number)
    @IsOptional()
    weight3?: number;

    @IsInt()
    @Type(() => Number)
    @IsOptional()
    weight4?: number;

    @IsString()
    @IsOptional()
    description?: string;
}