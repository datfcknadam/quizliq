import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameStateService } from './services/game.state.service';
import { EventModule } from 'src/libs/event/src';
import { GameUserService } from './services/game.user.service';
import { ContentModule } from 'src/libs/content/src';
import { GameQuestionService } from './services/game.question.service';
import { GamePositionService } from './services/game.position.service';

@Module({
  providers: [
    GameService,
    GameStateService,
    GameUserService,
    GameQuestionService,
    GamePositionService,
  ],
  exports: [GameService],
  imports: [EventModule, ContentModule],
})
export default class GameModule {}
