<template>
  <q-page padding :style-fn="styleFn" class="game-view">
    Игра началась
    <b v-show="gameStore.isActiveUser">Твой ход</b>
    <CheckboxSvgMap
      :value="flatSelectedLocations"
      :map="getMap"
      :style="mapStyle"
      class="game-view__map"
      @add="gameStore.selectPosition"
      @remove="gameStore.selectPosition"
      @focus="gameStore.focusLocation"
      @blur="gameStore.blurLocation"
    />
    <q-dialog
      model-value
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
              :size="client.id === activeUserId ? 'lg' : 'md'"
              :disable="client.id !== activeUserId"
              glossy
            >
              {{ client.name }}
              <span
                v-if="client.id === socket.id"
                v-text="$t('game.isYou')"
                class="q-ml-xs"
              />
            </q-btn>
          </q-btn-group>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import MapLocations from '@quizliq-maps/usa-half';
import { CheckboxSvgMap } from 'vue3-svg-map';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useGameStore } from '@/stores/game';
import { useGcStore } from '@/stores/gc';
import { socket } from '@/socket';

const gameStore = useGameStore();
const gcStore = useGcStore();
const route = useRoute();
const { flatSelectedLocations, activeUserId, isActiveUser, getMap } = storeToRefs(gameStore);
const { clients } = storeToRefs(gcStore);
gameStore.setMap(MapLocations);

function styleFn(offset) {
  return {
    width: offset ? `calc(100vw - ${offset}px)` : '100vw',
    height: offset ? `calc(100vh - ${offset}px)` : '100vh',
  };
}
const mapStyle = computed(() => {
  const style = {};
  if (!isActiveUser.value) {
    style.cursor = 'not-allowed';
  }
  return style;
});

if (!gcStore.inRoom) {
  gcStore.joinRoom(route.params.id);
}
</script>
<style lang="sass">
.game-view 
  display: inline-flex
  .fill
    &-red
      fill: $red
    &-orange
      fill: $orange
    &-yellow
      fill: $yellow
    &-green
      fill: $green
    &-blue
      fill: $blue
    &-indigo
      fill: $indigo
    &-purple
      fill: $purple
</style>
