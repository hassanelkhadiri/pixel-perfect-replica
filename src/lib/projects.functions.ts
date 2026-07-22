import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { stagesFor, type Discipline } from "@/lib/workflows";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const CreateProjectInput = z.object({
  client: z.string().min(1),
  brand: z.string().optional().default(""),
  campaign: z.string().optional().default(""),
  platform: z.string().optional().default(""),
  deliverables: z.array(z.string()).default([]),
  deadline: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  objective: z.string().optional().default(""),
  audience: z.string().optional().default(""),
  brief: z.string().min(1),
  notes: z.string().optional().default(""),
  discipline: z.enum(["designer", "editor"]),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateProjectInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Only directors can create
    const { data: isDirector } = await supabase.rpc("has_role", { _user_id: userId, _role: "director" });
    if (!isDirector) throw new Error("Only directors can create projects.");

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        client: data.client,
        brand: data.brand || null,
        campaign: data.campaign || null,
        platform: data.platform || null,
        deliverables: data.deliverables,
        deadline: data.deadline || null,
        priority: data.priority,
        objective: data.objective || null,
        audience: data.audience || null,
        brief: data.brief,
        notes: data.notes || null,
        discipline: data.discipline as Discipline,
        created_by: userId,
        assigned_to: data.assigned_to ?? userId,
        current_stage_order: 1,
      })
      .select()
      .single();
    if (error) throw error;

    // Seed stages
    const templates = stagesFor(data.discipline);
    const stageRows = templates.map((t, i) => ({
      project_id: project.id,
      stage_key: t.key,
      title: t.title,
      description: t.description,
      time_estimate: t.time_estimate,
      common_mistakes: t.common_mistakes,
      senior_tips: t.senior_tips,
      stage_order: i + 1,
      status: (i === 0 ? "active" : "locked") as "active" | "locked",
      started_at: i === 0 ? new Date().toISOString() : null,
    }));
    const { data: stages, error: sErr } = await supabase.from("project_stages").insert(stageRows).select();
    if (sErr) throw sErr;

    // Seed checklists
    const checklistRows = stages!.flatMap((s) => {
      const tpl = templates.find((t) => t.key === s.stage_key)!;
      return tpl.checklist.map((label, idx) => ({ stage_id: s.id, label, item_order: idx }));
    });
    if (checklistRows.length) {
      const { error: cErr } = await supabase.from("stage_checklist_items").insert(checklistRows);
      if (cErr) throw cErr;
    }

    return { projectId: project.id };
  });

const GenerateBriefInput = z.object({ projectId: z.string().uuid() });

export const generateBriefInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateBriefInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: project, error } = await supabase
      .from("projects").select("*").eq("id", data.projectId).single();
    if (error || !project) throw error ?? new Error("Project not found");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(apiKey);

    const prompt = `You are a Senior Creative Director analyzing a project brief. Respond ONLY with a strict JSON object matching this TypeScript type:
{ "summary": string, "risks": string[], "questions": string[], "suggested_timeline": string, "suggested_workflow": string[] }

Keep arrays to 3-5 items, each ~1 sentence. No prose outside JSON.

Project:
- Client: ${project.client}
- Brand: ${project.brand ?? "—"}
- Campaign: ${project.campaign ?? "—"}
- Platform: ${project.platform ?? "—"}
- Deliverables: ${(project.deliverables ?? []).join(", ") || "—"}
- Deadline: ${project.deadline ?? "—"}
- Priority: ${project.priority}
- Objective: ${project.objective ?? "—"}
- Audience: ${project.audience ?? "—"}
- Brief: ${project.brief}
- Notes: ${project.notes ?? "—"}
- Discipline: ${project.discipline}`;

    let insights: {
      summary: string; risks: string[]; questions: string[];
      suggested_timeline: string; suggested_workflow: string[];
    };
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3.5-flash"),
        prompt,
      });
      const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      insights = JSON.parse(cleaned);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("AI rate limit reached. Try again in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in Cloud settings.");
      throw new Error("AI failed to analyze the brief.");
    }

    await supabase.from("ai_briefs").upsert({
      project_id: project.id,
      summary: insights.summary,
      risks: insights.risks,
      questions: insights.questions,
      suggested_timeline: insights.suggested_timeline,
      suggested_workflow: insights.suggested_workflow,
    }, { onConflict: "project_id" });

    return insights;
  });

const ToggleChecklistInput = z.object({ itemId: z.string().uuid(), done: z.boolean() });
export const toggleChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ToggleChecklistInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("stage_checklist_items").update({ done: data.done }).eq("id", data.itemId);
    if (error) throw error;
    return { ok: true };
  });

const SubmitInput = z.object({ stageId: z.string().uuid(), notes: z.string().optional() });
export const submitStageForReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("project_stages")
      .update({ status: "in_review", submitted_at: new Date().toISOString(), submission_notes: data.notes ?? null })
      .eq("id", data.stageId);
    if (error) throw error;
    return { ok: true };
  });

