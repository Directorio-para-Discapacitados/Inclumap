import { Controller, Post, UseGuards } from '@nestjs/common';
import { SuggestionScheduler } from './suggestion.scheduler';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Testing')
@Controller('test')
export class TestSchedulerController {
  constructor(private readonly suggestionScheduler: SuggestionScheduler) {}

  @Post('trigger-suggestion')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ejecutar manualmente la sugerencia semanal (solo para testing)' })
  async triggerSuggestion() {
    await this.suggestionScheduler.executeSuggestionManually();
    return { message: 'Sugerencia ejecutada manualmente' };
  }
}
