import { AppDataSource } from "../config/database.config";
import { ConversationView } from "../entities/conversations.entity";

class ConversationsRepository {
  private readonly repository = AppDataSource.getRepository(ConversationView);

  findByPhone(phone: string): Promise<ConversationView[]> {
    return this.repository.find({
      where: { lead_phone: phone },
      order: { timestamp: "ASC" },
    });
  }
}

export default new ConversationsRepository();
