import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { DataSource } from 'typeorm';
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral';
import { ConfigService } from '@nestjs/config';
import { User } from '#/users/entities/user.entity';
import { userMasterData } from '#/seeder/data/user';

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
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(entity)
      .values(data)
      .orIgnore()
      .execute();
  }

  private async updateOrInsert<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>,
    data: Entity[],
  ) {
    for (const datum of data) {
      await this.dataSource.manager.upsert(entity, datum, ['id']);
    }
  }

  async seeder() {
    await this.updateOrInsert(User, userMasterData);
  }

  async onApplicationBootstrap() {
    if (this.configService.get('env') === 'development') {
      await this.seeder();
      this.logger.log('Seeder run successfully');
    }
  }
}
