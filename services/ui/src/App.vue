<template>
  <q-layout view="hHh lpR fff">
    <q-header bordered class="bg-grey-3 text-primary">
      <q-toolbar>
        <q-toolbar-title> Quizliq </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useConnectionStore } from '@/stores/connection';
import { socket } from '@/socket';

const connectionStore = useConnectionStore();
socket.off();
connectionStore.bindEvents();
</script>
