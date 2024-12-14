import { request } from 'undici';
import { ResponseDataInterface } from '../../../../shared/interfaces/response-data.interface';
import { TranslateResponseInterface } from '../interfaces/translate-response.interface';

export class TranslateService {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const url = 'https://api-free.deepl.com/v2/translate';
    const params = {
      auth_key: this.apiKey,
      text: text,
      source_lang: sourceLang,
      target_lang: targetLang
    };

    try {
      const { body } = await request(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(params)
      });
      return ((await body.json()) as ResponseDataInterface<TranslateResponseInterface>).data.translations[0].text;
    } catch (error) {
      console.error('Error translating text:', error);
      return '';
    }
  }
}