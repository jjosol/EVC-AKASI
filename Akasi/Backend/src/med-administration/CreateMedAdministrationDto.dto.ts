export class CreateMedAdministrationDto {
    consultation_id: number;
    client_id: number;
    admin_id: number;
    med_id: number;
    medName: string;
    date: Date;
    patient: string;
    count: number;
    schedule: string;
    start_date: Date;
    end_date: Date;
    remarks?: string;
}