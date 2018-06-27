import { Readable } from 'stream';
import search from 'bing-image-search-async-iterator';

export default class BingImageSearchStream extends Readable {
  constructor(options) {
    super({ objectMode: true, highWaterMark: 1 });
    this.iterator = search(options);
    if (this.iterator == null) {
      throw new Error('failed to create iterator');
    } else if (this.iterator.next !== 'function') {
      throw new Error('iterator is missing next();');
    }
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
