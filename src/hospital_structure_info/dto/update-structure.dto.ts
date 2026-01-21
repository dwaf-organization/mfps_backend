import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class UpdateStructureDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    hospital_st_code: number;

    @IsString()
    @IsNotEmpty()
    category_name: string;
}