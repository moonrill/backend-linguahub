import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { Language } from './entities/language.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LanguageService {
  constructor(
    @InjectRepository(Language)
    private languageRepository: Repository<Language>,
    private configService: ConfigService,
  ) {}

  async create(
    createLanguageDto: CreateLanguageDto,
    flagImage: Express.Multer.File,
  ) {
    const entity = new Language();

    entity.name = createLanguageDto.name;
    entity.code = createLanguageDto.code;

    const baseUrl = this.configService.get<string>('BASE_URL');
    entity.flagImage = `${baseUrl}/images/flag/${flagImage.filename}`;

    const result = await this.languageRepository.insert(entity);

    return this.languageRepository.findOneOrFail({
      where: {
        id: result.identifiers[0].id,
      },
    });
  }

  async findAll(order: string) {
    const data = await this.languageRepository.findAndCount({
      order: { name: order as 'ASC' | 'DESC' },
    });

    return data;
  }

  async findOne(id: string) {
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

  async update(
    id: string,
    updateLanguageDto: UpdateLanguageDto,
    flagImage: Express.Multer.File,
  ) {
    try {
      // Find old data
      const oldData = await this.findOne(id);

      // Create new data
      const langEntity = new Language();

      langEntity.name = updateLanguageDto.name;
      langEntity.code = updateLanguageDto.code;

      // Check if new flag image is uploaded
      if (flagImage) {
        langEntity.flagImage = `${process.env.BASE_URL}/public/${flagImage.filename}`;
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
      await this.findOne(id);

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
