import { AppDataSource } from "../config/database.config";
import { Link } from "../entities/link.entity";
import { LinkType } from "../typescript/interfaces";

export class LinkRepository {
  private repository = AppDataSource.getRepository(Link);

  async findTodayBOM(): Promise<Link | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.repository.findOne({
      where: {
        link_date: today,
        link_type: LinkType.BOM,
      },
    });
  }

  async findTodayBIT(): Promise<Link | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.repository.findOne({
      where: { link_date: today, link_type: LinkType.BIT },
    });
  }

  async findTodayWG(): Promise<Link | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.repository.findOne({
      where: { link_date: today, link_type: LinkType.WG },
    });
  }

  async create(linkData: Link): Promise<Link> {
    const link = this.repository.create(linkData);
    return this.repository.save(link);
  }
}
