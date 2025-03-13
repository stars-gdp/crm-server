import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";
import {
  BitStatus,
  BomStatus,
  PtStatus,
  WgStatus,
} from "../typescript/interfaces";

@Entity("leads")
export class Lead {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ length: 255 })
  lead_name?: string;

  @Column({ length: 50 })
  lead_phone?: string;

  @Column({
    type: "enum",
    enum: BomStatus,
    nullable: true,
  })
  bom_text?: BomStatus;

  @Column({ type: "datetime" })
  bom_date?: Date;

  @Column({
    type: "enum",
    enum: BitStatus,
    nullable: true,
  })
  bit_text?: BitStatus;

  @Column({ type: "datetime" })
  bit_date?: Date;

  @Column({
    type: "enum",
    enum: PtStatus,
    nullable: true,
  })
  pt_text?: PtStatus;

  @Column({ type: "datetime" })
  pt_date?: Date;

  @Column({
    type: "enum",
    enum: WgStatus,
    nullable: true,
  })
  wg_text?: WgStatus;

  @Column({ type: "datetime" })
  wg_date?: Date;

  @Column({ type: "boolean" })
  opted_out?: boolean;

  @Column({ type: "boolean" })
  fu_bom_sent?: boolean;

  @Column({ type: "boolean" })
  fu_bom_confirmed?: boolean;

  @Column({ type: "boolean" })
  fu2_bom_sent?: boolean;

  @Column({ type: "boolean" })
  fu2_bom_confirmed?: boolean;

  @Column({ type: "boolean" })
  fu_bit_sent?: boolean;

  @Column({ type: "boolean" })
  fu2_bit_sent?: boolean;

  @Column({ type: "boolean" })
  yes_bom_sent?: boolean;

  @Column({ type: "boolean" })
  yes_bom_pressed?: boolean;

  @Column({ type: "boolean" })
  link_bom_sent?: boolean;

  @CreateDateColumn()
  created_at?: Date;
}
