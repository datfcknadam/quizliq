export default {
  routes: [
    {
      method: 'POST',
      path: '/quizliqs/bulk-create',
      handler: 'quizliq.bulkCreate'
    },
    {
      method: 'GET',
      path: '/quizliqs/random',
      handler: 'quizliq.getRandom',
      policies: ['plugin::users-permissions.isAuthenticated'],
    }
  ]
}