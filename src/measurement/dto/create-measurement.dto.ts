import { Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { MeasurementItemDto } from "./create-measurement-item.dto";

export class CreateMeasurementDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    device_code: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MeasurementItemDto)
    measurements: MeasurementItemDto[];

    @IsString()
    @IsOptional()
    description?: string;
}