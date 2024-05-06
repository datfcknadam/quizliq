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
      ctx.response.status = 201;
      return;
    },
    async getRandom(ctx) {
      const random = await strapi.service('api::quizliq.quizliq').getRandom(ctx.query.locale);
      ctx.response.body = { data: random };
      ctx.response.status = 200;
      return;
    },
  }),
);
