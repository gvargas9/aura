module.exports = {
  ci: {
    collect: {
      url: [
        "https://aura.inspiration-ai.com/",
        "https://aura.inspiration-ai.com/products",
        "https://aura.inspiration-ai.com/build-box",
        "https://aura.inspiration-ai.com/auth/login",
        "https://aura.inspiration-ai.com/b2b",
      ],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:accessibility": ["error", { minScore: 0.85 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 3000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 500 }],
        "interactive": ["warn", { maxNumericValue: 5000 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
