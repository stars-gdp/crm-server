import { ViewEntity, ViewColumn } from "typeorm";
import { MessageDirection } from "../typescript/interfaces";

@ViewEntity("conversations")
export class ConversationView {
  @ViewColumn()
  lead_id?: number;

  @ViewColumn()
  message_id?: number;

  @ViewColumn()
  media_id?: number;

  @ViewColumn()
  lead_name?: string;

  @ViewColumn()
  lead_phone?: string;

  @ViewColumn()
  message_text?: string;

  @ViewColumn()
  direction?: MessageDirection;

  @ViewColumn()
  timestamp?: string;
}
