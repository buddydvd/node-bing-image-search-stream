# Node.js Bing Image Search Stream
Query Bing Image Search API ([v7](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference)) and return results as a readable stream of response objects.

## Motivation
[Bing Image Search API](https://azure.microsoft.com/en-us/services/cognitive-services/bing-image-search-api/) returns up to [150](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#count) results per API call. To access more results, you need to specify the proper [`offset`](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#offset) request parameter in a subsequent API call. This module automates the process of filling the [`offset`](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#offset) parameter value and determines when to stop making API calls— what you get in the end is a readable stream of parsed responses.

## Response objects
Please note that the result objects returned by the stream wrap search search results in the [`value`](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#images-value) field.

```JS
{
  _type: 'Images',
  totalEstimatedMatches: 834,
  nextOffset: 195,
  value: [
    {
      name: ...,
      thumbnailUrl: ...,
      datePublished: ...,
      contentUrl: ...,
      ...
    },
    ...
  ],
  ...
}
```

This module doesn't unwrap search results for you because response objects may contain additional metadata (e.g., [`queryExpansions`](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#queryexpansions), [`pivotSuggestions`](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#pivotsuggestions), [`similarTerms`](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#similarterms) and [`relatedSearches`](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#caption-relatedsearches)).

## Installation
```
npm install --save bing-image-search-stream
```

## Example Usage

Here's an example the calculating the total number of search results.

```js
const BingImageSearchStream = require('bing-image-search-stream');

let responses = [];
new BingImageSearchStream({
  key:'<YOUR_BING_IMAGE_SEARCH_API_SUBSRIPTION_KEY>',
  query: 'kittens',
  amount: 151,
}).on('data', (data) => {
  responses.push(data);
}).on('end', () => {
  const total = responses.reduce((acc, result) => acc + result.value.length, 0);
  console.log('total: ', total);
});
```

This example takes advantage of Node.js 10's experimental support for [asynchronously iterating over readable streams](http://2ality.com/2018/04/async-iter-nodejs.html) to print out search results to the console.

```js
const BingImageSearchStream = require('bing-image-search-stream');

(async () => {
  const resultsStream = new BingImageSearchStream({
    key:'<YOUR_BING_IMAGE_SEARCH_API_SUBSRIPTION_KEY>',
    query: 'kittens',
    amount: 151,
  })
  for await (const results of resultsStream) {
    for (const result of results.value) {
      console.log(result);
    }
  }
})();
```

## Options
| Parameter | Type | Default | Description |
| --------- | ---- | ------- | ----------- |
| key | `string` | __(required)__ | [Bing Image Search API](https://azure.microsoft.com/en-us/services/cognitive-services/bing-image-search-api/) Subscription Key |
| query | `string` | __(required)__ | Search [query](https://msdn.microsoft.com/library/ff795620.aspx) |
| amount | `integer` | 2000 | Desired count of results |
| market | `string` | | [*Market Code*](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#market-codes) of request origin (e.g., `en-US`) |
| safeSearch | `string` | `Moderate` | [Filter adult content](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#safesearch) (`Off`, `Moderate`, ``Strict``) |
| offset | `integer` | `0` | [Offset](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#offset) of the initial API call |
| count | `integer` | `150` | [Count](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#count) of results per API call (lower this value may result in more API calls) |
| fetchCb | `function` | [`fetch`](https://github.com/bitinn/node-fetch) | Callback to construct a request that returns a response promise |

## Features

- Turns a search query into a stream of search response objects
- Ends stream when _requested amount is reached_ or _there are no more results_
- [Avoids results overlap](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#offset) by specifying the [`offset`](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#offset) API parameter with previous response's [`nextOffset`](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#nextoffset) value
- Fills in [`X-MSEdge-ClientID`](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/bing-images-api-v7-reference#clientid) automatically based on previous API responses

## License
MIT
