<template>
  <q-dialog :model-value="!!questionState" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm">{{ question.text }}</span>
        <span v-if="time > 0"> {{ time/1000 }}s</span>
      </q-card-section>
      <q-card-actions>
        <div
          v-for="(choicePart, key) in choices"
          :key="key"
          class="q-pb-sm row q-gutter-sm full-width"
        >
          <q-btn
            v-for="(choice, chKey) in choicePart"
            :key="chKey"
            :label="choice.text"
            :color="color(choice.id)"
            :disable="questionState !== QUESTION_STATE.ACTIVE"
            :size="answer === String(choice.id) ? 'xl' : 'md'"
            class="col-grow col-1"
            @click="() => gameStore.setChoice(choice.id)"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useGameStore } from '@/stores/game';
import { useGcStore } from '@/stores/gc';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { QUESTION_STATE } from '../const/game.enum';

const gameStore = useGameStore();
const gcStore = useGcStore();
const { question, questionState, selectedChoice, time, getClientAnswers, answer } = storeToRefs(gameStore);
const { currentClient, clients } = storeToRefs(gcStore);

const color = (choiceId) => {
  return choiceId === selectedChoice.value ? currentClient.value.color : 'grey';
  // todo: make after designs
  // if (questionState.value === QUESTION_STATE.WAIT_OTHER) {
  //   return choice.id === selectedChoice ? [currentClient.color] : ['grey'];
  // }
  // if (questionState.value === QUESTION_STATE.ONLY_SHOW) {
  //   return getClientAnswers.value.get(choiceId)?.map(it => it.color)
  // }
  // return 'grey'
};

const choices = computed(() => {
  return [question.value.choices?.slice(0, 2), question.value.choices?.slice(2, 4)];
});
</script>