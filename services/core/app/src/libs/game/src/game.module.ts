import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import StateService from './fsm.service';
import { EventModule } from 'src/libs/event/src';
import GameUserService from './game.user.service';

@Module({
  providers: [GameService, StateService, GameUserService],
  exports: [GameService],
  imports: [EventModule],
})
export default class GameModule {}
