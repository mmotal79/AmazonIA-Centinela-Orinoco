import { GoogleGenAI } from "@google/genai";

export interface AIModelConfig {
  index: number;
  id: string;
  displayName: string;
  family: string;
  dailyQueryQuota: number;
  dailyQueriesUsed: number;
  estimatedTokensUsed: number;
  status: "ACTIVE" | "AVAILABLE" | "TOKENS_EXHAUSTED" | "QUOTA_EXHAUSTED" | "COOLING_DOWN";
  lastUsedAt?: string;
  lastError?: string;
}

export interface ModelExecutionStep {
  modelId: string;
  displayName: string;
  index: number;
  attemptTimestamp: string;
  status: "SUCCESS" | "FAILED_TOKENS" | "FAILED_QUOTA" | "FAILED_UNAVAILABLE";
  errorMessage?: string;
}

export interface CascadingExecutionResult {
  text: string;
  modelUsed: string;
  modelDisplayName: string;
  modelIndex: number;
  executionSteps: ModelExecutionStep[];
  poolStatus: AIModelConfig[];
  engineType: "gemini_multimodel" | "tactical_contingency";
}

export class AIModelCascadeManager {
  private models: AIModelConfig[];
  private activeModelIndex: number = 0;
  private geminiClient: GoogleGenAI | null = null;
  private lastResetDate: string;
  private globalQuotaCooldownUntil: number = 0;

  constructor() {
    this.lastResetDate = new Date().toISOString().slice(0, 10);
    this.models = [
      {
        index: 0,
        id: "gemini-3.8-flash",
        displayName: "Gemini 3.8 Flash (Modelo Base Principal)",
        family: "Gemini 3.8 Series",
        dailyQueryQuota: 1500,
        dailyQueriesUsed: 0,
        estimatedTokensUsed: 0,
        status: "ACTIVE",
      },
      {
        index: 1,
        id: "gemini-flash-latest",
        displayName: "Gemini Flash Latest (Alias Estable Continuo)",
        family: "Gemini Rolling Alias",
        dailyQueryQuota: 1500,
        dailyQueriesUsed: 0,
        estimatedTokensUsed: 0,
        status: "AVAILABLE",
      },
      {
        index: 2,
        id: "gemini-3.1-flash-lite",
        displayName: "Gemini 3.1 Flash Lite (Baja Latencia / Mínimo Consumo)",
        family: "Gemini 3.1 Series",
        dailyQueryQuota: 1500,
        dailyQueriesUsed: 0,
        estimatedTokensUsed: 0,
        status: "AVAILABLE",
      },
      {
        index: 3,
        id: "gemini-3.1-pro-preview",
        displayName: "Gemini 3.1 Pro (Razonamiento Táctico y STEM)",
        family: "Gemini 3.1 Pro Series",
        dailyQueryQuota: 1000,
        dailyQueriesUsed: 0,
        estimatedTokensUsed: 0,
        status: "AVAILABLE",
      },
    ];
  }

