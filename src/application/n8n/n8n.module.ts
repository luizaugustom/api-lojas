import { Module } from '@nestjs/common';
import { N8nService } from './n8n.service';
import { N8nController } from './n8n.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [N8nService],
  controllers: [N8nController],
  exports: [N8nService],
})
export class N8nModule {}
