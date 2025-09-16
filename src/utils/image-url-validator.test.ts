import { describe, test, expect } from "vitest";

import { isAllowedImageUrl } from "./image-url-validator";

// テスト用のモックremotePatterns
const mockNextImageConfig = {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "example.com",
      port: "",
      pathname: "/**",
    },
    {
      hostname: "cdn.example.com",
      pathname: "/images/**",
    },
    {
      protocol: "https",
      hostname: "api.example.com",
      port: "443",
      pathname: "/v1/images/*",
    },
  ],
};

const emptyConfig = {
  remotePatterns: [],
};

// まだ実装されていないisAllowedImageUrl関数をテスト
// この段階では関数が存在しないので失敗する
describe("isAllowedImageUrl", () => {
  test("should allow internal URLs with same origin", () => {
    const result = isAllowedImageUrl("/internal/image.jpg", "https://napochaan.com", mockNextImageConfig);
    expect(result).toBe(true);
  });

  test("should allow URLs matching hostname pattern", () => {
    const result = isAllowedImageUrl(
      "https://example.com/any/path/image.jpg",
      "https://napochaan.com",
      mockNextImageConfig,
    );
    expect(result).toBe(true);
  });

  test("should allow URLs matching hostname and pathname pattern", () => {
    const result = isAllowedImageUrl(
      "https://cdn.example.com/images/photo.jpg",
      "https://napochaan.com",
      mockNextImageConfig,
    );
    expect(result).toBe(true);
  });

  test("should reject URLs not matching pathname pattern", () => {
    const result = isAllowedImageUrl(
      "https://cdn.example.com/videos/movie.mp4",
      "https://napochaan.com",
      mockNextImageConfig,
    );
    expect(result).toBe(false);
  });

  test("should allow URLs matching protocol, hostname and port", () => {
    const result = isAllowedImageUrl(
      "https://api.example.com:443/v1/images/thumb.jpg",
      "https://napochaan.com",
      mockNextImageConfig,
    );
    expect(result).toBe(true);
  });

  test("should reject URLs with wrong port", () => {
    const result = isAllowedImageUrl(
      "https://api.example.com:8080/v1/images/thumb.jpg",
      "https://napochaan.com",
      mockNextImageConfig,
    );
    expect(result).toBe(false);
  });

  test("should reject URLs not in remotePatterns", () => {
    const result = isAllowedImageUrl("https://malicious.com/image.jpg", "https://napochaan.com", mockNextImageConfig);
    expect(result).toBe(false);
  });

  test("should reject all URLs when remotePatterns is empty", () => {
    const result = isAllowedImageUrl("https://example.com/image.jpg", "https://napochaan.com", emptyConfig);
    expect(result).toBe(false);
  });

  test("should handle invalid URLs gracefully", () => {
    const result = isAllowedImageUrl("http://[invalid-ipv6", "https://napochaan.com", mockNextImageConfig);
    expect(result).toBe(false);
  });

  test("should allow absolute URLs with same origin", () => {
    const result = isAllowedImageUrl(
      "https://napochaan.com/images/photo.jpg",
      "https://napochaan.com",
      mockNextImageConfig,
    );
    expect(result).toBe(true);
  });
});
