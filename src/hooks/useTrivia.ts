'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { TriviaQuestion, TriviaAnswer } from '@/lib/types';
import {
  getTriviaRef,
  getTriviaAnswersRef,
  addDocument,
  updateDocument,
  deleteDocument,
} from '@/lib/firestore';
import { db, auth } from '@/lib/firebase';
import { useEventId } from '@/contexts/EventContext';

export function useTrivia() {
  const eventId = useEventId();
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [answers, setAnswers] = useState<TriviaAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to all trivia questions
  useEffect(() => {
    if (!db) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    const q = query(getTriviaRef(eventId), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as TriviaQuestion[];
        setQuestions(items);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsubscribe();
  }, [eventId]);

  // Subscribe to all answers (for admin leaderboard / viewer's own answers)
  useEffect(() => {
    if (!db) {
      setAnswers([]);
      return;
    }

    const q = query(getTriviaAnswersRef(eventId), orderBy('answeredAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as TriviaAnswer[];
        setAnswers(items);
      },
      () => {},
    );

    return () => unsubscribe();
  }, [eventId]);

  const activeQuestion = useMemo(
    () => questions.find((q) => q.status === 'active' || q.status === 'revealed') ?? null,
    [questions],
  );

  const myAnswers = useMemo(() => {
    const uid = auth?.currentUser?.uid;
    if (!uid) return [];
    return answers.filter((a) => a.viewerId === uid);
  }, [answers]);

  const myAnswerForQuestion = useCallback(
    (questionId: string) => myAnswers.find((a) => a.questionId === questionId) ?? null,
    [myAnswers],
  );

  // Leaderboard: aggregate correct answers per viewer
  const leaderboard = useMemo(() => {
    const scores: Record<string, { displayName: string; correct: number; total: number }> = {};
    for (const a of answers) {
      if (!scores[a.viewerId]) {
        scores[a.viewerId] = { displayName: a.displayName, correct: 0, total: 0 };
      }
      scores[a.viewerId].total += 1;
      if (a.correct) scores[a.viewerId].correct += 1;
    }
    return Object.entries(scores)
      .map(([viewerId, data]) => ({ viewerId, ...data }))
      .sort((a, b) => b.correct - a.correct || a.total - b.total);
  }, [answers]);

  // Answer count per option for a given question
  const getAnswerDistribution = useCallback(
    (questionId: string) => {
      const dist: Record<number, number> = {};
      for (const a of answers) {
        if (a.questionId === questionId) {
          dist[a.selectedIndex] = (dist[a.selectedIndex] || 0) + 1;
        }
      }
      return dist;
    },
    [answers],
  );

  // --- Viewer actions ---

  const submitAnswer = useCallback(
    async (questionId: string, selectedIndex: number) => {
      if (!db || !auth?.currentUser) return;

      // Check if already answered
      const uid = auth.currentUser.uid;
      const existing = answers.find(
        (a) => a.questionId === questionId && a.viewerId === uid,
      );
      if (existing) return;

      const question = questions.find((q) => q.id === questionId);
      if (!question || question.status !== 'active') return;

      const displayName =
        (typeof window !== 'undefined' && localStorage.getItem(`${eventId}_displayName`)) || 'Anonymous';

      await addDocument(getTriviaAnswersRef(eventId), {
        questionId,
        viewerId: uid,
        displayName,
        selectedIndex,
        correct: selectedIndex === question.correctIndex,
        answeredAt: serverTimestamp(),
      });
    },
    [answers, questions, eventId],
  );

  // --- Admin actions ---

  const addQuestion = useCallback(
    async (question: string, options: string[], correctIndex: number) => {
      if (!db || !auth?.currentUser) return;
      await addDocument(getTriviaRef(eventId), {
        question,
        options,
        correctIndex,
        order: questions.length + 1,
        status: 'draft',
        createdAt: serverTimestamp(),
      });
    },
    [questions.length, eventId],
  );

  const updateQuestionStatus = useCallback(
    async (questionId: string, status: TriviaQuestion['status']) => {
      if (!db) return;
      const ref = doc(getTriviaRef(eventId), questionId);
      await updateDocument(ref, { status });
    },
    [eventId],
  );

  const activateQuestion = useCallback(
    async (questionId: string) => {
      if (!db) return;
      // Close any currently active/revealed questions first
      for (const q of questions) {
        if ((q.status === 'active' || q.status === 'revealed') && q.id !== questionId) {
          const ref = doc(getTriviaRef(eventId), q.id);
          await updateDocument(ref, { status: 'closed' });
        }
      }
      const ref = doc(getTriviaRef(eventId), questionId);
      await updateDocument(ref, { status: 'active' });
    },
    [questions, eventId],
  );

  const revealAnswer = useCallback(async (questionId: string) => {
    if (!db) return;
    const ref = doc(getTriviaRef(eventId), questionId);
    await updateDocument(ref, { status: 'revealed' });
  }, [eventId]);

  const closeQuestion = useCallback(async (questionId: string) => {
    if (!db) return;
    const ref = doc(getTriviaRef(eventId), questionId);
    await updateDocument(ref, { status: 'closed' });
  }, [eventId]);

  const deleteQuestion = useCallback(async (questionId: string) => {
    if (!db) return;
    const ref = doc(getTriviaRef(eventId), questionId);
    await deleteDocument(ref);
    // Also delete associated answers
    const answersQuery = query(
      getTriviaAnswersRef(eventId),
      where('questionId', '==', questionId),
    );
    const snap = await getDocs(answersQuery);
    for (const d of snap.docs) {
      await deleteDocument(d.ref);
    }
  }, [eventId]);

  return {
    questions,
    answers,
    activeQuestion,
    myAnswers,
    myAnswerForQuestion,
    leaderboard,
    getAnswerDistribution,
    submitAnswer,
    addQuestion,
    updateQuestionStatus,
    activateQuestion,
    revealAnswer,
    closeQuestion,
    deleteQuestion,
    loading,
  };
}
