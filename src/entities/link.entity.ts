import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { LinkType } from "../typescript/interfaces";

@Entity("links")
export class Link {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "date" })
  link_date?: Date;

  @Column({ type: "varchar", length: 100 })
  link?: string;

  @Column({ type: "enum", enum: LinkType })
  link_type?: LinkType;
}
