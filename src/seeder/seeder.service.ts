import { Language } from '#/language/entities/language.entity';
import { Role } from '#/role/entities/role.entity';
import { User } from '#/users/entities/user.entity';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral';
import { languageMasterData } from './data/language';
import { roleMasterData } from './data/role';
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
        newUser.email = user.email;
        newUser.password = hashedPassword;
        newUser.salt = salt;
        newUser.role = role;

        await userRepository.insert(newUser);

        this.logger.log(`Created user ${user.email} with role ${user.role}`);
      }
    }
  }

  async seeder() {
    await this.insertIfNotExist(Role, roleMasterData);
    await this.insertIfNotExist(Language, languageMasterData);
    await this.seedUser();
  }

  async onApplicationBootstrap() {
    if (this.configService.get('env') === 'development') {
      await this.seeder();
      this.logger.log('Seeder run successfully');
    }
  }
}
