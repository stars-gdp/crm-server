import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("templates")
export class Template {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "varchar", length: 255, unique: true, nullable: true })
  template_name?: string;

  @Column({ type: "text", nullable: true })
  template_text?: string;

  @Column({ type: "text", nullable: true })
  parameters?: string;

  @Column({ type: "varchar", nullable: true, length: 80 })
  continue_button?: string;
}
