import { IsNotEmpty, IsString } from "class-validator";

export class LoginEmailDto {
    @IsString()
    @IsNotEmpty()
    hospital_id: string;   

    @IsString()
    @IsNotEmpty()
    hospital_password: string;
}