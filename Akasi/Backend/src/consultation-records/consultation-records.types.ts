// src/consultation-records/consultation-records.types.ts

// Input for creating a consultation record
export interface ConsultationRecordCreateInput {
    client_id: number;
    admin_id: number;
    date: Date;
    patient_name: string;
    patient_occupation: string;
    doctor: string;
    complaint: string;
    remarks: string;
    action: string;
    disposition: string;
    intern: boolean;
    confined: boolean;
    medAdministration: boolean;
    diagnosis_ids?: number[]; // Optional field for diagnosis IDs
}

// For updating consultation records
export interface ConsultationRecordUpdateInput {
    clientId: number;
    name: string;
    occupation?: string;
    grade?: string;
    section?: string;
    generalComplaint?: string;
    remarks?: string;
    action?: string;
    disposition?: string;
    confined?: boolean;
    medicationAdministration?: boolean;
    intern?: boolean;
}