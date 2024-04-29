<template>
  <q-page padding>
    <q-btn :label="$t('home.createRoom')" color="primary" @click="createRoom" />
  </q-page>
</template>

<script setup>
import { useGcStore } from '@/stores/gc';

const gcStore = useGcStore();
function createRoom() {
  gcStore.createRoom();
}
</script>
