/**
 * quizliq service
 */

import { factories } from '@strapi/strapi';
import { ApiQuizliqQuizliq } from '../../../../types/generated/contentTypes';

export default factories.createCoreService('api::quizliq.quizliq', ({ strapi}) => ({
  async getRandom(locale?: ApiQuizliqQuizliq['attributes']) {
    return strapi.db.connection('quizliqs').select('*')
      .where(function () {
        return locale && this.where('locale', locale)
      })
      .orderByRaw('RANDOM()')
      .first()
  },
}));
