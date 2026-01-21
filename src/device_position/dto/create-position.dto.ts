import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatePositionDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    device_code: number;

    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    device_loc_code: number;

    @IsString()
    @IsOptional()
    description?: string;
}