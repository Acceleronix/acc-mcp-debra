/**
 * Google API Key Manager with rotation and error handling
 */

interface ApiKeyStatus {
  key: string;
  isActive: boolean;
  errorCount: number;
  lastError?: Date;
  lastUsed?: Date;
  isQuotaExhausted?: boolean;
}

class GoogleKeyManager {
  private keys: ApiKeyStatus[] = [];
  private currentIndex = 0;
  private maxErrorThreshold = 3;
  private cooldownPeriod = 5 * 60 * 1000; // 5 minutes
  private quotaCooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours for quota errors

  constructor() {
    this.initializeKeys();
  }

  private initializeKeys() {
    // Get keys from environment variables
    const keyVariables = [
      "GOOGLE_GENERATIVE_AI_API_KEY",
      "GOOGLE_GENERATIVE_AI_API_KEY_2",
      "GOOGLE_GENERATIVE_AI_API_KEY_3",
      "GOOGLE_GENERATIVE_AI_API_KEY_4",
      "GOOGLE_GENERATIVE_AI_API_KEY_5",
      "GOOGLE_GENERATIVE_AI_API_KEY_6",
      "GOOGLE_GENERATIVE_AI_API_KEY_7",
      "GOOGLE_GENERATIVE_AI_API_KEY_8",
      "GOOGLE_GENERATIVE_AI_API_KEY_9",
      "GOOGLE_GENERATIVE_AI_API_KEY_10",
    ];

    this.keys = keyVariables
      .map((varName) => process.env[varName])
      .filter((key) => key && key.trim() !== "")
      .map((key) => ({
        key: key!,
        isActive: true,
        errorCount: 0,
      }));

    if (this.keys.length === 0) {
      console.warn("No Google API keys found in environment variables");
    }

    console.log(
      `Initialized Google Key Manager with ${this.keys.length} API keys`,
    );
  }

  /**
   * Get the next available API key
   */
  getApiKey(): string | null {
    if (this.keys.length === 0) {
      return null;
    }

    // First, try to find an active key starting from current index
    let attempts = 0;
    while (attempts < this.keys.length) {
      const keyStatus = this.keys[this.currentIndex];

      // Check if key is active or if cooldown period has passed
      if (keyStatus.isActive || this.shouldRetryKey(keyStatus)) {
        if (!keyStatus.isActive) {
          // Reactivate key after cooldown
          const cooldownType = keyStatus.isQuotaExhausted
            ? "24h quota cooldown"
            : "error cooldown";
          keyStatus.isActive = true;
          keyStatus.errorCount = 0;
          keyStatus.isQuotaExhausted = false;
          console.log(
            `Reactivated Google API key after ${cooldownType}: ${this.maskKey(keyStatus.key)}`,
          );
        }

        keyStatus.lastUsed = new Date();
        const selectedKey = keyStatus.key;

        // Move to next key for next request
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;

        return selectedKey;
      }

      // Move to next key
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      attempts++;
    }

    // No active keys available
    console.error("All Google API keys are suspended or have errors");
    return null;
  }

  /**
   * Report an error for the currently used key
   */
  reportError(apiKey: string, error: any) {
    const keyStatus = this.keys.find((k) => k.key === apiKey);
    if (!keyStatus) {
      return;
    }

    keyStatus.errorCount++;
    keyStatus.lastError = new Date();

    const errorMessage = error?.message || error?.toString() || "Unknown error";
    console.warn(
      `Error with Google API key ${this.maskKey(apiKey)}: ${errorMessage} (Error count: ${keyStatus.errorCount})`,
    );

    // Check if this is a quota error
    if (this.isQuotaError(error)) {
      keyStatus.isActive = false;
      keyStatus.isQuotaExhausted = true;
      console.error(
        `Google API key quota exhausted (24h cooldown): ${this.maskKey(apiKey)}`,
      );
    } else if (this.isPermanentError(error)) {
      keyStatus.isActive = false;
      console.error(`Google API key suspended: ${this.maskKey(apiKey)}`);
    } else if (keyStatus.errorCount >= this.maxErrorThreshold) {
      // Temporarily deactivate key
      keyStatus.isActive = false;
      console.warn(
        `Temporarily deactivating Google API key due to errors: ${this.maskKey(apiKey)}`,
      );
    }
  }

  /**
   * Check if error indicates quota exhaustion
   */
  private isQuotaError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || "";
    const errorCode = error?.code || error?.status;

    return (
      errorMessage.includes("exceeded your current quota") ||
      errorMessage.includes("quota exceeded") ||
      errorMessage.includes("resource exhausted") ||
      errorCode === 429
    );
  }

  /**
   * Check if error indicates permanent key issues
   */
  private isPermanentError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || "";
    const errorCode = error?.code || error?.status;

    return (
      errorMessage.includes("suspended") ||
      errorMessage.includes("permission denied") ||
      errorMessage.includes("api key not valid") ||
      errorMessage.includes("invalid api key") ||
      errorCode === 403 ||
      errorCode === 401
    );
  }

  /**
   * Check if enough time has passed to retry a deactivated key
   */
  private shouldRetryKey(keyStatus: ApiKeyStatus): boolean {
    if (keyStatus.isActive) {
      return false;
    }

    if (!keyStatus.lastError) {
      return true;
    }

    // Use 24-hour cooldown for quota exhausted keys, otherwise use regular cooldown
    const cooldownTime = keyStatus.isQuotaExhausted
      ? this.quotaCooldownPeriod
      : this.cooldownPeriod;
    return Date.now() - keyStatus.lastError.getTime() > cooldownTime;
  }

  /**
   * Mask API key for logging
   */
  private maskKey(key: string): string {
    if (key.length <= 8) {
      return "*".repeat(key.length);
    }
    return (
      key.substring(0, 4) +
      "*".repeat(key.length - 8) +
      key.substring(key.length - 4)
    );
  }

  /**
   * Get status of all keys (for debugging)
   */
  getStatus() {
    return {
      totalKeys: this.keys.length,
      activeKeys: this.keys.filter((k) => k.isActive).length,
      currentIndex: this.currentIndex,
      keys: this.keys.map((k) => ({
        key: this.maskKey(k.key),
        isActive: k.isActive,
        errorCount: k.errorCount,
        lastError: k.lastError,
        lastUsed: k.lastUsed,
        isQuotaExhausted: k.isQuotaExhausted,
      })),
    };
  }
}

// Singleton instance
const googleKeyManager = new GoogleKeyManager();

export { googleKeyManager };
