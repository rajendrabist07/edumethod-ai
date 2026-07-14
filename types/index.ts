export interface Topic {
  name: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedHours: number;
}

export interface ExtractedSyllabus {
  subject: string;
  topics: Topic[];
}