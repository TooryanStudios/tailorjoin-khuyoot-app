export type SurveyResponse = {
  id: string;
  status?: string | null;
  createdAt?: Date | null;
  answers?: Record<string, any>;
};

const countByValue = (responses: SurveyResponse[], key: string) => {
  const counts: Record<string, number> = {};
  responses.forEach((response) => {
    const value = response.answers?.[key];
    if (!value) return;
    if (Array.isArray(value)) return;
    counts[String(value)] = (counts[String(value)] || 0) + 1;
  });
  return counts;
};

const countByMulti = (responses: SurveyResponse[], key: string) => {
  const counts: Record<string, number> = {};
  responses.forEach((response) => {
    const value = response.answers?.[key];
    if (!Array.isArray(value)) return;
    value.forEach((entry) => {
      const normalized = String(entry);
      counts[normalized] = (counts[normalized] || 0) + 1;
    });
  });
  return counts;
};

const sortedEntries = (counts: Record<string, number>) =>
  Object.entries(counts).sort((a, b) => b[1] - a[1]);

export const computeAggregations = (responses: SurveyResponse[]) => {
  return {
    byCountry: sortedEntries(countByValue(responses, 'country')),
    byPersona: sortedEntries(countByValue(responses, 'persona')),
    byStitchFrequency: sortedEntries(countByValue(responses, 'stitch_frequency')),
    bySpendRange: sortedEntries(countByValue(responses, 'spend_per_outfit')),
    byWillingness: sortedEntries(countByValue(responses, 'willing_to_pay_tryon')),
    topPainPoints: sortedEntries(countByMulti(responses, 'pain_points')).slice(0, 8),
  };
};
