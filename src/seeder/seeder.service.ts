import { Language } from '#/language/entities/language.entity';
import { Role } from '#/role/entities/role.entity';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral';
import { languageMasterData } from './data/language';
import { roleMasterData } from './data/role';
// import { User } from '#/users/entities/user.entity';
// import { userMasterData } from '#/seeder/data/user';

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

  async seeder() {
    await this.insertIfNotExist(Role, roleMasterData);
    await this.insertIfNotExist(Language, languageMasterData);
  }

  async onApplicationBootstrap() {
    if (this.configService.get('env') === 'development') {
      await this.seeder();
      this.logger.log('Seeder run successfully');
    }
  }
}
