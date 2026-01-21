import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateEmailDto {
    @IsString()
    @IsNotEmpty()
    hospital_new_password: string;

    @IsString()
    @IsNotEmpty()
    hospital_new_password_verify: string;

    @IsString()
    @IsOptional()
    note?: string;
    
    @IsString()
    @IsOptional()
    description?: string;   
}