<template>
  <q-page padding class="bg-secondary">
    <q-img src="logo.svg" width="500px"/>
    <q-card bordered class="create-room bg-secondary float-right">
      <q-card-section class="text-white">
        <div class="text-h6">text</div>
        <div class="text-subtitle2">text</div>
      </q-card-section>
      <q-card-actions>
        <q-btn :label="$t('home.createRoom')" color="primary" @click="createRoom" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { useGcStore } from '@/stores/gc';

const gcStore = useGcStore();
function createRoom() {
  gcStore.createRoom();
}
</script>
