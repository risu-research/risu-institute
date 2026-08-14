/**
 * Public-safe, exact UTF-8 application-body captures from the frozen Phase 3 run.
 * Q and Q-prime are intentionally separate observations.
 */

const context = Object.freeze({
  applicationId: "latency",
  index: "bestbuy",
  credentialFingerprint: "a46d4e0bff97a653de3a9c0ecd9ba874902c13d7dbd45a3720b6d86d44d3cc27",
});

const ordinaryRequest = '{"enableABTest":false,"enableRules":false,"query":"risu-nrw-017a2d4235319959bbc7d882fd070306","typoTolerance":false}';
const ordinaryResponse = '{"hits":[],"nbHits":0,"page":0,"nbPages":0,"hitsPerPage":20,"exhaustiveNbHits":true,"exhaustive":{"nbHits":true},"query":"risu-nrw-017a2d4235319959bbc7d882fd070306","params":"enableABTest=false&enableRules=false&query=risu-nrw-017a2d4235319959bbc7d882fd070306&typoTolerance=false","queryID":"ffc8cfb9165bb001db2ed43c157721ea","_automaticInsights":true,"renderingContent":{},"extensions":{"queryCategorization":{}},"processingTimeMS":2,"processingTimingsMS":{"_request":{"queue":1,"roundTrip":17},"extensions":1,"total":3},"serverTimeMS":4}';
const verificationRequest = '{"enableABTest":false,"enableRules":false,"getRankingInfo":true,"query":"risu-nrw-017a2d4235319959bbc7d882fd070306","typoTolerance":false}';
const verificationResponse = '{"hits":[],"nbHits":0,"page":0,"nbPages":0,"hitsPerPage":20,"exhaustiveNbHits":true,"exhaustive":{"nbHits":true},"query":"risu-nrw-017a2d4235319959bbc7d882fd070306","params":"enableABTest=false&enableRules=false&getRankingInfo=true&query=risu-nrw-017a2d4235319959bbc7d882fd070306&typoTolerance=false","queryID":"e3bb9ac9cb1602f779c7922576c48bda","_automaticInsights":true,"serverUsed":"s10-use-1.algolia.net","indexUsed":"bestbuy","parsedQuery":"\\"risu nrw 017a2d4235319959bbc7d882fd070306\\"","timeoutCounts":false,"timeoutHits":false,"renderingContent":{},"extensions":{"queryCategorization":{}},"processingTimeMS":1,"processingTimingsMS":{"_request":{"roundTrip":17},"extensions":1,"total":1},"serverTimeMS":2}';

function capture(observationId, bodyText, responseBody) {
  return Object.freeze({
    ...context,
    observationId,
    request: Object.freeze({
      method: "POST",
      url: "https://latency-dsn.algolia.net/1/indexes/bestbuy/query",
      applicationIdHeader: "latency",
      credentialFingerprint: context.credentialFingerprint,
      credentialByteLength: 32,
      bodyText,
    }),
    response: Object.freeze({
      status: 200,
      finalUrl: "https://latency-dsn.algolia.net/1/indexes/bestbuy/query",
      contentType: "application/json; charset=UTF-8",
      bodyText: responseBody,
    }),
  });
}

export const recordedObservations = Object.freeze({
  runId: "20260814T013017406Z-fd070306",
  query: "risu-nrw-017a2d4235319959bbc7d882fd070306",
  ordinary: Object.freeze({
    id: "Q",
    title: "Ordinary observation Q",
    expectedVerdict: "UNKNOWN",
    summary: "HTTP 200 and nbHits=0, but no source-reported effective-index witness.",
    capture: capture(
      "20260814T013017406Z-fd070306-ordinary",
      ordinaryRequest,
      ordinaryResponse,
    ),
  }),
  verification: Object.freeze({
    id: "Q-prime",
    title: "Verification observation Q′",
    expectedVerdict: "WARRANTED_ZERO",
    summary: "A separate observation requests ranking metadata and reports indexUsed=bestbuy.",
    capture: capture(
      "20260814T013017406Z-fd070306-verification",
      verificationRequest,
      verificationResponse,
    ),
  }),
  expectedHashes: Object.freeze({
    ordinaryRequest: "c10d31fde423599306a71fc4949ecbc13a718ee474faffc275d6ad360de13ef0",
    ordinaryResponse: "95c872bb91d41b3ec364beed0a0ff754697cf6ed2d9fbbfe1651ef368226e232",
    verificationRequest: "c9f8db7da22841e20ec68d938488733adc743350d86cb248e30345b6b0e59ccc",
    verificationResponse: "679f5efc1eee0dbd8c4ba191d3fe40cf47e7ae41fd355ce4ff436216ab8d0dd1",
  }),
});
