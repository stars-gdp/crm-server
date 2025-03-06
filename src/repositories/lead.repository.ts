import { AppDataSource } from "../config/database.config";
import { Lead } from "../entities/lead.entity";

export class LeadRepository {
  private repository = AppDataSource.getRepository(Lead);

  async findAll(): Promise<Lead[]> {
    return this.repository.find({
      order: {
        created_at: "DESC",
      },
    });
  }

  async findById(id: number): Promise<Lead | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByPhone(phone: string): Promise<Lead | null> {
    return this.repository.findOne({
      where: { lead_phone: phone },
    });
  }

  async create(leadData: Partial<Lead>): Promise<Lead> {
    const lead = this.repository.create(leadData);
    return this.repository.save(lead);
  }

  async update(id: number, leadData: Partial<Lead>): Promise<Lead | null> {
    await this.repository.update(id, leadData);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }
}
