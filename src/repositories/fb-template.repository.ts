import { AppDataSource } from "../config/database.config";
import { FBTemplate } from "../entities/fb-template.entity";

class FBTemplateRepository {
  private readonly repository = AppDataSource.getRepository(FBTemplate);

  async findAll(): Promise<FBTemplate[]> {
    return this.repository.find();
  }

  async findById(id: number): Promise<FBTemplate | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByName(templateName: string): Promise<FBTemplate | null> {
    return this.repository.findOne({
      where: { name: templateName },
    });
  }

  async findByWaId(waId: string): Promise<FBTemplate | null> {
    return this.repository.findOne({
      where: { wa_id: waId },
    });
  }

  async create(templateData: Partial<FBTemplate>): Promise<FBTemplate> {
    const template = this.repository.create(templateData);
    return this.repository.save(template);
  }

  async update(
    id: number,
    templateData: Partial<FBTemplate>,
  ): Promise<FBTemplate | null> {
    await this.repository.update(id, templateData);
    return this.findById(id);
  }

  async upsert(templateData: Partial<FBTemplate>): Promise<FBTemplate> {
    // Check if a template with this wa_id already exists
    if (templateData.wa_id) {
      const existingTemplate = await this.findByWaId(templateData.wa_id);

      if (existingTemplate) {
        // Update existing template
        await this.repository.update(existingTemplate.id!, templateData);
        return this.findById(existingTemplate.id!) as Promise<FBTemplate>;
      }
    }

    // Create new template if no existing one was found
    return this.create(templateData);
  }

  async bulkUpsert(
    templatesData: Partial<FBTemplate>[],
  ): Promise<FBTemplate[]> {
    const results: FBTemplate[] = [];

    // Process templates in batches to avoid excessive database queries
    const batchSize = 50;
    for (let i = 0; i < templatesData.length; i += batchSize) {
      const batch = templatesData.slice(i, i + batchSize);

      // Process each template in the batch
      const batchPromises = batch.map(async (templateData) => {
        try {
          return await this.upsert(templateData);
        } catch (error) {
          console.error(
            `Failed to upsert template with wa_id ${templateData.wa_id}:`,
            error,
          );
          throw error;
        }
      });

      // Wait for all templates in the current batch to be processed
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }
}

export default new FBTemplateRepository();
