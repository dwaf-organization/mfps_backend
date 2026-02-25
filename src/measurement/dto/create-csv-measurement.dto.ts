import { Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateCsvMeasurementDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    device_code: number;

    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    patient_code: number;

    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    data: string[];
}