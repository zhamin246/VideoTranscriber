export interface Veo3FastRequest {
  imageUrl?: string; // 改为可选参数
  prompt: string;
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
  audio?: boolean;
  promptRewriting?: boolean;
}

export interface Veo3FastResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

export class Veo3FastService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.replicate.com/v1';

  constructor() {
    this.apiKey = process.env.REPLICATE_API_TOKEN || '';
    if (!this.apiKey) {
      throw new Error('REPLICATE_API_TOKEN is required');
    }
  }

  async generateVideo(request: Veo3FastRequest): Promise<Veo3FastResponse> {
    try {
      const prediction = await this.createPrediction(request);
      const result = await this.pollPrediction(prediction.id);
      
      return {
        success: true,
        videoUrl: result.output
      };
    } catch (error) {
      console.error('Veo3Fast generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async createPrediction(request: Veo3FastRequest) {
    const response = await fetch(`${this.baseUrl}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "google/veo-3-fast", // 使用正确的模型版本
        input: {
          prompt: request.prompt,
          duration: request.duration || 8,
          resolution: request.resolution || "720p",
          aspect_ratio: request.aspectRatio || "16:9",
          audio: request.audio !== false,
          prompt_rewriting: request.promptRewriting !== false,
          // 只有在有图片时才添加 image_url
          ...(request.imageUrl && { image_url: request.imageUrl })
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API error:', errorText);
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private async pollPrediction(predictionId: string) {
    const maxAttempts = 60;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.statusText}`);
      }

      const prediction = await response.json();

      if (prediction.status === 'succeeded') {
        return prediction;
      } else if (prediction.status === 'failed') {
        throw new Error(`Prediction failed: ${prediction.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Prediction timeout');
  }
}
