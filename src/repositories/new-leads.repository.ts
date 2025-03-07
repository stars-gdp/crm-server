import { AppDataSource } from "../config/database.config";
import { NewLeadsView } from "../entities/new-leads.view.entity";

class NewLeadsRepository {
  private repository = AppDataSource.getRepository(NewLeadsView);

  async findAll(): Promise<NewLeadsView[]> {
    return this.repository.find();
  }
}

export default new NewLeadsRepository();