  private checkAndResetDailyQuotas() {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.lastResetDate) {
      console.log(`[AI Multi-Model Manager] Reinicio de cuotas diarias para el día ${today}`);
      this.lastResetDate = today;
      this.models.forEach((m, idx) => {
        m.dailyQueriesUsed = 0;
        m.estimatedTokensUsed = 0;
        m.status = idx === this.activeModelIndex ? "ACTIVE" : "AVAILABLE";
        m.lastError = undefined;
      });
    }
  }

  private getClient(): GoogleGenAI | null {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return this.geminiClient;
  }

  public getModelPoolStatus(): AIModelConfig[] {
    this.checkAndResetDailyQuotas();
    return this.models.map((m, idx) => ({
      ...m,
      status:
        idx === this.activeModelIndex && m.status !== "TOKENS_EXHAUSTED" && m.status !== "QUOTA_EXHAUSTED"
          ? "ACTIVE"
          : m.status,
    }));
  }

  public getActiveModel(): AIModelConfig {
    return this.models[this.activeModelIndex];
  }

  public resetPoolQuotas() {
    this.activeModelIndex = 0;
    this.models.forEach((m, idx) => {
      m.dailyQueriesUsed = 0;
      m.estimatedTokensUsed = 0;
      m.status = idx === 0 ? "ACTIVE" : "AVAILABLE";
      m.lastError = undefined;
    });
    console.log("[AI Multi-Model Manager] Cuotas y modelos reseteados manualmente a modelo 0.");
    return this.getModelPoolStatus();
  }

  /**
   * Ejecución inteligente en cascada:
   * - Si el modelo actual tiene tokens y cuotas disponibles, ejecuta en ese modelo y SE MANTIENE en él.
   * - Si se acaban los tokens o la cuota diaria de ese modelo, avanza secuencialmente al siguiente modelo
   *   del pool de 10 hasta completar la tarea.
   * - Garantiza la disponibilidad del servicio.
   */
  public async executeWithCascadingModels(
    prompt: string,
    systemInstruction?: string,
    formattedContents?: any[]
  ): Promise<CascadingExecutionResult> {
    this.checkAndResetDailyQuotas();
    const executionSteps: ModelExecutionStep[] = [];
    const ai = this.getClient();

    // Si la cuota general está en período de enfriamiento temporal, ir directamente al motor táctico
    const now = Date.now();
    if (this.globalQuotaCooldownUntil > now) {
      throw new Error("GLOBAL_QUOTA_COOLDOWN_ACTIVE");
    }

    const maxModels = this.models.length;
    let attemptsCount = 0;

    while (attemptsCount < maxModels) {
      const currentModel = this.models[this.activeModelIndex];

      // Verificar si el modelo actual ya agotó su cuota de consultas por día
      if (currentModel.dailyQueriesUsed >= currentModel.dailyQueryQuota) {
        currentModel.status = "QUOTA_EXHAUSTED";
        currentModel.lastError = "Límite diario de consultas consumido para este modelo";
        executionSteps.push({
          modelId: currentModel.id,
          displayName: currentModel.displayName,
          index: this.activeModelIndex,
          attemptTimestamp: new Date().toISOString(),
          status: "FAILED_QUOTA",
          errorMessage: "Cuota diaria consumida; rotando al siguiente modelo del pool.",
        });

        this.activeModelIndex = (this.activeModelIndex + 1) % maxModels;
        attemptsCount++;
        continue;
      }

      if (!ai) {
        executionSteps.push({
          modelId: currentModel.id,
          displayName: currentModel.displayName,
          index: this.activeModelIndex,
          attemptTimestamp: new Date().toISOString(),
          status: "FAILED_UNAVAILABLE",
          errorMessage: "GEMINI_API_KEY no configurada en el entorno.",
        });
        break;
      }

      try {
        const contents =
          formattedContents && formattedContents.length > 0
            ? formattedContents
            : [{ role: "user", parts: [{ text: prompt }] }];

        const config: any = {};
        if (systemInstruction) {
          config.systemInstruction = systemInstruction;
        }

        const callPromise = ai.models.generateContent({
          model: currentModel.id,
          contents,
          config: Object.keys(config).length > 0 ? config : undefined,
        });

        let timer: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("MODEL_TIMEOUT_8S")), 8000);
        });

        const response: any = await Promise.race([callPromise, timeoutPromise]).finally(() => {
          clearTimeout(timer);
        });

        if (response && response.text) {
          currentModel.dailyQueriesUsed += 1;
          const tokensEst = Math.ceil((prompt.length + response.text.length) / 4);
          currentModel.estimatedTokensUsed += tokensEst;
          currentModel.lastUsedAt = new Date().toISOString();
          currentModel.status = "ACTIVE";
          currentModel.lastError = undefined;

          // Marcar los demás modelos no agotados como disponibles
          this.models.forEach((m, idx) => {
            if (idx !== this.activeModelIndex && m.status !== "TOKENS_EXHAUSTED" && m.status !== "QUOTA_EXHAUSTED") {
              m.status = "AVAILABLE";
            }
          });

          executionSteps.push({
            modelId: currentModel.id,
            displayName: currentModel.displayName,
            index: this.activeModelIndex,
            attemptTimestamp: new Date().toISOString(),
            status: "SUCCESS",
          });

          return {
            text: response.text,
            modelUsed: currentModel.id,
            modelDisplayName: currentModel.displayName,
            modelIndex: this.activeModelIndex,
            executionSteps,
            poolStatus: this.getModelPoolStatus(),
            engineType: "gemini_multimodel",
          };
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isQuotaOrTokens =
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("quota") ||
          errMsg.includes("tokens") ||
          errMsg.includes("rate limit") ||
          errMsg.includes("limit exceeded");

        // Si la clave de API global agotó su cuota por minuto/hora, activar enfriamiento por 30s
        if (isQuotaOrTokens) {
          this.globalQuotaCooldownUntil = Date.now() + 30000;
        }

        currentModel.status = isQuotaOrTokens ? "TOKENS_EXHAUSTED" : "COOLING_DOWN";
        currentModel.lastError = errMsg.slice(0, 160);

        executionSteps.push({
          modelId: currentModel.id,
          displayName: currentModel.displayName,
          index: this.activeModelIndex,
          attemptTimestamp: new Date().toISOString(),
          status: isQuotaOrTokens ? "FAILED_TOKENS" : "FAILED_UNAVAILABLE",
          errorMessage: isQuotaOrTokens ? "Límite de cuota del proveedor de IA alcanzado" : errMsg.slice(0, 120),
        });

        this.activeModelIndex = (this.activeModelIndex + 1) % maxModels;
        attemptsCount++;

        // Si la cuota del proyecto está saturada (429 global), cortar el ciclo inmediatamente hacia el motor de contingencia
        if (isQuotaOrTokens) {
          break;
        }
      }
    }

    throw new Error("ALL_MODELS_UNAVAILABLE");
  }
}

export const aiModelCascadeManager = new AIModelCascadeManager();
