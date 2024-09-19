import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { EntityNotFoundError, Repository } from 'typeorm';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>
  ){}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const deptEntity = new Department
    deptEntity.name = createDepartmentDto.name
    deptEntity.dept_code = createDepartmentDto.dept_code

    const result = await this.departmentsRepository.insert(deptEntity)
    return await this.departmentsRepository.findOneOrFail({
      where:{
        id: result.identifiers[0].id
      }
    });
  }

  async findAll(page: number, page_size: number) {
    const skip = (page - 1) * page_size
    const [count, data] = await Promise.all([
      this.departmentsRepository.count({}),
      this.departmentsRepository.find({
        order:{created_at:'ASC'},
        skip,
        take: page_size
      })
    ])
    return{count, data};
  }

  async findOneDept(id: string) {
    const data = await this.departmentsRepository.findOne({
      where:{ id}})

    if(!data){
      throw new HttpException(
        {
          statuCode: HttpStatus.NOT_FOUND,
          error: "data not found",
        },
        HttpStatus.NOT_FOUND
      )
    }

    return data
    // try{
    //   return await this.departmentsRepository.findOneOrFail({
    //     where:{
    //       id
    //     }
    //   })
    // }catch(e){
    //   if(e instanceof EntityNotFoundError){
        // throw new HttpException(
        //   {
        //     statuCode: HttpStatus.NOT_FOUND,
        //     error: "data not found",
        //   },
        //   HttpStatus.NOT_FOUND
        // )
    //   }else{
    //     throw e
    //   }
    // }
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    try{
      await this.findOneDept(id)

      const deptEntity = new Department
      deptEntity.name = updateDepartmentDto.name
      deptEntity.dept_code = updateDepartmentDto.dept_code

      await this.departmentsRepository.update(id, deptEntity)
      return await this.departmentsRepository.findOneOrFail({where:{id}})
    }catch(e){
      throw e
    }
  }

  async remove(id: string) {
    try{
      await this.findOneDept(id)

      await this.departmentsRepository.delete(id)
      return "success"
    }catch(e){
      throw e
    }
  }
}
