import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { FBTemplateStatus } from "../typescript/interfaces";

@Entity("fb_templates")
export class FBTemplate {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "varchar", length: 255, unique: true })
  name?: string;

  @Column({ type: "text", nullable: true })
  text?: string;

  @Column({ type: "enum", enum: FBTemplateStatus })
  status?: string;

  @Column({ type: "varchar", length: 1000, nullable: true })
  parameters?: string;

  @Column({
    type: "datetime",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  created_at?: Date;

  @Column({
    type: "datetime",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  updated_at?: Date;

  @Column({ type: "varchar", length: 200, nullable: false, unique: true })
  wa_id?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  language?: string;
}
