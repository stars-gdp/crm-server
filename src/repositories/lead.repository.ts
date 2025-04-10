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

  async findByTgUserName(tgUserName: string): Promise<Lead | null> {
    return this.repository.findOne({
      where: { tg_username: tgUserName },
    });
  }

  async findByTgChatId(tgChatId: number): Promise<Lead | null> {
    return this.repository.findOne({
      where: { tg_chat_id: tgChatId },
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

  async updateByTgChatId(
    tg_chat_id: number,
    leadData: Partial<Lead>,
  ): Promise<Lead | null> {
    const lead = await this.findByTgChatId(tg_chat_id);
    if (!lead) {
      return null;
    }
    await this.repository.update(lead.id!, leadData);
    return lead;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  /**
   * Execute a custom SQL query and return Lead objects
   * @param query SQL query to execute
   * @param parameters Query parameters
   * @returns Array of Lead objects
   */
  async findAllByQuery(query: string, parameters: any[] = []): Promise<Lead[]> {
    return this.repository.query(query, parameters);
  }
}
