import { ResponseCapacityHistory } from "./capacity";

export class Exam {
  id: number;
}

export class QuestionCapacity {
  id: number;
  content: string;
  type: number; // 0: 1 đáp án, 1: nhiều đáp án
  answers: {
    id: number;
    content: string;
    isChoose: boolean; // đán án người dùng chọn
  }[];
  result_capacity_detail: {
    id: number;
    result_capacity_id: number;
    question_id: number;
    answer_id: number;
  }[];
  isNotAnswer: boolean; // true: người dùng không trả lời câu hỏi
}

export class ExamCapacity {
  questions: QuestionCapacity[];
  id: number;
  time: number;
  time_type: number;
  exam_at: Date;
  name: string;
  time_exam: number; // thời gian làm bài (phút)
}

// kết quả bài test năng lực
export class ResultExam {
  capacityId: number;
  score: string; // điểm
  examTime: string; // thời gian làm bài,
  submitAt: string; // thời gian nộp bài,
  donotAnswer: number; // tổng số câu chưa làm,
  falseAnswer: number; // tổng số câu làm sai,
  trueAnswer: number; // tổng số câu làm đúng
}

export class TestResultStorage {
  round_id: number;
  data: any;
}
