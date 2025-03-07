import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity("new_leads")
export class NewLeadsView {
  @ViewColumn()
  lead_name?: string;

  @ViewColumn()
  lead_phone?: string;

  @ViewColumn()
  lead_id?: number;
}
