<template>
  <q-page padding :style-fn="styleFn" class="game-view">
    Игра началась
    <b v-show="gameStore.isActiveUser">Твой ход</b>
    <CheckboxSvgMap
      :value="selectedLocations"
      :map="usa"
      class="game-view__map"
      @add="gameStore.selectPosition"
      @remove="gameStore.selectPosition"
      @focus="gameStore.focusLocation"
      @blur="gameStore.blurLocation"
    />
    <q-dialog
      :model-value="true"
      no-focus
      full-width
      persistent
      square
      no-backdrop-dismiss
      no-esc-dismiss
      seamless
      position="bottom"
    >
      <q-card>
        <q-card-section horizontal>
          <q-btn-group outline>
            <q-btn
              v-for="(client, key) in clients.values()"
              :color="client.color"
              :key="key"
              :disable="client.id !== activeUserId"
              glossy
            >
              {{ client.name }}
            </q-btn>
          </q-btn-group>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useGameStore } from '@/stores/game';
import { useGcStore } from '@/stores/gc';
import { CheckboxSvgMap } from 'vue3-svg-map';
import { useRoute } from 'vue-router';

import usa from '@svg-maps/usa';

const gameStore = useGameStore();
const gcStore = useGcStore();
const route = useRoute();

function styleFn(offset) {
  return {
    width: offset ? `calc(100vw - ${offset}px)` : '100vw',
    height: offset ? `calc(100vh - ${offset}px)` : '100vh',
  };
}

if (!gcStore.inRoom) {
  gcStore.joinRoom(route.params.id);
}

const { selectedLocations, activeUserId } = storeToRefs(gameStore);
const { clients } = storeToRefs(gcStore);
</script>
<style scoped>
.game-view {
  display: inline-flex;
}
</style>
