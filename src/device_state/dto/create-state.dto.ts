import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString } from "class-validator";

export class CreateStateDto {
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    is_active?: number;

    @IsString()
    @IsOptional()
    note?: string;

    @IsString()
    @IsOptional()
    description?: string;
}