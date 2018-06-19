import { Readable } from 'stream';
import search from 'bing-image-search-async-iterator';

export default class BingImageSearchStream extends Readable {
  constructor(options) {
    super({ objectMode: true, highWaterMark: 1 });
    this.iterator = search(options);
  }
  async _read() {
    try {
      const result = await this.iterator.next();
      this.push(!result.done ? result.value : null);
    } catch (err) {
      process.nextTick(() => { this.emit('error', err); });
    }
  }
}
