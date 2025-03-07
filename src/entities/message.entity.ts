import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { MessageDirection } from "../typescript/interfaces";

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
}
