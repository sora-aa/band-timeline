import type { QuestionAnswer } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { FIXED_QUESTION_IDS } from "../fixedQuestions";

export async function submitRegistration(scheduleId: string, answers: Record<string, QuestionAnswer>) {
  const {
    [FIXED_QUESTION_IDS.representativeName]: representativeName,
    [FIXED_QUESTION_IDS.bandName]: bandName,
    [FIXED_QUESTION_IDS.durationMinutes]: durationMinutes,
    ...customAnswers
  } = answers;
  const { error } = await createClient()
    .from("bands")
    .insert({
      schedule_id: scheduleId,
      representative_name: representativeName,
      band_name: bandName,
      duration_minutes: Number(durationMinutes),
      custom_answers: customAnswers,
    });
  if (error) throw error;
}
