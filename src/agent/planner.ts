import { Env, ResearchPlanData, ResearchSession } from '../types';
import { ResearchPlan, ResearchPlanSchema } from './schemas';
import { OpenAIService } from '../services/openai';
import { D1Service } from '../services/d1';

export async function runPlannerNode(
  session: ResearchSession,
  env: Env,
  openaiService: OpenAIService,
  d1Service: D1Service
): Promise<ResearchPlanData> {
  await d1Service.logAudit(
    session.id,
    'planner',
    `Decomposing research query: "${session.query}" into structured sub-questions`,
    'PlannerNode',
    { query: session.query }
  );

  const systemPrompt = `You are a Principal Research Analyst and Lead AI Architect.
Your task is to decompose a complex research question into 2 to 4 distinct, highly targeted, non-overlapping sub-questions.
For each sub-question, provide an optimized search query designed for search engines.
Ensure your breakdown covers foundational mechanisms, empirical metrics/benchmarks, and enterprise/audit implications.`;

  const userPrompt = `Research Objective: "${session.query}"

Generate a structured research plan with core objective, strategic rationale, and 2-4 sub-questions.`;

  const plan: ResearchPlan = await openaiService.generateStructured({
    systemPrompt,
    userPrompt,
    schema: ResearchPlanSchema,
    schemaName: 'ResearchPlan',
    fallbackGenerator: () => openaiService.createSimulatedPlan(session.query),
  });

  const planId = `plan_${session.id.slice(0, 8)}_${Date.now()}`;
  const planData: ResearchPlanData = {
    id: planId,
    sessionId: session.id,
    coreObjective: plan.coreObjective,
    rationale: plan.rationale,
    subQuestions: plan.subQuestions.map((sq, index) => ({
      id: `${session.id}_sq_${index + 1}`,
      planId,
      sessionId: session.id,
      question: sq.question,
      searchQuery: sq.searchQuery,
      status: 'pending',
    })),
    createdAt: new Date().toISOString(),
  };

  // Persist plan to D1
  await d1Service.savePlan(planData);

  await d1Service.logAudit(
    session.id,
    'planner',
    `Generated research plan with ${planData.subQuestions.length} sub-questions`,
    'PlannerNode',
    {
      coreObjective: planData.coreObjective,
      subQuestionsCount: planData.subQuestions.length,
      subQuestions: planData.subQuestions.map((sq) => sq.question),
    }
  );

  return planData;
}
