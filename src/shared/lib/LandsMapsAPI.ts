// lib/LandsMapsAPI.ts
import axios, { AxiosResponse } from 'axios';

// ===== TYPE DEFINITIONS =====
export interface ParcelParams {
  provinceId: number;
  amphurId: string;
  parcelId: number;
}

export interface ParcelResult {
  error: boolean;
  message?: string;
  result: Array<{
    parcel_no: string;
    province_name: string;
    amphur_name: string;
    tambon_name: string;
    village_name?: string;
    owner_name: string;
    area_rai: number;
    area_ngan: number;
    area_wa: number;
    land_type: string;
    [key: string]: any; // สำหรับ fields อื่นๆ ที่อาจมี
  }>;
}

interface AppConfig {
  zenrows: {
    apiUrl: string;
    options: {
      js_render: string;
      premium_proxy: string;
      proxy_country: string;
      custom_headers: string;
    };
  };
  landsmaps: {
    baseUrl: string;
    endpoints: {
      jwt: string;
      parcel: string;
    };
  };
  request: {
    timeout: number;
    maxRetries: number;
    retryDelay: number;
    userAgent: string;
  };
  logging: {
    debug: boolean;
    level: string;
  };
  session: {
    sessionIdRange: number;
    cookieExpiry: number;
  };
}

// ===== LANDSMAPS API CLASS =====
class LandsMapsAPI {
  private apiKey: string;
  private baseUrl: string;
  private cookies: Record<string, string> | null = null;
  private accessToken: string | null = null;
  private sessionId: number | null = null;
  private config: AppConfig;
  private debugMode: boolean;

