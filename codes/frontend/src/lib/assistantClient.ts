import { currentMonthKey } from "../utils/format";
import { getPayrollForMonth, listEmployeesWithPayroll } from "./payrunApi";

const openAIEndpoint = "https://api.openai.com/v1/chat/completions";

function buildAssistantInstructions(
  question: string,
  businessId: string,
  employees: unknown,
  payrollHistory: unknown,
  currentMonth: string,
  currentPayroll: unknown,
) {
  return `You are PayRun assistant for a small Indian payroll application. Answer using only the provided payroll data and helper descriptions. Do not guess numeric values.

Question: ${question}

Available helper functions:
- listEmployeesWithPayroll(businessId): returns active employees and payroll history for the business.
- getPayrollForMonth(businessId, month): returns payroll details for the requested month.

Context:
Business ID: ${businessId}
Current month: ${currentMonth}
Employees: ${JSON.stringify(employees, null, 2)}
Payroll history: ${JSON.stringify(payrollHistory, null, 2)}
Current month payroll: ${JSON.stringify(currentPayroll, null, 2)}

Provide a clear answer in simple language.`;
}

export async function askPayRunAssistant(
  question: string,
  businessId: string,
): Promise<string> {
  const assistantUrl = import.meta.env.VITE_ASSISTANT_API_URL;
  const openApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const openAiModel = import.meta.env.VITE_OPENAI_MODEL ?? "gpt-3.5-turbo";

  const [employeeData, payrollData] = await Promise.all([
    listEmployeesWithPayroll(businessId),
    getPayrollForMonth(businessId, currentMonthKey()),
  ]);
  const prompt = buildAssistantInstructions(
    question,
    businessId,
    employeeData.employees,
    employeeData.payrollHistory,
    currentMonthKey(),
    payrollData,
  );

  if (assistantUrl) {
    const response = await fetch(assistantUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, businessId, prompt }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Assistant endpoint error: ${response.status} ${body}`);
    }

    const payload = await response.json();
    if (typeof payload?.reply === "string") {
      return payload.reply;
    }

    throw new Error("Assistant endpoint returned an unexpected response.");
  }

  if (!openApiKey) {
    throw new Error(
      "Assistant is not configured. Set VITE_ASSISTANT_API_URL or VITE_OPENAI_API_KEY.",
    );
  }

  const completion = await fetch(openAIEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openApiKey}`,
    },
    body: JSON.stringify({
      model: openAiModel,
      messages: [
        {
          role: "system",
          content:
            "You are a payroll assistant for PayRun. Provide concise, accurate answers from the provided payroll data.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 700,
    }),
  });

  if (!completion.ok) {
    const body = await completion.text();
    throw new Error(`OpenAI request failed: ${completion.status} ${body}`);
  }

  const data = await completion.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI returned an invalid assistant response.");
  }

  return content.trim();
}
