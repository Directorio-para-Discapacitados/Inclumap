export interface PayloadInterface {
  user_id: number;
  user_email: string;
  firstName: string | null;
  firstLastName: string | null;
  cellphone: string | null;
  address: string | null;
  rolIds: number[];
  business_id: number | null;
  business_name: string | null;
  business_address: string | null;
  NIT: number | null;
  accessibilityIds?: number[];
  categoryIds?: number[];
}
