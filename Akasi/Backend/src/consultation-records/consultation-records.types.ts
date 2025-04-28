// src/consultation-records/consultation-records.types.ts

// Input for creating a consultation record
export interface ConsultationRecordCreateInput {
    patient_id: number;
    nurse_id: number;
    doctor_id?: number; // Optional doctor ID
    date: Date;
    patient_name: string;
    patient_occupation: string;
    nurse_name: string;
    doctor_name?: string; // Optional doctor name
    complaint: string;
    remarks: string;
    action: string;
    disposition: string;
    intervention: string;
    confined: boolean;
    medAdministration: boolean;
    diagnosis_ids?: number[]; // Optional field for diagnosis IDs
    doctorShow?: boolean; // Whether to show the record on the doctor side
}

// For updating consultation records
export interface ConsultationRecordUpdateInput {
    patient_id: number;
    nurse_id?: number;
    doctor_id?: number;
    patient_name: string;
    patient_occupation?: string;
    nurse_name?: string;
    doctor_name?: string;
    complaint?: string;
    remarks?: string;
    action?: string;
    disposition?: string;
    intervention?: string;
    confined?: boolean;
    medAdministration?: boolean;
    doctorShow?: boolean; // Whether to show the record on the doctor side
}

// For retrieving a consultation record
export interface ConsultationRecordResponse {
    consultation_id: number;
    patient_id: number;
    nurse_id: number;
    doctor_id?: number;
    date: Date;
    patient_name: string;
    patient_occupation: string;
    nurse_name: string;
    doctor_name?: string;
    complaint: string;
    remarks: string;
    action: string;
    disposition: string;
    intervention: string;
    confined: boolean;
    medAdministration: boolean;
    doctorShow: boolean; // Whether the record is shown on the doctor side
    diagnoses?: any[];
    medAdministrations?: any[];
    nurse?: any;
    doctor?: any;
}