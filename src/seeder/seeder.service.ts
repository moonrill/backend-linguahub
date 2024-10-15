import { Coupon } from '#/coupon/entities/coupon.entity';
import { Event } from '#/event/entities/event.entity';
import { Language } from '#/language/entities/language.entity';
import { Role } from '#/role/entities/role.entity';
import { Specialization } from '#/specialization/entities/specialization.entity';
import { TranslatorLanguages } from '#/translator/entities/translator-languages.entity';
import { TranslatorSpecializations } from '#/translator/entities/translator-specializations.entity';
import { Translator } from '#/translator/entities/translator.entity';
import { UserDetail } from '#/users/entities/user-detail.entity';
import { User } from '#/users/entities/user.entity';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral';
import { couponMasterData } from './data/coupon';
import { eventMasterData } from './data/event';
import { languageMasterData } from './data/language';
import { roleMasterData } from './data/role';
import { specializationMasterData } from './data/specialization';
import { translatorMasterData } from './data/translator';
import { userMasterData } from './data/user';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private logger = new Logger(SeederService.name);

  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  private async insertIfNotExist<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>,
    data: Entity[],
  ) {
    for (const datas of data) {
      const existingRecord = await this.dataSource.manager.findOne(entity, {
        where: datas,
      });

      if (!existingRecord) {
        await this.dataSource
          .createQueryBuilder()
          .insert()
          .into(entity)
          .values(datas)
          .execute();
      }
    }
  }

  private async seedUser() {
    const roleRepository = this.dataSource.getRepository(Role);
    const userRepository = this.dataSource.getRepository(User);

    for (const user of userMasterData) {
      const role = await roleRepository.findOneBy({ name: user.role });

      if (!role) {
        this.logger.warn(`Role ${user} not found for user ${user.email}`);
        continue;
      }

      const existingUser = await userRepository.findOne({
        where: { email: user.email },
      });

      if (!existingUser) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(user.password, salt);

        const newUser = new User();

        newUser.id = user.id;
        newUser.email = user.email;
        newUser.password = hashedPassword;
        newUser.salt = salt;
        newUser.role = role;

        await userRepository.insert(newUser);

        this.logger.log(`Created user ${user.email} with role ${user.role}`);
      }
    }
  }

  private async seedTranslators() {
    const userRepository = this.dataSource.getRepository(User);
    const userDetailRepository = this.dataSource.getRepository(UserDetail);
    const languageRepository = this.dataSource.getRepository(Language);
    const specializationRepository =
      this.dataSource.getRepository(Specialization);
    const translatorRepository = this.dataSource.getRepository(Translator);
    const translatorLanguagesRepository =
      this.dataSource.getRepository(TranslatorLanguages);
    const translatorSpecializationsRepository = this.dataSource.getRepository(
      TranslatorSpecializations,
    );

    for (const translator of translatorMasterData) {
      const isExists = await translatorRepository.findOneBy({
        id: translator.id,
      });

      if (!isExists) {
        const user = await userRepository.findOneBy({ id: translator.userId });

        const newUserDetail = new UserDetail();

        newUserDetail.profilePicture = translator.profilePicture;
        newUserDetail.fullName = translator.fullName;
        newUserDetail.gender = translator.gender;
        newUserDetail.dateOfBirth = translator.dateOfBirth;
        newUserDetail.phoneNumber = translator.phoneNumber;
        newUserDetail.province = translator.province;
        newUserDetail.city = translator.city;
        newUserDetail.district = translator.district;
        newUserDetail.subDistrict = translator.subDistrict;
        newUserDetail.street = translator.street;

        await userDetailRepository.insert(newUserDetail);

        user.userDetail = newUserDetail;

        userRepository.update(user.id, user);

        const newTranslator = new Translator();

        newTranslator.id = translator.id;
        newTranslator.user = user;
        newTranslator.yearsOfExperience = translator.yearsOfExperience;
        newTranslator.portfolioLink = translator.portfolioLink;
        newTranslator.bank = translator.bank;
        newTranslator.bankAccountNumber = translator.bankAccountNumber;
        newTranslator.rating = translator.rating;
        newTranslator.reviewsCount = translator.reviewsCount;
        newTranslator.status = translator.status;
        newTranslator.bio = translator.bio;

        user.translator = newTranslator;

        userRepository.update(user.id, user);

        await translatorRepository.insert(newTranslator);

        for (const languageId of translator.languages) {
          const language = await languageRepository.findOneBy({
            id: languageId,
          });

          const newTranslatorLanguage = new TranslatorLanguages();

          newTranslatorLanguage.language = language;
          newTranslatorLanguage.translator = newTranslator;

          await translatorLanguagesRepository.insert(newTranslatorLanguage);
        }

        for (const specializationId of translator.specializations) {
          const specialization = await specializationRepository.findOneBy({
            id: specializationId,
          });

          const newTranslatorSpecialization = new TranslatorSpecializations();

          newTranslatorSpecialization.specialization = specialization;
          newTranslatorSpecialization.translator = newTranslator;

          await translatorSpecializationsRepository.insert(
            newTranslatorSpecialization,
          );
        }
      }
    }
  }

  private async seedCoupons() {
    const eventRepository = this.dataSource.getRepository(Event);
    const couponRepository = this.dataSource.getRepository(Coupon);

    for (const couponData of couponMasterData) {
      const event = await eventRepository.findOne({
        where: { id: couponData.event },
      });

      const coupon = new Coupon();

      coupon.name = couponData.name;
      coupon.description = couponData.description;
      coupon.discountPercentage = couponData.discountPercentage;
      coupon.status = couponData.status;
      coupon.expiredAt = couponData.expiredAt;
      coupon.event = event;

      const existingCoupon = await couponRepository.findOne({
        where: { name: coupon.name },
      });

      if (!existingCoupon) {
        await couponRepository.insert(coupon);

        this.logger.log(`Created coupon ${coupon.name}`);
      }
    }
  }

  async seeder() {
    await this.insertIfNotExist(Role, roleMasterData);
    await this.insertIfNotExist(Language, languageMasterData);
    await this.insertIfNotExist(Specialization, specializationMasterData);
    await this.insertIfNotExist(Event, eventMasterData);
    await this.seedUser();
    await this.seedCoupons();
    await this.seedTranslators();
  }

  async onApplicationBootstrap() {
    if (this.configService.get('env') === 'development') {
      await this.seeder();
      this.logger.log('Seeder run successfully');
    }
  }
}
