<template>
  <q-layout view="lHh lpr lFf" class="shadow-2 rounded-borders">
    <q-header elevated bordered>
      <q-toolbar class="bg-primary glossy">
        <q-avatar>
         <img src="logo.svg">
        </q-avatar>
        <q-toolbar-title>Quizliq</q-toolbar-title>
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
