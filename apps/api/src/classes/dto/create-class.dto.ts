export type CreateClassDto = {
  name?: string;
  subject?: string;
  schoolYear?: string;
  gradeLevel?: number;
  classCode?: string;
  isActive?: boolean;
  teacherId?: string;
  description?: string | null;
};