  constructor(apiKey?: string, configOverrides?: Partial<AppConfig>) {
    // Default configuration
    this.config = {
      zenrows: {
        apiUrl: 'https://api.zenrows.com/v1/',
        options: {
          js_render: 'true',
          premium_proxy: 'true',
          proxy_country: 'TH',
          custom_headers: 'true',
        },
      },
      landsmaps: {
        baseUrl: 'https://landsmaps.dol.go.th',
        endpoints: {
          jwt: '/apiService/JWT/GetJWTAccessToken',
          parcel: '/apiService/LandsMaps/GetParcelByParcelNo',
        },
      },
      request: {
        timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
        maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
        retryDelay: parseInt(process.env.RETRY_DELAY || '2000'),
        userAgent:
          process.env.USER_AGENT ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      logging: {
        debug:
          process.env.NODE_ENV === 'development' ||
          process.env.DEBUG === 'true',
        level: process.env.LOG_LEVEL || 'info',
      },
      session: {
        sessionIdRange: parseInt(process.env.SESSION_ID_RANGE || '10000'),
        cookieExpiry: parseInt(process.env.COOKIE_EXPIRY || '3600000'),
      },
    };

    // Override config ถ้ามี
    if (configOverrides) {
      this.config = this.mergeConfig(this.config, configOverrides);
    }

    // Set API key
    this.apiKey = apiKey || process.env.ZENROWS_API_KEY || '';
    if (!this.apiKey) {
      throw new Error(
        'ZenRows API key is required. Please set ZENROWS_API_KEY environment variable or pass it to constructor.',
      );
    }

    this.baseUrl = this.config.landsmaps.baseUrl;
    this.debugMode = this.config.logging.debug;
  }

  /**
   * Deep merge configuration objects
   */
  private mergeConfig(
    target: AppConfig,
    source: Partial<AppConfig>,
  ): AppConfig {
    const result = { ...target };

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key as keyof AppConfig];
      const targetValue = result[key as keyof AppConfig];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue)
      ) {
        result[key as keyof AppConfig] = {
          ...targetValue,
          ...sourceValue,
        } as any;
      } else if (sourceValue !== undefined) {
        result[key as keyof AppConfig] = sourceValue as any;
      }
    });

    return result;
  }

  /**
   * Debug logging (only shows when debug mode is enabled)
   */
  private debug(message: string, data: any = null): void {
    if (!this.debugMode) return;

    console.log(`[DEBUG] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log('---');
  }

  /**
   * General logging with timestamp
   */
  private log(level: string, message: string, data: any = null): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    if (data && this.debugMode) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Retry mechanism for failed requests
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries?: number,
    delay?: number,
  ): Promise<T> {
    const retries = maxRetries || this.config.request.maxRetries;
    const retryDelay = delay || this.config.request.retryDelay;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        this.log(
          'warn',
          `Attempt ${attempt}/${retries} failed: ${error.message}`,
        );

        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt),
        );
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Extract cookies from ZenRows response headers
   */
  private extractCookies(response: AxiosResponse): Record<string, string> {
    const cookies: Record<string, string> = {};
    const headers = response.headers || {};

    const zrCookies = headers['zr-cookies'] || headers['Zr-Cookies'];
    if (zrCookies) {
      this.debug('Found Zr-Cookies header', zrCookies);
      const cookiePairs = zrCookies.split(';');
      for (const pair of cookiePairs) {
        const [name, value] = pair.trim().split('=');
        if (name && value) {
          cookies[name] = value;
        }
      }
    }
    return cookies;
  }

  /**
   * Convert cookies object to cookie string
   */
  private cookiesToString(cookies: Record<string, string>): string {
    return Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  /**
   * Validate input parameters
   */
  private validateParcelParams(
    provinceId: number | string,
    amphurId: string | number,
    parcelId: number | string,
  ): ParcelParams {
    if (!provinceId || !amphurId || !parcelId) {
      throw new Error('Province ID, Amphur ID, and Parcel ID are required');
    }

    // Validate province ID (should be 1-96)
    const prov = parseInt(String(provinceId));
    if (isNaN(prov) || prov < 1 || prov > 96) {
      throw new Error('Province ID must be between 1-96');
    }

    // Validate parcel ID (should be positive number)
    const parcel = parseInt(String(parcelId));
    if (isNaN(parcel) || parcel <= 0) {
      throw new Error('Parcel ID must be a positive number');
    }

    return {
      provinceId: prov,
      amphurId: String(amphurId).padStart(2, '0'), // Ensure 2-digit format
      parcelId: parcel,
    };
  }

  /**
   * Get error message for HTTP status codes
   */
  private getStatusErrorMessage(status: number): string {
    const statusMessages: Record<number, string> = {
      400: 'Bad Request - คำขอไม่ถูกต้อง',
      401: 'Unauthorized - ไม่มีสิทธิ์เข้าถึง',
      403: 'Forbidden - ถูกปฏิเสธการเข้าถึง',
      404: 'Not Found - ไม่พบข้อมูลที่ร้องขอ',
      429: 'Too Many Requests - คำขอมากเกินไป',
      500: 'Internal Server Error - เซิร์ฟเวอร์เกิดข้อผิดพลาด',
      502: 'Bad Gateway - เกตเวย์เกิดข้อผิดพลาด',
      503: 'Service Unavailable - บริการไม่พร้อมใช้งาน',
      504: 'Gateway Timeout - เกตเวย์หมดเวลา',
    };

    return statusMessages[status] || `Unknown status code: ${status}`;
  }

  /**
   * Step 1: Get initial cookies from landsmaps.dol.go.th
   */
  private async getInitialCookies(): Promise<Record<string, string>> {
    this.log(
      'info',
      'Step 1: Getting initial cookies from landsmaps.dol.go.th',
    );

    return await this.retryRequest(async () => {
      const sessionId = Math.floor(
        Math.random() * this.config.session.sessionIdRange,
      );
      this.sessionId = sessionId;

      const response = await axios({
        url: this.config.zenrows.apiUrl,
        method: 'GET',
        timeout: this.config.request.timeout,
        params: {
          url: this.baseUrl,
          apikey: this.apiKey,
          session_id: sessionId,
          ...this.config.zenrows.options,
        },
      });

      this.debug('Response status', response.status);
      this.debug('Response headers', response.headers);

      const cookies = this.extractCookies(response);
      this.cookies = cookies;

      this.debug('Extracted cookies', cookies);

      if (Object.keys(cookies).length === 0) {
        throw new Error('No cookies found in response');
      }

      this.log(
        'info',
        `Successfully obtained ${Object.keys(cookies).length} cookies`,
      );
      return cookies;
    });
  }

  /**
   * Step 2: Get JWT access token using cookies
   */
  private async getJWTAccessToken(): Promise<any> {
    this.log('info', 'Step 2: Getting JWT access token');

    if (!this.cookies || Object.keys(this.cookies).length === 0) {
      throw new Error('No cookies available. Call getInitialCookies() first.');
    }

    return await this.retryRequest(async () => {
      const cookieString = this.cookiesToString(this.cookies!);
      this.debug('Using cookies', cookieString);

      const jwtUrl = `${this.baseUrl}${this.config.landsmaps.endpoints.jwt}`;

      const response = await axios({
        url: this.config.zenrows.apiUrl,
        method: 'GET',
        timeout: this.config.request.timeout,
        headers: {
          Cookie: cookieString,
          Accept: 'application/json',
          'User-Agent': this.config.request.userAgent,
        },
        params: {
          url: jwtUrl,
          apikey: this.apiKey,
          session_id: this.sessionId,
          ...this.config.zenrows.options,
        },
      });

      this.debug('JWT Response status', response.status);
      this.debug('JWT Response headers', response.headers);

      const responseData = response.data;
      this.debug('JWT Response body', responseData);

      // Parse response data
      let data;
      try {
        data =
          typeof responseData === 'string'
            ? JSON.parse(responseData)
            : responseData;
      } catch (parseError) {
        throw new Error(
          `Failed to parse JWT response as JSON: ${responseData}`,
        );
      }

      // Validate response
      if (data.error) {
        throw new Error(`JWT API returned error: ${data.message}`);
      }

      if (!data.result || !data.result[0] || !data.result[0].access_token) {
        throw new Error('No access token found in JWT response');
      }

      this.accessToken = data.result[0].access_token;
      this.log('info', 'Successfully obtained JWT access token');
      this.debug('Access token', this.accessToken.substring(0, 50) + '...');

      return data;
    });
  }

  /**
   * Step 3: Get parcel information using access token
   */
  private async getParcelInfo(
    provinceId: number,
    amphurId: string,
    parcelId: number,
  ): Promise<ParcelResult> {
    this.log(
      'info',
      `Step 3: Getting parcel information for ${provinceId}/${amphurId}/${parcelId}`,
    );

    if (!this.accessToken) {
      throw new Error(
        'No access token available. Call getJWTAccessToken() first.',
      );
    }

    const parcelUrl = `${this.baseUrl}${this.config.landsmaps.endpoints.parcel}/${provinceId}/${amphurId}/${parcelId}`;
    this.debug('Parcel URL', parcelUrl);

    try {
      const response = await axios({
        url: this.config.zenrows.apiUrl,
        method: 'GET',
        timeout: this.config.request.timeout,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json',
          'User-Agent': this.config.request.userAgent,
        },
        params: {
          url: parcelUrl,
          apikey: this.apiKey,
          session_id: this.sessionId,
          ...this.config.zenrows.options,
        },
      });

      this.debug('Parcel Response status', response.status);
      this.debug('Parcel Response headers', response.headers);

      // Handle different status codes
      if (response.status === 200) {
        let data = response.data;
        this.debug('Parcel Response body', data);

        // Parse response if needed
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (parseError) {
            // Check if blocked by Incapsula
            if (data.includes('Incapsula')) {
              throw new Error('Request blocked by Incapsula protection');
            }
            throw new Error(`Failed to parse parcel response as JSON: ${data}`);
          }
        }

        // Check if API returned error
        if (data.error) {
          throw new Error(`Parcel API returned error: ${data.message}`);
        }

        // Check if result has data
        if (!data.result || data.result.length === 0) {
          throw new Error('ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูล');
        }

        this.log('info', 'Successfully obtained parcel information');
        return data;
      } else {
        // Handle non-200 status codes
        const errorMessage = this.getStatusErrorMessage(response.status);
        this.log('error', `HTTP ${response.status}: ${errorMessage}`);
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }
    } catch (error: any) {
      // Handle axios errors (network, timeout, etc.)
      if (error.response) {
        // Server responded with error status
        const errorMessage = this.getStatusErrorMessage(error.response.status);
        this.log('error', `HTTP ${error.response.status}: ${errorMessage}`);
        throw new Error(`HTTP ${error.response.status}: ${errorMessage}`);
      } else if (error.request) {
        // Request was made but no response received
        this.log('error', 'Network error: No response received');
        throw new Error('Network error: No response received');
      } else {
        // Something else happened
        throw error;
      }
    }
  }

  /**
   * Complete workflow: Get cookies -> JWT token -> Parcel info
   * This is the main public method to use
   */
  async getParcelInfoComplete(
    provinceId: number | string,
    amphurId: string | number,
    parcelId: number | string,
  ): Promise<ParcelResult> {
    try {
      // Validate input parameters
      const validatedParams = this.validateParcelParams(
        provinceId,
        amphurId,
        parcelId,
      );
      this.log(
        'info',
        `Starting complete workflow for Province ${validatedParams.provinceId}, Amphur ${validatedParams.amphurId}, Parcel ${validatedParams.parcelId}`,
      );

      // Execute workflow steps
      await this.getInitialCookies();
      await this.getJWTAccessToken();
      const parcelData = await this.getParcelInfo(
        validatedParams.provinceId,
        validatedParams.amphurId,
        validatedParams.parcelId,
      );

      this.log('info', 'Complete workflow finished successfully');
      return parcelData;
    } catch (error: any) {
      this.log('error', `Complete workflow failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current configuration (for debugging)
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = this.mergeConfig(this.config, newConfig);
    this.debugMode = this.config.logging.debug;
  }
}

export default LandsMapsAPI;
