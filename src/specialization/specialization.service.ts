import { TranslatorSpecializations } from '#/translator/entities/translator-specializations.entity';
import { Translator } from '#/translator/entities/translator.entity';
import { TranslatorService } from '#/translator/translator.service';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, ILike, Repository } from 'typeorm';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';
import { Specialization } from './entities/specialization.entity';

@Injectable()
export class SpecializationService {
  constructor(
    @InjectRepository(Specialization)
    private specializationRepository: Repository<Specialization>,
    @InjectRepository(TranslatorSpecializations)
    private translatorSpecializationRepository: Repository<TranslatorSpecializations>,
    @InjectRepository(Translator)
    private translatorRepository: Repository<Translator>,
    @Inject(forwardRef(() => TranslatorService))
    private translatorService: TranslatorService,
  ) {}

  async create(createSpecializationDto: CreateSpecializationDto) {
    try {
      const existName = await this.specializationRepository.findOne({
        where: {
          name: ILike(`%${createSpecializationDto.name}%`),
        },
      });

      if (existName) {
        throw new BadRequestException('Specialization already exist');
      }

      const newSpecialization = new Specialization();

      newSpecialization.name = createSpecializationDto.name;
      newSpecialization.logo = createSpecializationDto.logo;

      const result = await this.specializationRepository.insert(
        newSpecialization,
      );

      return await this.specializationRepository.findOneOrFail({
        where: { id: result.identifiers[0].id },
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit } = paginationDto;
      const [data, total] = await this.specializationRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        totalPages,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async findByName(name: string, paginationDto: PaginationDto) {
    try {
      const { page, limit } = paginationDto;
      const [data, total] =
        await this.translatorSpecializationRepository.findAndCount({
          skip: (page - 1) * limit,
          take: limit,
          where: {
            specialization: {
              name: ILike(`%${name}%`),
            },
          },
          relations: [
            'translator',
            'translator.user',
            'translator.user.userDetail',
            'translator.translatorLanguages.language',
            'translator.translatorSpecializations.specialization',
          ],
        });

      const translators = data.map((ts) => ts.translator);

      const destructedTranslators = translators.map((translator) =>
        this.translatorService.destructTranslator(translator),
      );

      const totalPages = Math.ceil(total / limit);

      return {
        data: destructedTranslators,
        total,
        page,
        totalPages,
        limit,
      };
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Specialization not found');
      } else {
        throw error;
      }
    }
  }

  async findById(id: string) {
    try {
      const data = await this.specializationRepository.findOneOrFail({
        where: {
          id,
        },
      });

      return data;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Specialization not found');
      } else {
        throw error;
      }
    }
  }

  async update(id: string, updateSpecializationDto: UpdateSpecializationDto) {
    try {
      const oldData = await this.findById(id);

      const isNameExist = await this.specializationRepository.findOne({
        where: {
          name: ILike(`%${updateSpecializationDto.name}%`),
        },
      });

      if (isNameExist && oldData.name !== updateSpecializationDto.name) {
        throw new BadRequestException('Specialization already exist');
      }

      const newSpecialization = new Specialization();

      newSpecialization.name = updateSpecializationDto.name;

      if (updateSpecializationDto.logo) {
        newSpecialization.logo = updateSpecializationDto.logo;
      }

      await this.specializationRepository.update(id, newSpecialization);

      return await this.specializationRepository.findOneOrFail({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.findById(id);

      await this.specializationRepository.softDelete(id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Success delete specialization',
      };
    } catch (e) {
      throw e;
    }
  }
}
