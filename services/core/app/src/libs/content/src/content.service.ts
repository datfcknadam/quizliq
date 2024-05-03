import { Inject, Injectable } from '@nestjs/common';
import { API_TOKEN, API_URL } from './const/content.tokens';
import { fetch } from 'undici';

@Injectable()
export class ContentService {
  constructor(
    @Inject(API_TOKEN)
    private readonly apiToken: string,
    @Inject(API_URL)
    private readonly apiUrl: string,
  ) {}

  async findAll() {
    // fetch();
  }
}
