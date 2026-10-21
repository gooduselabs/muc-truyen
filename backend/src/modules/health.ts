import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/auth';
@Controller('health')
export class HealthController {
  @Public() @Get() ok() { return { ok: true, name: 'Mực API', version: '0.1.0' }; }
}
