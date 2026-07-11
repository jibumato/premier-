"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatRelativeTime } from "@/lib/format";

export interface QaQuestionListItem {
  key: string;
  title: string;
  excerpt: string;
  tag: string;
  answers: number;
  solved: boolean;
}

export interface QaQuestionDetail {
  id: string;
  authorId: string;
  title: string;
  body: string;
  tag: string;
  authorName: string;
  time: string;
}

export interface QaAnswerRow {
  key: string;
  authorId: string;
  name: string;
  text: string;
  best: boolean;
  likes: number;
  likedByMe: boolean;
}

/** Blocked authors + auto-hidden questions to keep out of the list (Phase 5). */
export interface QaFilter {
  blockedUserIds: string[];
  hiddenQaIds: string[];
}

/** Question list (知恵袋 top screen), newest first with answer counts.
 * Blocked authors' questions and auto-hidden questions are filtered out when
 * a viewer's filter is supplied. */
export function useQaQuestions(filter?: QaFilter) {
  return useQuery({
    queryKey: ["qa_questions", filter?.blockedUserIds ?? [], filter?.hiddenQaIds ?? []],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<QaQuestionListItem[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("qa_questions")
        .select("id, author_id, title, body, tag, qa_answers(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      let rows = (data ?? []) as unknown as {
        id: string;
        author_id: string;
        title: string;
        body: string;
        tag: string;
        qa_answers: { count: number }[];
      }[];
      if (filter) {
        const blocked = new Set(filter.blockedUserIds);
        const hidden = new Set(filter.hiddenQaIds);
        rows = rows.filter((r) => !blocked.has(r.author_id) && !hidden.has(r.id));
      }
      const ids = rows.map((r) => r.id);
      let solvedIds = new Set<string>();
      if (ids.length > 0) {
        const { data: bestRows, error: bestErr } = await supabase
          .from("qa_answers")
          .select("question_id")
          .eq("is_best", true)
          .in("question_id", ids);
        if (bestErr) throw bestErr;
        solvedIds = new Set((bestRows ?? []).map((b) => b.question_id as string));
      }
      return rows.map((r) => ({
        key: r.id,
        title: r.title,
        excerpt: r.body,
        tag: r.tag,
        answers: r.qa_answers?.[0]?.count ?? 0,
        solved: solvedIds.has(r.id),
      }));
    },
  });
}

/** Single question (知恵袋 detail screen header). */
export function useQaQuestion(questionId: string | null) {
  return useQuery({
    queryKey: ["qa_question", questionId],
    enabled: isSupabaseConfigured() && Boolean(questionId),
    queryFn: async (): Promise<QaQuestionDetail | null> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("qa_questions")
        .select("id, author_id, title, body, tag, created_at, profiles(display_name)")
        .eq("id", questionId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as unknown as {
        id: string;
        author_id: string;
        title: string;
        body: string;
        tag: string;
        created_at: string;
        profiles: { display_name: string } | null;
      };
      return {
        id: row.id,
        authorId: row.author_id,
        title: row.title,
        body: row.body,
        tag: row.tag,
        authorName: row.profiles?.display_name ?? "不明",
        time: formatRelativeTime(row.created_at),
      };
    },
  });
}

/** Answers to a question, with like counts and whether the current user liked
 * each. Blocked users' answers are filtered out when `blockedUserIds` is given. */
export function useQaAnswers(
  questionId: string | null,
  currentUserId: string | undefined,
  blockedUserIds?: string[],
) {
  return useQuery({
    queryKey: ["qa_answers", questionId, blockedUserIds ?? []],
    enabled: isSupabaseConfigured() && Boolean(questionId),
    queryFn: async (): Promise<QaAnswerRow[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data: answers, error } = await supabase
        .from("qa_answers")
        .select("id, author_id, body, is_best, created_at, profiles(display_name)")
        .eq("question_id", questionId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      let rows = (answers ?? []) as unknown as {
        id: string;
        author_id: string;
        body: string;
        is_best: boolean;
        profiles: { display_name: string } | null;
      }[];
      if (blockedUserIds?.length) {
        const blocked = new Set(blockedUserIds);
        rows = rows.filter((r) => !blocked.has(r.author_id));
      }
      const ids = rows.map((r) => r.id);
      if (ids.length === 0) return [];

      const { data: likes, error: likesErr } = await supabase
        .from("qa_answer_likes")
        .select("answer_id, user_id")
        .in("answer_id", ids);
      if (likesErr) throw likesErr;
      const likeCounts = new Map<string, number>();
      const likedByMe = new Set<string>();
      for (const l of (likes ?? []) as { answer_id: string; user_id: string }[]) {
        likeCounts.set(l.answer_id, (likeCounts.get(l.answer_id) ?? 0) + 1);
        if (l.user_id === currentUserId) likedByMe.add(l.answer_id);
      }

      return rows
        .map((r) => ({
          key: r.id,
          authorId: r.author_id,
          name: r.profiles?.display_name ?? "不明",
          text: r.body,
          best: r.is_best,
          likes: likeCounts.get(r.id) ?? 0,
          likedByMe: likedByMe.has(r.id),
        }))
        .sort((a, b) => Number(b.best) - Number(a.best));
    },
  });
}

export function useCreateQaQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ authorId, title, body, tag }: { authorId: string; title: string; body: string; tag: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("qa_questions")
        .insert({ author_id: authorId, title, body, tag })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qa_questions"] }),
  });
}

export function useCreateQaAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, authorId, body }: { questionId: string; authorId: string; body: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("qa_answers").insert({ question_id: questionId, author_id: authorId, body });
      if (error) throw error;
    },
    onSuccess: (_d, { questionId }) => {
      qc.invalidateQueries({ queryKey: ["qa_answers", questionId] });
      qc.invalidateQueries({ queryKey: ["qa_questions"] });
    },
  });
}

export function useToggleQaLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      answerId,
      userId,
      liked,
    }: {
      answerId: string;
      userId: string;
      liked: boolean;
      questionId: string;
    }) => {
      const supabase = getSupabaseBrowserClient();
      if (liked) {
        const { error } = await supabase.from("qa_answer_likes").delete().eq("answer_id", answerId).eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("qa_answer_likes").insert({ answer_id: answerId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: (_d, { questionId }) => qc.invalidateQueries({ queryKey: ["qa_answers", questionId] }),
  });
}

/** Marks an answer as the best one — RLS-less RPC that itself checks the
 * caller is the question's author (see mark_best_answer() in the migration). */
export function useMarkBestAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ answerId }: { answerId: string; questionId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.rpc("mark_best_answer", { p_answer_id: answerId });
      if (error) throw error;
    },
    onSuccess: (_d, { questionId }) => {
      qc.invalidateQueries({ queryKey: ["qa_answers", questionId] });
      qc.invalidateQueries({ queryKey: ["qa_questions"] });
    },
  });
}
