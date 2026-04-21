export interface User {
  id: string;
  email: string;
  name: string;
  portal: "employee" | "admin";
  role: "admin" | "underwriter" | "business-analyst" | "actuarial-analyst" | "exl-operations";
  employee_code: string | null;
  job_desc: string | null;
  created_at: string;
  updated_at: string;
}
