import { Inject, Injectable } from '@nestjs/common';
import { API_TOKEN, API_URL } from './const/content.tokens';
import { request } from 'undici';
import * as qs from 'qs';

@Injectable()
export class ContentService {
  constructor(
    @Inject(API_TOKEN)
    private readonly apiToken: string,
    @Inject(API_URL)
    private readonly apiUrl: URL,
  ) {}

  /**
   * Send rate of question
   * @param questionId
   * @param isGood
   */
  async sendRate(questionId: number, isGood: boolean) {
    const { url, headers } = this.buildRequest('question-rates');
    await request(url, {
      headers,
      method: 'POST',
      body: JSON.stringify({
        good: isGood,
        quizliq: questionId,
      }),
    });
  }

  /**
   * Get random question from admin
   * @param locale
   * @returns
   */
  async getRandomQuestion(locale?: string): Promise<{ correct: string }> {
    const { url, headers } = this.buildRequest('quizliqs/random', { locale });
    const { body } = await request(url, {
      headers,
      method: 'GET',
    });
    const { data } = (await body.json()) as { data: { correct: string } };
    return data;
  }

  private buildRequest(
    method = '',
    query: object = {},
  ): {
    url: URL;
    headers: { authorization: string };
  } {
    const url = new URL(
      `api/${method}?${qs.stringify({ ...query, sort: 'id' })}`,
      this.apiUrl,
    );
    const headers = {
      authorization: `Bearer ${this.apiToken}`,
    };
    return {
      url,
      headers,
    };
  }
}
