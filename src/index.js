import fetch from 'node-fetch';
import { Readable } from 'stream';

const apiEndPoint = 'https://api.cognitive.microsoft.com/bing/v7.0/images/search';
const defaults = {
  key: null,
  query: null,
  market: null,
  safeSearch: null,
  offset: 0,
  count: 150,
  amount: 2000,
  fetchCb: fetch,
};
const apiKeyHeaderName = 'Ocp-Apim-Subscription-Key';
const clientIDHeaderName = 'X-MSEdge-ClientID';
const acceptHeaderName = 'Accept';
const acceptHeaderValue = 'application/json';

function filterNulls(obj) {
  return Object.assign(
    ...Object
      .keys(obj)
      .filter(key => obj[key] != null)
      .map(key => ({ [key]: obj[key] })),
  );
}

function stringify(obj) {
  return Object.keys(obj)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
    .join('&');
}

async function* search(options) {
  const { key, query, market, safeSearch, offset, count, amount, fetchCb } = Object.assign(
    { },
    defaults,
    options,
  );
  let currOffset = offset;
  let currAmount = amount;
  let available = currOffset + currAmount;
  let clientID = null;

  while (currOffset < Math.min(currOffset + currAmount, available)) {
    const requestParams = filterNulls({
      q: query,
      mkt: market,
      safeSearch,
      offset: currOffset,
      count: Math.min(count, Math.min(currOffset + currAmount, available) - currOffset),
    });
    const requestHeaders = filterNulls({
      [apiKeyHeaderName]:   key,
      [clientIDHeaderName]: clientID,
      [acceptHeaderName]: acceptHeaderValue,
    });
    const requestOptions = {
      method: 'GET',
      headers: requestHeaders,
    };
    const requestUrl = `${apiEndPoint}?${stringify(requestParams)}`;
    const response = await fetchCb(requestUrl, requestOptions);
    const { ok, status, statusText } = response;
    if (!ok) { throw new Error(`HTTP error ${status}: "${statusText}"`); }
    const body = await response.json();
    currOffset = body.nextOffset;
    currAmount -= body.value.length;
    available = body.totalEstimatedMatches;
    clientID = response.headers.get(clientIDHeaderName);
    yield body;
  }
}

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
