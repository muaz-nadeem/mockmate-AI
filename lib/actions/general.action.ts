"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";
import {
  DEMO_INTERVIEW_ID,
  demoInterview,
  demoFeedback,
} from "@/constants/demo";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return {
      success: true,
      feedbackId: feedbackRef.id,
      feedback: {
        id: feedbackRef.id,
        ...feedback,
      } as Feedback,
    };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  if (id === DEMO_INTERVIEW_ID) return demoInterview;

  const interview = await db.collection("interviews").doc(id).get();
  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  if (!interviewId || !userId) return null;
  if (interviewId === DEMO_INTERVIEW_ID) return demoFeedback;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

// The set of interview IDs the user has already submitted feedback for.
async function getTakenInterviewIds(userId: string): Promise<Set<string>> {
  const feedbackSnap = await db
    .collection("feedback")
    .where("userId", "==", userId)
    .get();

  const ids = new Set<string>();
  feedbackSnap.docs.forEach((doc) => {
    const data = doc.data() as { interviewId?: string };
    if (data.interviewId) ids.add(data.interviewId);
  });
  return ids;
}

// "Take Interviews" -> available interviews the user has NOT yet taken.
export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  if (!userId) return [];

  const [interviewsSnap, takenIds] = await Promise.all([
    db.collection("interviews").where("finalized", "==", true).get(),
    getTakenInterviewIds(userId),
  ]);

  const allInterviews = interviewsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];

  return allInterviews
    .filter((interview) => !takenIds.has(interview.id))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

// "Your Interviews" -> interviews the user has actually TAKEN (has feedback for).
export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  if (!userId) return [];

  const takenIds = Array.from(await getTakenInterviewIds(userId));
  if (takenIds.length === 0) return [];

  const batches: Promise<FirebaseFirestore.QuerySnapshot>[] = [];
  const chunkSize = 30;
  for (let i = 0; i < takenIds.length; i += chunkSize) {
    const chunk = takenIds.slice(i, i + chunkSize);
    batches.push(
      db.collection("interviews").where("__name__", "in", chunk).get()
    );
  }

  const snapshots = await Promise.all(batches);
  const interviews = snapshots.flatMap((snap) =>
    snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  ) as Interview[];

  return interviews.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
 
