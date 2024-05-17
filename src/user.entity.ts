import { Entity, PrimaryGeneratedColumn, Column, Timestamp } from 'typeorm';
@Entity('user_block_statuses')
export class User {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({type: "int", name: "user_id", nullable: true})
    user_id: number;

    @Column( { name: "deactivation_time",type: "timestamp",nullable: true})
    deactivation_time: Timestamp;

    @Column({type: "int", name: "deactivation"})
    deactivation: number;

    @Column({type: "timestamp", name: "initial_time", nullable: true})
    initial_time: Date;

}
