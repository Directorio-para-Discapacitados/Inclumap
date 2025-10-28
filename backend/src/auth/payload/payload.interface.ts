export interface PayloadInterface {
    user_id: number;
    user_email: string;
    firstName: string;
    firstLastName: string;
    cellphone: string;
    address: string;
    rolIds: number[]; 
    business_id?: number;
    business_name?: string;
}