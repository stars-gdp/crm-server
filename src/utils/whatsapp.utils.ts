import EnvConfig from "../config/env.config";
import LogsUtils from "./logs.utils";
import {
  IFBTemplate,
  ITemplateMessage,
  ITemplateParameter,
  IWhatsAppMessage,
} from "../typescript/interfaces";
import axios from "axios";

class WhatsappUtils {
  private apiUrl: string;
  private authToken: string;
  private phoneNumberId: string;
  private wabaId: string;

  constructor() {
    this.apiUrl = EnvConfig.WHATSAPP_API_URL;
    this.authToken = EnvConfig.GRAPH_API_TOKEN;
    this.phoneNumberId = EnvConfig.PHONE_NUMBER_ID;
    this.wabaId = EnvConfig.WABA_ID;
  }

  private async makeWabaApiRequest(endpoint: string, data: any): Promise<any> {
    const url = `${this.apiUrl}/${this.wabaId}${endpoint}`;

    return axios({
      method: "GET",
      url: url,
      data: data,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
    });
  }

  /**
   * Make an API request to the WhatsApp API
   * @param endpoint API endpoint
   * @param data Request data
   * @returns Axios response
   */
  private async makeApiRequest(endpoint: string, data: any): Promise<any> {
    const url = `${this.apiUrl}/${this.phoneNumberId}${endpoint}`;

    return axios({
      method: "POST",
      url: url,
      data: data,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
    });
  }

  /**
   * Format phone number to ensure it's in the correct format for WhatsApp API
   * @param phoneNumber Phone number to format
   * @returns Formatted phone number
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-numeric characters
    let formatted = phoneNumber.replace(/\D/g, "");

    // Ensure it doesn't have a + prefix (API might require numbers without + prefix)
    formatted = formatted.replace(/^\+/, "");

    return formatted;
  }

  /**
   * Send a free-form text message to a recipient
   * @param to Recipient's phone number with country code
   * @param message Text message to send
   * @returns Promise with the API response
   */
  async sendTextMessage(to: string, message: string): Promise<any> {
    try {
      // Format phone number if needed (remove spaces, ensure country code, etc.)
      const formattedNumber = this.formatPhoneNumber(to);

      const data: IWhatsAppMessage = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedNumber,
        type: "text",
        text: {
          body: message,
        },
      };

      const response = await this.makeApiRequest("/messages", data);
      LogsUtils.logMessage(`Message sent to ${to}: ${message}`);
      return response.data;
    } catch (error) {
      LogsUtils.logError(`Failed to send message to ${to}`, error as Error);
      throw error;
    }
  }

  /**
   * Send a template message to a recipient
   * @param to Recipient's phone number with country code
   * @param templateName Name of the template to use
   * @param language Language code (default: 'en_US')
   * @param components Template components (header, body, buttons)
   * @returns Promise with the API response
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string = "en_US",
    components: any[] = [],
  ): Promise<any> {
    try {
      // Format phone number if needed
      const formattedNumber = this.formatPhoneNumber(to);

      const data: ITemplateMessage = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedNumber,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: language,
          },
          components: components,
        },
      };

      const response = await this.makeApiRequest("/messages", data);
      LogsUtils.logMessage(`Template message '${templateName}' sent to ${to}`);
      return response.data;
    } catch (error) {
      LogsUtils.logError(
        `Failed to send template message to ${to}`,
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Send a template message with parameters
   * @param to Recipient's phone number
   * @param templateName Template name
   * @param parameters Array of parameter values
   * @param language Language code
   * @returns Promise with the API response
   */
  async sendTemplateWithParams(
    to: string,
    templateName: string,
    parameters: ITemplateParameter[] = [],
    language: string = "en_US",
  ): Promise<any> {
    // Create the components structure with parameters
    const components = [];

    if (parameters.length > 0) {
      components.push({
        type: "body",
        parameters: parameters,
      });
    }

    return this.sendTemplateMessage(to, templateName, language, components);
  }

  /**
   * Get all the templates
   * @returns Promise with the API response
   */
  async getTemplates(): Promise<IFBTemplate> {
    const response = await this.makeWabaApiRequest("/message_templates", {});
    return response.data;
  }
}

export default new WhatsappUtils();
