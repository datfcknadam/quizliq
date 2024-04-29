<template>
  <q-page padding class="room-view">
    <q-list bordered>
      <q-item v-for="(client, key) in clients.values()" :key="key" clickable v-ripple>
        <q-item-section avatar>
          <q-icon :color="client.color" name="bluetooth" />
        </q-item-section>
        <q-item-section>{{ client.name }}</q-item-section>
      </q-item>
    </q-list>
    <q-btn color="primary" icon="check" :label="$t('room.start')" @click="startGame" />
  </q-page>
</template>

<script setup>
import { useGcStore } from '@/stores/gc';
import { useGameStore } from '@/stores/game';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

const route = useRoute();
const gcStore = useGcStore();
const gameStore = useGameStore();

gcStore.joinRoom(route.params.id);

const { clients } = storeToRefs(gcStore);
function startGame() {
  gameStore.startGame(route.params.id);
}
</script>
