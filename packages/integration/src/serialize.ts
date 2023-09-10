// "borrowed" from vanilla-extract

import { gunzipSync, gzipSync } from "zlib";

// The byte threshold for applying compression, below which compressing would out-weigh its value.
const compressionThreshold = 1000;
const compressionFlag = "#";

export function serializeCss(source: string) {
  if (source.length > compressionThreshold) {
    const compressedSource = gzipSync(source);

    return compressionFlag + compressedSource.toString("base64");
  }

  return Buffer.from(source, "utf-8").toString("base64");
}

export function deserializeCss(source: string) {
  if (source.indexOf(compressionFlag) > -1) {
    const decompressedSource = gunzipSync(
      Buffer.from(source.replace(compressionFlag, ""), "base64")
    );

    return decompressedSource.toString("utf-8");
  }

  return Buffer.from(source, "base64").toString("utf-8");
}
