import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEmailDto {
    @IsString()
    @IsNotEmpty()
    hospital_id: string;   

    @IsString()
    @IsNotEmpty()
    hospital_password: string;

    @IsString()
    @IsNotEmpty()
    hospital_name: string;

    @IsString()
    @IsOptional()
    note?: string;
    
    @IsString()
    @IsOptional()
    description?: string;   
}