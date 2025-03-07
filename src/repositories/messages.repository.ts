import { AppDataSource } from "../config/database.config";
import { Message } from "../entities/message.entity";

class MessagesRepository {
  private readonly repository = AppDataSource.getRepository(Message);

  async findAll(): Promise<Message[]> {
    return this.repository.find({ order: { timestamp: "ASC" } });
  }

  async findByPhone(phone: string): Promise<Message[] | null> {
    return this.repository.find({
      where: { lead_phone: phone },
      order: { timestamp: "ASC" },
    });
  }

  async create(messageData: Partial<Message>): Promise<Message> {
    const message = this.repository.create(messageData);
    return this.repository.save(message);
  }
}

export default new MessagesRepository();