const DecideInput = z.object({
  stageId: z.string().uuid(),
  action: z.enum(["approve", "reject", "revision"]),
  comment: z.string().optional().default(""),
  priority: z.enum(["low","medium","high","urgent"]).default("medium"),
});
export const decideReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DecideInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isDirector } = await supabase.rpc("has_role", { _user_id: userId, _role: "director" });
    if (!isDirector) throw new Error("Only directors can decide reviews.");

    const { data: stage, error: sErr } = await supabase.from("project_stages")
      .select("id, project_id, stage_order").eq("id", data.stageId).single();
    if (sErr || !stage) throw sErr ?? new Error("Stage not found");

    const newStatus = data.action === "approve" ? "approved"
      : data.action === "reject" ? "rejected" : "revision";

    const { error: uErr } = await supabase.from("project_stages")
      .update({ status: newStatus, decided_at: new Date().toISOString() })
      .eq("id", stage.id);
    if (uErr) throw uErr;

    await supabase.from("reviews").insert({
      stage_id: stage.id, reviewer_id: userId,
      action: data.action, comment: data.comment || null, priority: data.priority,
    });

    if (data.action === "approve") {
      // Unlock next stage
      const { data: next } = await supabase.from("project_stages")
        .select("id").eq("project_id", stage.project_id).eq("stage_order", stage.stage_order + 1).maybeSingle();
      if (next) {
        await supabase.from("project_stages").update({ status: "active", started_at: new Date().toISOString() }).eq("id", next.id);
        await supabase.from("projects").update({ current_stage_order: stage.stage_order + 1 }).eq("id", stage.project_id);
      } else {
        await supabase.from("projects").update({ status: "completed" }).eq("id", stage.project_id);
      }
    } else if (data.action === "revision" || data.action === "reject") {
      // Bump rejection counter and reopen the stage
      const { data: cur } = await supabase.from("project_stages")
        .select("rejection_count").eq("id", stage.id).single();
      await supabase.from("project_stages")
        .update({ status: "active", rejection_count: (cur?.rejection_count ?? 0) + 1 })
        .eq("id", stage.id);
    }
    return { ok: true };
  });

const SetCountdownInput = z.object({
  stageId: z.string().uuid(),
  endsAt: z.string().nullable(),
});
export const setStageCountdown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SetCountdownInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("project_stages")
      .update({ countdown_ends_at: data.endsAt })
      .eq("id", data.stageId);
    if (error) throw error;
    return { ok: true };
  });

const AnnotationInput = z.object({
  stageId: z.string().uuid(),
  annotation: z.string(),
});
export const updateStageAnnotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnnotationInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("project_stages")
      .update({ annotation: data.annotation || null })
      .eq("id", data.stageId);
    if (error) throw error;
    return { ok: true };
  });

const AskCoachInput = z.object({
  stageId: z.string().uuid(),
  question: z.string().min(1).max(2000),
});
export const askCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AskCoachInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: stage, error } = await supabase
      .from("project_stages")
      .select("title, description, senior_tips, common_mistakes, stage_key, project_id")
      .eq("id", data.stageId).single();
    if (error || !stage) throw error ?? new Error("Stage not found");
    const { data: project } = await supabase
      .from("projects").select("client, brand, campaign, discipline, brief, objective, audience")
      .eq("id", stage.project_id).single();

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(apiKey);

    const prompt = `You are a warm, patient Senior Creative Director mentoring a junior ${project?.discipline ?? ""} teammate. Answer the question below in plain, encouraging language a beginner will understand. Be specific and actionable — reference concrete steps, tools, or examples where helpful. Keep it under 180 words. Never be condescending.

Current stage: ${stage.title}
Stage goal: ${stage.description ?? ""}
Senior tips already shown: ${(stage.senior_tips ?? []).join(" | ")}
Common mistakes already shown: ${(stage.common_mistakes ?? []).join(" | ")}

Project context:
- Client: ${project?.client ?? "—"} (${project?.brand ?? "—"})
- Campaign: ${project?.campaign ?? "—"}
- Objective: ${project?.objective ?? "—"}
- Audience: ${project?.audience ?? "—"}
- Brief: ${project?.brief ?? "—"}

Question from the teammate: ${data.question}`;

    try {
      const { text } = await generateText({ model: gateway("google/gemini-3.5-flash"), prompt });
      return { answer: text.trim() };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("AI rate limit reached. Try again in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in Cloud settings.");
      throw new Error("The coach couldn't respond. Try again.");
    }
  });

const SuggestAnnotationInput = z.object({ stageId: z.string().uuid() });
export const suggestStageAnnotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SuggestAnnotationInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: stage, error } = await supabase
      .from("project_stages")
      .select("title, description, senior_tips, common_mistakes, project_id")
      .eq("id", data.stageId).single();
    if (error || !stage) throw error ?? new Error("Stage not found");
    const { data: project } = await supabase
      .from("projects").select("client, brand, discipline, brief, objective, audience")
      .eq("id", stage.project_id).single();

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(apiKey);

    const prompt = `You are a Senior Creative Director writing a short guidance note for a junior ${project?.discipline ?? ""} at the "${stage.title}" stage. Write 4–6 short bullet lines (use "•" prefix) that teach: what "great" looks like here, one concrete example to study, one trap to avoid, and one specific action to take first. Beginner-friendly, warm, specific to this project. No preamble.

Stage goal: ${stage.description ?? ""}
Client: ${project?.client ?? "—"} (${project?.brand ?? "—"})
Objective: ${project?.objective ?? "—"}
Audience: ${project?.audience ?? "—"}
Brief: ${project?.brief ?? "—"}`;

    try {
      const { text } = await generateText({ model: gateway("google/gemini-3.5-flash"), prompt });
      return { suggestion: text.trim() };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("AI rate limit reached. Try again in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in Cloud settings.");
      throw new Error("Couldn't generate guidance. Try again.");
    }
  });

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return { userId, profile, roles: (roles ?? []).map((r) => r.role) };
  });

