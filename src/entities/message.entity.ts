import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { MessageDirection, MessageType } from "../typescript/interfaces";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ name: "lead_phone", nullable: true, length: 50 })
  lead_phone?: string;

  @Column({ name: "message_text", type: "text", nullable: true })
  message_text?: string;

  @Column({
    type: "enum",
    enum: MessageDirection,
    nullable: true,
  })
  direction?: MessageDirection;

  @Column({ name: "template_name", nullable: true, length: 255 })
  template_name?: string;

  @Column({ name: "button_response", nullable: true, length: 255 })
  button_response?: string;

  @Column({
    name: "timestamp",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  timestamp?: Date;

  @Column({ name: "wa_id", nullable: false, length: 255 })
  wa_id?: string;

  @Column({ name: "wa_response_id", length: 255 })
  wa_response_id?: string;

  @Column({ name: "type", type: "enum", enum: MessageType })
  type?: string;

  @Column({ name: "media_id", type: "varchar", length: 255 })
  media_id?: string;
}
