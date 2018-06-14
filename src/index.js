'use strict';

const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('universal-url');
const { Readable } = require('stream');

const apiEndPoint = 'https://api.cognitive.microsoft.com/bing/v7.0/images/search';
const defaultOffset = 0;
const defaultCount = 150;
const defaultAmount = 2000;
const defaultFetchCb = fetch;
const apiKeyHeaderName = 'Ocp-Apim-Subscription-Key';
const clientIDHeaderName = 'X-MSEdge-ClientID';

function filterNulls(obj) {
  return Object.assign(
    ...Object
      .keys(obj)
      .filter(key => obj[key] != null)
      .map(key => ({ [key]: obj[key] })),
  );
}

class BingImageSearchStream extends Readable {
  constructor({ key, query, market, safeSearch, offset, count, amount, fetchCb } = { }) {
    super({ objectMode: true, highWaterMark: 1 });
    this.key = key;
    this.query = query;
    this.market = market;
    this.safeSearch = safeSearch;
    this.offset = offset || defaultOffset;
    this.count = count || defaultCount;
    this.amount = amount || defaultAmount;
    this.fetchCb = fetchCb || defaultFetchCb;
    this.available = this.offset + this.amount;
  }
  _read() {
    const endOffset = Math.min(this.offset + this.amount, this.available);
    if (this.offset < endOffset) {
      const requestUrl = new URL(apiEndPoint);
      const requestParams = filterNulls({
        q:          this.query,
        mkt:        this.market,
        safeSearch: this.safeSearch,
        offset:     this.offset,
        count:      Math.min(this.count, endOffset - this.offset),
      });
      const requestHeaders = filterNulls({
        [apiKeyHeaderName]:   this.key,
        [clientIDHeaderName]: this.clientID,
      });
      requestUrl.search = new URLSearchParams(requestParams);
      const requestOptions = {
        method: 'GET',
        headers: requestHeaders,
      };
      (async () => {
        try {
          const response = await this.fetchCb(requestUrl.toString(), requestOptions);
          const { ok, status, statusText } = response;
          if (!ok) { throw new Error(`HTTP error ${status}: "${statusText}"`); }
          const body = await response.json();
          this.offset = body.nextOffset;
          this.amount -= body.value.length;
          this.available = body.totalEstimatedMatches;
          this.clientID = response.headers.get(clientIDHeaderName);
          this.push(body);
        } catch (err) {
          process.nextTick(() => { this.emit('error', err); });
        }
      })();
    } else {
      this.push(null);
    }
  }
}

module.exports = BingImageSearchStream;
