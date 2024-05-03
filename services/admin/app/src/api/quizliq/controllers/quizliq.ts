/**
 * quizliq controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController(
  'api::quizliq.quizliq',
  ({ strapi }) => ({
    async bulkCreate(ctx) {
      const { body } = ctx.request;
      await strapi.db.query('api::quizliq.quizliq').createMany({
        data: body,
      });
    },
  }),
);
