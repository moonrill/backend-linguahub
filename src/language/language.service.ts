import { PaginationDto } from '#/utils/pagination.dto';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { CreateLanguageDto } from './dto/create-language.dto';
import { LanguageQueryDto } from './dto/query.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { Language } from './entities/language.entity';

@Injectable()
export class LanguageService {
  constructor(
    @InjectRepository(Language)
    private languageRepository: Repository<Language>,
  ) {}

  async create(createLanguageDto: CreateLanguageDto) {
    const existCode = await this.languageRepository.findOne({
      where: {
        code: createLanguageDto.code,
      },
    });

    if (existCode) {
      throw new BadRequestException('Language code already exist');
    }

    const entity = new Language();

    entity.name = createLanguageDto.name;
    entity.code = createLanguageDto.code;
    entity.flagImage = createLanguageDto.flagImage;

    const result = await this.languageRepository.insert(entity);

    return this.languageRepository.findOneOrFail({
      where: {
        id: result.identifiers[0].id,
      },
    });
  }

  async findAll(paginationDto: PaginationDto, queryDto: LanguageQueryDto) {
    try {
      const { page, limit } = paginationDto;

      const queryBuilder = this.languageRepository
        .createQueryBuilder('language')
        .leftJoin('language.sourceServices', 'sourceServices')
        .leftJoin('language.targetServices', 'targetServices')
        .select([
          'language.id',
          'language.name',
          'language.code',
          'language.flagImage',
          'language.createdAt',
          'language.updatedAt',
        ])
        .addSelect(
          'COUNT(DISTINCT sourceServices.id) + COUNT(DISTINCT targetServices.id)',
          'serviceCount',
        )
        .groupBy('language.id')
        .orderBy(`language.${queryDto.orderBy}`, queryDto.direction);

      const offset = (page - 1) * limit;

      const total = await queryBuilder.getCount();

      const rawData = await queryBuilder
        .offset(offset)
        .limit(limit)
        .getRawAndEntities();

      // Transform hasil untuk menggabungkan data entity dengan service count
      const transformedData = rawData.entities.map((entity, index) => {
        // Dapatkan service count dari raw result
        const rawServiceCount = rawData.raw[index].serviceCount;

        return {
          ...entity,
          serviceCount: parseInt(rawServiceCount) || 0,
        };
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: transformedData,
        total,
        page,
        totalPages,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const data = await this.languageRepository.findOneOrFail({
        where: { id },
      });

      return data;
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new NotFoundException('Language not found');
      } else {
        throw e;
      }
    }
  }

  async findByName(name: string) {
    try {
      return await this.languageRepository.findOneOrFail({
        where: { name },
      });
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new NotFoundException('Language not found');
      } else {
        throw e;
      }
    }
  }

  async update(id: string, updateLanguageDto: UpdateLanguageDto) {
    try {
      // Find old data
      const oldData = await this.findById(id);

      // Create new data
      const langEntity = new Language();

      langEntity.name = updateLanguageDto.name;
      langEntity.code = updateLanguageDto.code;

      // Check if new flag image is uploaded
      if (updateLanguageDto.flagImage) {
        langEntity.flagImage = updateLanguageDto.flagImage;
      } else {
        langEntity.flagImage = oldData.flagImage;
      }

      await this.languageRepository.update(id, langEntity);

      return this.languageRepository.findOneOrFail({
        where: { id },
      });
    } catch (e) {
      throw e;
    }
  }

  async remove(id: string) {
    try {
      await this.findById(id);

      await this.languageRepository.softDelete(id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Success delete language',
      };
    } catch (e) {
      throw e;
    }
  }
}
