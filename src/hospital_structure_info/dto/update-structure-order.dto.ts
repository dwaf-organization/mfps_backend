import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateStructureOrderDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    hospital_st_code: number;

    @IsString()
    @IsOptional()
    category_name?: string;

    @IsInt()
    @Type(() => Number)
    @IsOptional()
    sort_order?: number;
}