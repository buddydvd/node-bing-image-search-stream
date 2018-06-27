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
    this.done = false;
  }
  async _read() {
    try {
      const result = await this.iterator.next();
      this.done = result.done;
      this.push(!this.done ? result.value : null);
    } catch (err) {
      process.nextTick(() => { this.emit('error', err); });
    }
  }
  async _destroy(err, cb) {
    let error = err;
    if (!this.done) {
      if (typeof this.iterator.return === 'function') {
        try {
          await this.iterator.return();
        } catch (err2) {
          error = err2;
        }
      }
    }
    cb(error);
  }
}
