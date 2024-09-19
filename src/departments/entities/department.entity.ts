import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Department {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    dept_code: string;

    @CreateDateColumn({
        type: "timestamp with time zone",
        nullable: false
    })
    created_at: Date;

    @UpdateDateColumn({
        type: 'timestamp with time zone',
        nullable: false
    })
    updated_at: Date;

    @DeleteDateColumn({
        type: 'timestamp with time zone',
        nullable: true
    })
    deleted_at: Date;

}
