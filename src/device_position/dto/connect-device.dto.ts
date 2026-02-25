import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class ConnectDeviceDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    bed_code: number;

    @IsString()
    @IsNotEmpty()
    device_unique_id: string;
}