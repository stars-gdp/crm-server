import { AppDataSource } from "../config/database.config";
import { Template } from "../entities/template.entity";

class TemplateRepository {
  private readonly repository = AppDataSource.getRepository(Template);

  async findAll(): Promise<Template[]> {
    return this.repository.find();
  }

  async findById(id: number): Promise<Template | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByName(templateName: string): Promise<Template | null> {
    return this.repository.findOne({
      where: { template_name: templateName },
    });
  }

  async create(templateData: Partial<Template>): Promise<Template> {
    const template = this.repository.create(templateData);
    return this.repository.save(template);
  }

  async update(
    id: number,
    templateData: Partial<Template>,
  ): Promise<Template | null> {
    await this.repository.update(id, templateData);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }
}

export default new TemplateRepository();
