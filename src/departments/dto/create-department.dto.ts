import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateDepartmentDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    dept_code: string;
}
