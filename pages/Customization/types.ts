export interface CustomizationOption {
  id: string;
  label: string;
  type: 'color' | 'size' | 'fabric' | 'text';
  options?: string[];
  value?: string;
}

export interface Measurements {
  neck: string;
  chest: string;
  shoulder: string;
  sleeve: string;
  length: string;
  waist: string;
  thigh: string;
  shoe: string;
}

export interface Step {
  number: number;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
}
