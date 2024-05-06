import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { StateService } from './fsm.service';
import { EventModule } from 'src/libs/event/src';
import { GameUserService } from './game.user.service';
import { ContentModule } from 'src/libs/content/src';
import { GameQuestionService } from './game.question.service';

@Module({
  providers: [GameService, StateService, GameUserService, GameQuestionService],
  exports: [GameService],
  imports: [EventModule, ContentModule],
})
export default class GameModule {}
