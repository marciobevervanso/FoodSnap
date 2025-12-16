export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plan: 'free' | 'pro' | 'trial';
  public_id: string;
  avatar?: string;
  plan_valid_until?: string;
  is_admin?: boolean; 
}
